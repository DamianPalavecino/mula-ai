import { armarAlertas, type TextosAlerta } from './alerts.js';
import { clasificar, type ResultadoClasificacion } from './classify.js';
import { config } from './config.js';
import { clave, dedupe, detectarEntidades, entidadesDeRed, type Entidad } from './entities.js';
import { consultarEntidad, registrarAlerta, registrarReporte, type ResumenEntidad } from './network.js';

const log = (...a: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...a);

export type Destino = 'propio' | 'familia';

/** Manda los textos por algún canal (WhatsApp) y devuelve a dónde llegaron. */
export type Enviador = (textos: TextosAlerta) => Promise<Array<{ destino: Destino; jid: string }>>;

export interface DepsPipeline {
  clasificar: typeof clasificar;
  consultarEntidad: typeof consultarEntidad;
  registrarReporte: typeof registrarReporte;
  registrarAlerta: typeof registrarAlerta;
  /** Riesgo mínimo para alertar. */
  umbral: number;
  protegido: string;
}

const depsReales: DepsPipeline = {
  clasificar,
  consultarEntidad,
  registrarReporte,
  registrarAlerta,
  get umbral() {
    return config.alertThreshold;
  },
  get protegido() {
    return config.protegidoNombre;
  },
};

export interface EntradaPipeline {
  texto: string;
  /** Teléfono normalizado del remitente, o null. */
  remitente: string | null;
  /** Mensajes anteriores del chat, del más viejo al más nuevo. */
  historial?: string[];
  /** Si viene, se usa para mandar las alertas (WhatsApp). Si no, solo se arman los textos. */
  enviar?: Enviador | null;
  /** Cuándo llegó el mensaje (Date.now()), para medir la latencia de punta a punta. Default: ahora. */
  recibido?: number;
}

export interface ResultadoPipeline {
  clasificacion: ResultadoClasificacion;
  /** resumen_entidad de cada entidad (si se registró, los conteos incluyen este reporte). */
  resumenes: ResumenEntidad[];
  textos: TextosAlerta;
  reporte_id: number | null;
  alerta_id: number | null;
  enviada_a: Destino[];
  ms: number;
}

/** resumen_entidad de varias entidades en paralelo, por `clave`. Las que fallan quedan afuera. */
async function consultarVarias(ents: Entidad[], deps: DepsPipeline): Promise<Map<string, ResumenEntidad>> {
  const out = new Map<string, ResumenEntidad>();
  await Promise.all(
    ents.map(async (e) => {
      try {
        out.set(clave(e), await deps.consultarEntidad(e.valor, e.tipo));
      } catch (err) {
        log('[red] resumen_entidad falló:', err);
      }
    }),
  );
  return out;
}

/** Si el clasificador no lo marcó (o quedó bajo el umbral) pero alguna entidad ya tiene reportes en la red, se sube el riesgo. */
function chequearRed(c: ResultadoClasificacion, resumenes: ResumenEntidad[], umbral: number): ResultadoClasificacion {
  if (c.es_sospechoso && c.riesgo >= umbral) return c;
  const quemada = resumenes.find((r) => r.encontrada && r.reportes > 0);
  if (!quemada) return c;
  log(`[red] ${quemada.tipo} ${quemada.valor_normalizado} ya tiene ${quemada.reportes} reportes → sospechoso`);
  return {
    ...c,
    es_sospechoso: true,
    riesgo: Math.max(c.riesgo, 75),
    senales: [...c.senales, 'cuenta con reportes previos en la red'],
    modalidad:
      c.modalidad === 'otro' && quemada.modalidades?.[0]
        ? (quemada.modalidades[0] as ResultadoClasificacion['modalidad'])
        : c.modalidad,
  };
}

/** Cómo va a quedar la entidad cuando se registre este reporte (para alertar antes de escribir en la red). */
function contandoEste(r: ResumenEntidad): ResumenEntidad {
  const provincias = r.provincias ?? [];
  return {
    ...r,
    encontrada: true,
    reportes: (r.reportes ?? 0) + 1,
    provincias: provincias.includes(config.provinciaDefault) ? provincias : [...provincias, config.provinciaDefault],
  };
}

/**
 * Pipeline de un mensaje, compartido por el listener de WhatsApp y `POST /analizar`:
 * clasificar (con la red consultándose en paralelo) → mandar alertas → registrar_reporte (en paralelo
 * con el envío) → registrar_alerta. La alerta sale sin esperar a que se escriba la red: sus conteos
 * ya suman este reporte. Si la red no responde, igual se alerta (sin registrar).
 */
export async function procesarMensaje(
  { texto, remitente, historial = [], enviar = null, recibido }: EntradaPipeline,
  deps: DepsPipeline = depsReales,
): Promise<ResultadoPipeline> {
  const t0 = Date.now();
  const desde = recibido ?? t0;
  const t = { llm: 0, red: 0, envio: 0, alerta: 0 };
  const remitenteEnt: Entidad[] = remitente ? [{ tipo: 'telefono', valor: remitente }] : [];

  // La red se consulta mientras piensa el LLM, con lo que ya se ve por reglas (+ el remitente).
  const previas = dedupe([...entidadesDeRed(detectarEntidades([...historial, texto].join('\n'))), ...remitenteEnt]);
  const enRed = consultarVarias(previas, deps);
  const c0 = await deps.clasificar(texto, { historial, remitente, protegido: deps.protegido });
  t.llm = Date.now() - t0;

  const cache = await enRed;
  const faltan = dedupe([...c0.entidades, ...remitenteEnt]).filter((e) => !cache.has(clave(e)));
  if (faltan.length) for (const [k, v] of await consultarVarias(faltan, deps)) cache.set(k, v);
  const deMensaje = c0.entidades.map((e) => cache.get(clave(e))).filter((r): r is ResumenEntidad => !!r);
  t.red = Date.now() - t0 - t.llm;

  const c = chequearRed(c0, deMensaje, deps.umbral);
  let resumenes = dedupe([...c.entidades, ...remitenteEnt])
    .map((e) => cache.get(clave(e)))
    .filter((r): r is ResumenEntidad => !!r);
  const fin = (r: Omit<ResultadoPipeline, 'clasificacion' | 'resumenes' | 'ms'>): ResultadoPipeline => {
    const ms = Date.now() - t0;
    log(
      `[tiempo] llm=${t.llm}ms red=${t.red}ms envio=${t.envio}ms` +
        (t.alerta ? ` alerta_enviada=${t.alerta}ms` : '') +
        ` total=${ms}ms` +
        (desde !== t0 ? ` (desde recepción ${Date.now() - desde}ms)` : ''),
    );
    return { clasificacion: c, resumenes, ms, ...r };
  };

  if (!c.es_sospechoso)
    return fin({
      textos: { persona: c.alerta_persona, familia: c.alerta_familia },
      reporte_id: null,
      alerta_id: null,
      enviada_a: [],
    });

  const textos = armarAlertas(c, resumenes.map(contandoEste));
  const alertar = c.riesgo >= deps.umbral;
  if (!alertar) log(`[alerta] riesgo ${c.riesgo} < umbral ${deps.umbral}: no se alerta`);

  // Envío y registro en paralelo: la alerta no espera a la base.
  const tEnvio = Date.now();
  const envio =
    alertar && enviar
      ? enviar(textos)
          .catch((err) => {
            log('[alerta] falló el envío:', err);
            return [] as Awaited<ReturnType<Enviador>>;
          })
          .finally(() => {
            t.envio = Date.now() - tEnvio;
            t.alerta = Date.now() - desde;
          })
      : Promise.resolve([]);
  const registro = deps.registrarReporte(c, { texto, remitente }).catch((err) => {
    log('[red] registrar_reporte falló (igual se alerta):', err);
    return null;
  });
  const [enviados, reporte] = await Promise.all([envio, registro]);

  const reporte_id = reporte?.reporte_id ?? null;
  if (reporte) {
    resumenes = reporte.entidades;
    log(
      `[red] reporte ${reporte_id} · ` +
        (resumenes.map((e) => `${e.valor_normalizado}=${e.reportes} rep/${e.provincias?.length ?? 0} prov`).join(' · ') ||
          'sin entidades'),
    );
  }
  if (!alertar) return fin({ textos, reporte_id, alerta_id: null, enviada_a: [] });

  let alerta_id: number | null = null;
  if (reporte_id == null) log('[alerta] la red no respondió: la alerta no queda registrada');
  else {
    try {
      alerta_id = (
        await deps.registrarAlerta({
          reporte_id,
          protegido: deps.protegido,
          riesgo: c.riesgo,
          modalidad: c.modalidad,
          mensaje_persona: textos.persona,
          mensaje_familia: textos.familia,
          enviada_a: enviados.map((e) => e.jid),
          entidad_ids: resumenes.map((r) => r.entidad_id).filter((id): id is number => typeof id === 'number'),
        })
      ).alerta_id;
      log(`[alerta] ${alerta_id} registrada → ${enviados.map((e) => e.destino).join(', ') || '(no se envió)'}`);
    } catch (err) {
      log('[alerta] no pude registrar la alerta:', err);
    }
  }
  return fin({ textos, reporte_id, alerta_id, enviada_a: enviados.map((e) => e.destino) });
}
