import { armarAlertas, type TextosAlerta } from './alerts.js';
import { clasificar, type ResultadoClasificacion } from './classify.js';
import { config } from './config.js';
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

/** Si el clasificador no lo marcó (o quedó bajo el umbral) pero alguna entidad ya tiene reportes en la red, se sube el riesgo. */
async function chequearRed(
  c: ResultadoClasificacion,
  deps: DepsPipeline,
): Promise<{ c: ResultadoClasificacion; resumenes: ResumenEntidad[] }> {
  // Ya alerta solo, o no hay a quién buscar: no hace falta ir a la red.
  if ((c.es_sospechoso && c.riesgo >= deps.umbral) || c.entidades.length === 0) return { c, resumenes: [] };
  const resumenes: ResumenEntidad[] = [];
  for (const e of c.entidades) {
    try {
      resumenes.push(await deps.consultarEntidad(e.valor, e.tipo));
    } catch (err) {
      log('[red] resumen_entidad falló:', err);
    }
  }
  const quemada = resumenes.find((r) => r.encontrada && r.reportes > 0);
  if (!quemada) return { c, resumenes };
  log(`[red] ${quemada.tipo} ${quemada.valor_normalizado} ya tiene ${quemada.reportes} reportes → sospechoso`);
  return {
    resumenes,
    c: {
      ...c,
      es_sospechoso: true,
      riesgo: Math.max(c.riesgo, 75),
      senales: [...c.senales, 'cuenta con reportes previos en la red'],
      modalidad:
        c.modalidad === 'otro' && quemada.modalidades?.[0]
          ? (quemada.modalidades[0] as ResultadoClasificacion['modalidad'])
          : c.modalidad,
    },
  };
}

/**
 * Pipeline de un mensaje, compartido por el listener de WhatsApp y `POST /analizar`:
 * clasificar → chequear la red → registrar_reporte → armar (y mandar) alertas → registrar_alerta.
 * Si la red no responde, igual se alerta (sin registrar).
 */
export async function procesarMensaje(
  { texto, remitente, historial = [], enviar = null }: EntradaPipeline,
  deps: DepsPipeline = depsReales,
): Promise<ResultadoPipeline> {
  const t0 = Date.now();
  const red = await chequearRed(
    await deps.clasificar(texto, { historial, remitente, protegido: deps.protegido }),
    deps,
  );
  const c = red.c;
  let resumenes = red.resumenes;
  const fin = (r: Omit<ResultadoPipeline, 'clasificacion' | 'resumenes' | 'ms'>): ResultadoPipeline => ({
    clasificacion: c,
    resumenes,
    ms: Date.now() - t0,
    ...r,
  });

  if (!c.es_sospechoso)
    return fin({
      textos: { persona: c.alerta_persona, familia: c.alerta_familia },
      reporte_id: null,
      alerta_id: null,
      enviada_a: [],
    });

  let reporte_id: number | null = null;
  try {
    const r = await deps.registrarReporte(c, { texto, remitente });
    reporte_id = r.reporte_id;
    resumenes = r.entidades;
    log(
      `[red] reporte ${reporte_id} · ` +
        (resumenes.map((e) => `${e.valor_normalizado}=${e.reportes} rep/${e.provincias?.length ?? 0} prov`).join(' · ') ||
          'sin entidades'),
    );
  } catch (err) {
    log('[red] registrar_reporte falló (igual se alerta):', err);
  }

  const textos = armarAlertas(c, resumenes);
  if (c.riesgo < deps.umbral) {
    log(`[alerta] riesgo ${c.riesgo} < umbral ${deps.umbral}: no se alerta`);
    return fin({ textos, reporte_id, alerta_id: null, enviada_a: [] });
  }

  const enviados = enviar ? await enviar(textos) : [];

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
