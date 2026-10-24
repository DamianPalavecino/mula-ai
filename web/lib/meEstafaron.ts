// Lógica pura de "Me estafaron" (sin red ni LLM): la testea lib/meEstafaron.test.ts con node:test.
// Solo `import type`: así Node lo corre directo (strip types) sin bundler ni dependencias.
import type { EntidadEnRed, EntidadExtraida, Extraccion } from "@/lib/extraccion";
import type { TipoEntidad } from "@/lib/tipos";

const TIPOS: Record<TipoEntidad, string> = {
  alias: "Alias",
  cbu: "CBU",
  cvu: "CVU",
  telefono: "Teléfono",
  cuit: "CUIT/CUIL",
  link: "Link",
};

function plural(n: number, singular: string, pluralForma: string): string {
  return `${n} ${n === 1 ? singular : pluralForma}`;
}

// CUIT/CUIL: 11 dígitos, prefijo conocido y dígito verificador mod 11.
export function cuitValido(digitos: string): boolean {
  if (!/^\d{11}$/.test(digitos) || !["20", "23", "24", "25", "26", "27", "30", "33", "34"].includes(digitos.slice(0, 2))) {
    return false;
  }
  const suma = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2].reduce((acc, peso, i) => acc + peso * Number(digitos[i]), 0);
  const dv = 11 - (suma % 11);
  if (dv === 10) return false;
  return (dv === 11 ? 0 : dv) === Number(digitos[10]);
}

// Link sin esquema, www ni barra final, en minúsculas (aprox. de lo que guarda la base).
function linkBase(valor: string): string {
  return valor.trim().toLowerCase().replace(/^[a-z][a-z0-9+.-]*:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
}

// Descarta lo que la red ignoraría igual (ver detalles del contrato en CLAUDE.md).
function entidadValida(e: EntidadExtraida): EntidadExtraida | null {
  const valor = e.valor.trim();
  if (e.tipo === "alias") {
    const alias = valor.toLowerCase().replace(/\s+/g, "").replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
    return /^[a-z0-9.-]{6,20}$/.test(alias) ? { ...e, valor: alias } : null;
  }
  if (e.tipo === "link") {
    const host = linkBase(valor).split(/[/?#]/)[0];
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? { ...e, valor } : null;
  }
  const digitos = valor.replace(/\D/g, "");
  if (e.tipo === "cuit") {
    return cuitValido(digitos) ? { ...e, valor: `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos[10]}` } : null;
  }
  if (e.tipo === "cbu" || e.tipo === "cvu") {
    if (digitos.length !== 22) return null;
    return { ...e, tipo: digitos.startsWith("000") ? "cvu" : "cbu", valor: digitos };
  }
  return digitos.length >= 8 && digitos.length <= 13 ? { ...e, valor } : null;
}

// Clave aproximada para deduplicar (la normalización real la hace Postgres).
function clave(e: EntidadExtraida): string {
  if (e.tipo === "cuit") return `cuit:${e.valor.replace(/\D/g, "")}`;
  if (e.tipo === "link") return `link:${linkBase(e.valor)}`;
  if (e.tipo !== "telefono") return `${e.tipo}:${e.valor}`;
  return `telefono:${e.valor.replace(/\D/g, "").slice(-10)}`;
}

export function limpiarEntidades(ents: EntidadExtraida[]): EntidadExtraida[] {
  const vistos = new Set<string>();
  return ents
    .map(entidadValida)
    .filter((e): e is EntidadExtraida => !!e)
    .filter((e) => {
      const k = clave(e);
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
}

/** Párrafo para la denuncia con lo que la red ya sabía de estas cuentas, o null. */
export function antecedentesRed(red: EntidadEnRed[]): string | null {
  const conReportes = red.filter((r) => (r.resumen?.reportes ?? 0) > 0);
  if (!conReportes.length) return null;
  const items = conReportes.map(({ entidad, resumen }) => {
    const provincias = resumen!.provincias ?? [];
    const donde = provincias.length
      ? ` en ${plural(provincias.length, "provincia", "provincias")} (${provincias.join(", ")})`
      : "";
    return `${TIPOS[entidad.tipo]} ${entidad.valor}: ${plural(resumen!.reportes, "reporte previo", "reportes previos")}${donde}`;
  });
  return (
    "Antecedentes: según la red de reportes de Mula AI, los siguientes datos utilizados en este hecho ya fueron " +
    `reportados por otras víctimas, lo que indica que se trata de una maniobra reiterada. ${items.join("; ")}.`
  );
}

const pesos = (n: number) => `$${n.toLocaleString("es-AR")}`;
// "2026-10-23" → "23/10/2026"; cualquier otro formato queda como vino.
const dia = (f: string) => f.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3/$2/$1");

type DatosCaso = Pick<Extraccion, "modalidad" | "entidades" | "transferencias" | "monto_total" | "fecha_hecho">;

// Textos armados con plantilla (no con el LLM): salen al instante y nunca inventan datos.
export function armarTextos(x: DatosCaso, provincia: string, antecedentes: string | null) {
  const destino = x.entidades.filter((e) => e.rol === "destino_plata" && e.tipo !== "link");
  const contacto = x.entidades.filter((e) => e.rol !== "destino_plata");
  const lista = (ents: EntidadExtraida[]) => ents.map((e) => `${TIPOS[e.tipo]} ${e.valor}`).join("; ");
  const monto = x.monto_total != null ? pesos(x.monto_total) : "[MONTO]";
  const fecha = x.fecha_hecho ? dia(x.fecha_hecho) : "[FECHA DEL HECHO]";
  const cuentas = destino.length ? lista(destino) : "[CUENTA DE DESTINO]";
  const transferencias = x.transferencias.map((t, i) =>
    `${i + 1}. ${t.monto != null ? pesos(t.monto) : "[MONTO]"}, el ${t.fecha ? dia(t.fecha) : "[FECHA]"}, a ${t.destino ?? "[CUENTA DE DESTINO]"}` +
    (t.titular_destino ? `, titular ${t.titular_destino}` : "") +
    (t.comprobante ? `, operación ${t.comprobante}` : "") + ".",
  );
  const denuncia = [
    `Formulo denuncia penal por estafa${provincia ? ` ante el Ministerio Público de ${provincia}` : ""}.`,
    "Denunciante: [NOMBRE Y APELLIDO], DNI [DNI], con domicilio en [DOMICILIO], teléfono [TELÉFONO], email [EMAIL].",
    `Hechos: el ${fecha} fui contactado/a por una persona que, mediante engaño, me hizo transferir ${monto}. [CONTÁ BREVEMENTE CÓMO FUE EL ENGAÑO].`,
    transferencias.length ? `Transferencias realizadas:\n${transferencias.join("\n")}` : `Transferí ${monto} a: ${cuentas}.`,
    `Cuentas de destino: ${cuentas}.`,
    contacto.length ? `Números y medios usados por los estafadores: ${lista(contacto)}.` : "",
    "Acompaño como prueba las capturas del chat y los comprobantes de transferencia.",
    antecedentes ?? "",
    "Solicito que se investigue el hecho, que se identifique a los titulares de las cuentas y líneas mencionadas y que se ordene el bloqueo de las cuentas de destino y el congelamiento de los fondos.",
    "[LOCALIDAD], [FECHA].\n\nFirma: ____________________",
  ].filter(Boolean).join("\n\n");
  const pedido_bloqueo = [
    "A: [ENTIDAD]",
    `Solicito el bloqueo preventivo de la cuenta de destino y la retención de los fondos de la transferencia de ${monto} realizada el ${fecha}${x.transferencias[0]?.comprobante ? ` (operación ${x.transferencias[0].comprobante})` : ""}, obtenida mediante estafa.`,
    `Cuenta de destino: ${cuentas}.`,
    "Estoy realizando la denuncia penal correspondiente.",
    "[NOMBRE Y APELLIDO], DNI [DNI], teléfono [TELÉFONO].",
  ].join("\n\n");
  const pasos = [
    "Llamá ya a tu banco o billetera, reportá la transferencia y pedí que contacten al banco de destino.",
    "Mandá el pedido de bloqueo por escrito al banco de origen y al de destino.",
    "Hacé la denuncia penal hoy (comisaría, fiscalía o denuncia online).",
    "Si pasaste claves o códigos, cambialos ahora.",
    "Guardá las capturas y comprobantes. No borres el chat.",
    "Desconfiá de quien ofrezca recuperar la plata cobrando.",
  ];
  return { denuncia, pedido_bloqueo, pasos };
}

/** Rate limit en memoria por instancia (alcanza para frenar abusos en la demo). */
export function crearRateLimiter(max: number, ventanaMs: number) {
  const hits = new Map<string, number[]>();
  return (clave: string, ahora = Date.now()): boolean => {
    const recientes = (hits.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
    if (recientes.length >= max) {
      hits.set(clave, recientes);
      return false;
    }
    recientes.push(ahora);
    hits.set(clave, recientes);
    if (hits.size > 5000) hits.clear();
    return true;
  };
}

/** Tope del archivo original (el cliente lo achica a JPEG antes de subirlo). */
export const MAX_BYTES_ORIGINAL = 10 * 1024 * 1024;
export const TIPOS_ACEPTADOS = ["image/png", "image/jpeg"];

/** Error corto para mostrar inline, o null si la captura sirve. */
export function validarArchivo(f: { type: string; size: number }): string | null {
  if (!f.size) return "Archivo vacío";
  if (!TIPOS_ACEPTADOS.includes(f.type)) return "Solo PNG o JPG";
  if (f.size > MAX_BYTES_ORIGINAL) return "Más de 10 MB";
  return null;
}
