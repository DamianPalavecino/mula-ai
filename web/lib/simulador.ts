// Lógica del simulador de dos celulares: llamada a POST /analizar del worker y
// mock local si no hay worker (plan B de la demo). Sin imports de runtime: se
// testea con `node --test` (lib/simulador.test.ts).
import type { Modalidad, RespuestaAnalizar, ResumenEntidad, TipoEntidad } from "./tipos";

export const MENSAJES_DEMO: { etiqueta: string; texto: string }[] = [
  {
    etiqueta: "Familiar número nuevo",
    texto:
      "hola abu, soy Juli, cambié de número. Choqué y necesito plata urgente, mandá a juli.martinez.mp",
  },
  {
    etiqueta: "Falso ANSES",
    texto:
      "Buenas, le hablamos de ANSES. Para cobrar el refuerzo transfiera $5.000 de validación al CBU 0000003100012345678901",
  },
  { etiqueta: "Mensaje normal", texto: "abu, el domingo vamos a comer?" },
];

const PROTEGIDO = "la abuela";

// ---------- red ----------

const NOMBRE_TIPO: Record<TipoEntidad, string> = {
  alias: "El alias",
  cbu: "El CBU",
  cvu: "El CVU",
  telefono: "El número",
};

function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
}

/** La cuenta de destino más reportada (alias/CBU/CVU antes que teléfono). */
export function entidadPrincipal(entidades: ResumenEntidad[]): ResumenEntidad | null {
  const conReportes = entidades.filter((e) => (e.reportes ?? 0) > 0);
  conReportes.sort((a, b) => {
    const pa = a.tipo === "telefono" ? 1 : 0;
    const pb = b.tipo === "telefono" ? 1 : 0;
    return pa - pb || (b.reportes ?? 0) - (a.reportes ?? 0);
  });
  return conReportes[0] ?? null;
}

/** "El alias juli.martinez.mp tiene 24 reportes en 5 provincias." (o null si no hay reportes) */
export function lineaRed(entidades: ResumenEntidad[]): string | null {
  const e = entidadPrincipal(entidades);
  if (!e) return null;
  const nombre = `${NOMBRE_TIPO[e.tipo] ?? "La cuenta"} ${e.valor_normalizado}`;
  const prov = e.provincias?.length ?? 0;
  return `${nombre} tiene ${plural(e.reportes, "reporte", "reportes")}${
    prov > 1 ? ` en ${prov} provincias` : prov === 1 ? ` en ${e.provincias[0]}` : ""
  }.`;
}

/** Corta el texto en tramos normales y *negrita* (formato de WhatsApp). */
export function partesNegrita(texto: string): { texto: string; negrita: boolean }[] {
  return texto
    .split(/(\*[^*\n]+\*)/)
    .filter(Boolean)
    .map((t) =>
      t.length > 2 && t.startsWith("*") && t.endsWith("*")
        ? { texto: t.slice(1, -1), negrita: true }
        : { texto: t, negrita: false },
    );
}

// ---------- mock ----------

type Conocida = Pick<ResumenEntidad, "reportes" | "provincias" | "modalidades" | "monto_total"> & {
  entidad_id: number;
  dias: number;
};

// Lo que la red sintética tiene sembrado (juli: 23 del seed + esta detección).
const RED_CONOCIDA: Record<string, Conocida> = {
  "juli.martinez.mp": {
    entidad_id: 1,
    reportes: 24,
    provincias: ["Buenos Aires", "Córdoba", "Mendoza", "Santa Fe", "Tucumán"],
    modalidades: ["familiar_numero_nuevo", "accidente_o_comisaria"],
    monto_total: 4_380_000,
    dias: 0,
  },
  "0000003100012345678901": {
    entidad_id: 2,
    reportes: 9,
    provincias: ["Buenos Aires", "Chaco", "Salta"],
    modalidades: ["falso_organismo"],
    monto_total: 415_000,
    dias: 2,
  },
};

const PALABRAS: [RegExp, string][] = [
  [/plata|dinero|\$\s?\d|pesos/i, "pide dinero"],
  [/transf(er|ie)|mand[aá]\s+a|deposit/i, "pide una transferencia"],
  [/urgente|ya mismo|r[aá]pido|ahora/i, "urgencia"],
  [/cambi[eé] (de )?n[uú]mero|n[uú]mero nuevo|este es mi nuevo/i, "dice tener número nuevo"],
  [/\b(abu|abuela|abuelo|ma|mam[aá]|pa|pap[aá]|t[ií]a|t[ií]o)\b/i, "dice ser familiar"],
  [/anses|afip|arca|banco|pami|refuerzo|bono/i, "dice ser un organismo"],
  [/choqu[eé]|accidente|comisar[ií]a|polic[ií]a|hospital/i, "accidente o emergencia"],
  [/premio|sorteo|ganaste|ganador/i, "premio o sorteo"],
  [/validaci[oó]n|verificaci[oó]n|c[oó]digo/i, "pide validar con un pago"],
];

function extraerEntidades(texto: string): { tipo: TipoEntidad; valor: string }[] {
  const salida: { tipo: TipoEntidad; valor: string }[] = [];
  const vistos = new Set<string>();
  const sumar = (tipo: TipoEntidad, valor: string) => {
    if (vistos.has(valor)) return;
    vistos.add(valor);
    salida.push({ tipo, valor });
  };
  for (const m of texto.matchAll(/(?<!\d)\d{22}(?!\d)/g)) {
    sumar(m[0].startsWith("000") ? "cvu" : "cbu", m[0]);
  }
  // alias: 6-20 caracteres con al menos un punto, letras primero (no montos tipo 5.000)
  for (const m of texto.toLowerCase().matchAll(/(?<![\w.@-])@?([a-z][a-z0-9-]*(?:\.[a-z0-9-]+)+)(?![\w-])/g)) {
    const valor = m[1];
    if (valor.length >= 6 && valor.length <= 20) sumar("alias", valor);
  }
  return salida;
}

function modalidadDe(senales: string[]): Modalidad {
  if (senales.includes("dice ser un organismo")) return "falso_organismo";
  if (senales.includes("dice tener número nuevo")) return "familiar_numero_nuevo";
  if (senales.includes("accidente o emergencia")) return "accidente_o_comisaria";
  if (senales.includes("premio o sorteo")) return "premio_o_sorteo";
  return "otro";
}

const ETIQUETA_MODALIDAD: Record<Modalidad, string> = {
  familiar_numero_nuevo: "familiar con número nuevo",
  accidente_o_comisaria: "accidente o comisaría",
  falso_organismo: "falso organismo o banco",
  premio_o_sorteo: "premio o sorteo",
  falso_comprador: "falso comprador",
  falsa_venta: "falsa venta",
  inversion: "inversión",
  otro: "otro",
};

function suplantaA(texto: string, modalidad: Modalidad): string | null {
  const soy = texto.match(/\bsoy\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/);
  if (soy && !/^(de|del|la|el)$/i.test(soy[1])) return soy[1];
  if (modalidad === "falso_organismo") {
    const org = texto.match(/\b(ANSES|AFIP|ARCA|PAMI|banco)\b/i);
    if (org) return org[1].toUpperCase() === "BANCO" ? "el banco" : org[1].toUpperCase();
  }
  return null;
}

/** Respuesta creíble con la forma de POST /analizar, sin red ni LLM. */
export function mockAnalizar(texto: string): RespuestaAnalizar {
  const senales = PALABRAS.filter(([re]) => re.test(texto)).map(([, s]) => s);
  const crudas = extraerEntidades(texto);
  const ahora = Date.now();
  const entidades: ResumenEntidad[] = crudas.map(({ tipo, valor }, i) => {
    const c = RED_CONOCIDA[valor];
    return c
      ? {
          entidad_id: c.entidad_id,
          tipo,
          valor_normalizado: valor,
          encontrada: true,
          reportes: c.reportes,
          provincias: c.provincias,
          modalidades: c.modalidades,
          ultimo: new Date(ahora - c.dias * 86_400_000).toISOString(),
          monto_total: c.monto_total,
        }
      : {
          entidad_id: 1000 + i,
          tipo,
          valor_normalizado: valor,
          encontrada: false,
          reportes: 0,
          provincias: [],
          modalidades: [],
          ultimo: null,
          monto_total: null,
        };
  });
  if (crudas.length) senales.push("trae una cuenta para transferir");

  const pidePlata = senales.some((s) => s === "pide dinero" || s === "pide una transferencia");
  const enLaRed = entidades.some((e) => e.reportes > 0);
  const puntaje = senales.length + (enLaRed ? 3 : 0);
  const es_sospechoso = enLaRed || (pidePlata && puntaje >= 3);

  if (!es_sospechoso) {
    return {
      es_sospechoso: false,
      riesgo: Math.min(25, senales.length * 8),
      modalidad: "otro",
      senales,
      suplanta_a: null,
      entidades: [],
      alerta_persona: "",
      alerta_familia: "",
      reporte_id: null,
      alerta_id: null,
      enviada_a: [],
      fuente_clasificacion: "heuristica",
    };
  }

  const modalidad = modalidadDe(senales);
  const suplanta_a = suplantaA(texto, modalidad);
  const riesgo = Math.min(97, 55 + puntaje * 6);
  const red = lineaRed(entidades);
  const principal = entidadPrincipal(entidades) ?? entidades[0] ?? null;
  const familiar = suplanta_a && modalidad !== "falso_organismo" ? suplanta_a : null;

  const persona = ["⚠️ *Mula AI*: Este mensaje tiene el patrón de una estafa."];
  if (red) persona.push(red);
  persona.push("No transfieras.");
  persona.push(
    familiar
      ? `Llamá a ${familiar} al número de siempre.`
      : modalidad === "falso_organismo"
        ? "ANSES y los bancos nunca piden transferencias para cobrar."
        : "Llamá a tu familiar al número de siempre.",
  );
  persona.push("No le respondas a ese número.");

  let familia = `🚨 *Mula AI*: Alguien le escribió a ${PROTEGIDO}`;
  if (suplanta_a) familia += ` haciéndose pasar por ${suplanta_a}`;
  if (principal) {
    familia += ` y pidió plata a ${principal.valor_normalizado}`;
    if (principal.reportes > 1) familia += ` (${plural(principal.reportes, "reporte", "reportes")})`;
  }
  familia += `. Llamá a ${PROTEGIDO} para avisarle.\nRiesgo ${riesgo}/100 · ${ETIQUETA_MODALIDAD[modalidad]}`;

  return {
    es_sospechoso: true,
    riesgo,
    modalidad,
    senales,
    suplanta_a,
    entidades,
    alerta_persona: persona.join(" "),
    alerta_familia: familia,
    reporte_id: null,
    alerta_id: null,
    enviada_a: [],
    fuente_clasificacion: "heuristica",
  };
}

// ---------- llamada al worker ----------

export type ModoSimulador = "worker" | "demo";

function esRespuesta(x: unknown): x is RespuestaAnalizar {
  return (
    !!x &&
    typeof x === "object" &&
    typeof (x as RespuestaAnalizar).es_sospechoso === "boolean" &&
    Array.isArray((x as RespuestaAnalizar).entidades)
  );
}

/**
 * POST {url}/analizar con `{ texto, remitente: "simulador" }`. Sin URL, o si el
 * worker falla / tarda / responde error, devuelve el mock (modo "demo").
 */
export async function analizar(
  texto: string,
  {
    url,
    enviarWhatsapp = false,
    fetcher = fetch,
    timeoutMs = 15_000,
  }: { url?: string | null; enviarWhatsapp?: boolean; fetcher?: typeof fetch; timeoutMs?: number },
): Promise<{ respuesta: RespuestaAnalizar; modo: ModoSimulador }> {
  const demo = () => ({ respuesta: mockAnalizar(texto), modo: "demo" as const });
  if (!url) return demo();
  try {
    const body: Record<string, unknown> = { texto, remitente: "simulador" };
    if (enviarWhatsapp) body.enviar_whatsapp = true;
    const res = await fetcher(`${url.replace(/\/+$/, "")}/analizar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return demo();
    const data: unknown = await res.json();
    return esRespuesta(data) ? { respuesta: data, modo: "worker" } : demo();
  } catch {
    return demo();
  }
}
