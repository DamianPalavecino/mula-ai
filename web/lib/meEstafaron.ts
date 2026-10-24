// Lógica pura de "Me estafaron" (sin red ni LLM): la testea lib/meEstafaron.test.ts con node:test.
// Solo `import type`: así Node lo corre directo (strip types) sin bundler ni dependencias.
import type { EntidadEnRed, EntidadExtraida } from "@/lib/extraccion";
import type { TipoEntidad } from "@/lib/tipos";

const TIPOS: Record<TipoEntidad, string> = { alias: "Alias", cbu: "CBU", cvu: "CVU", telefono: "Teléfono" };

function plural(n: number, singular: string, pluralForma: string): string {
  return `${n} ${n === 1 ? singular : pluralForma}`;
}

/** Marca que el modelo deja en la denuncia donde van los antecedentes de la red. */
export const MARCA_RED = "[ANTECEDENTES_RED]";

// Descarta lo que la red ignoraría igual (ver detalles del contrato en CLAUDE.md).
function entidadValida(e: EntidadExtraida): EntidadExtraida | null {
  const valor = e.valor.trim();
  if (e.tipo === "alias") {
    const alias = valor.toLowerCase().replace(/\s+/g, "").replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
    return /^[a-z0-9.-]{6,20}$/.test(alias) ? { ...e, valor: alias } : null;
  }
  const digitos = valor.replace(/\D/g, "");
  if (e.tipo === "cbu" || e.tipo === "cvu") {
    if (digitos.length !== 22) return null;
    return { ...e, tipo: digitos.startsWith("000") ? "cvu" : "cbu", valor: digitos };
  }
  return digitos.length >= 8 && digitos.length <= 13 ? { ...e, valor } : null;
}

// Clave aproximada para deduplicar (la normalización real la hace Postgres).
function clave(e: EntidadExtraida): string {
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

export function insertarAntecedentes(texto: string, parrafo: string | null): string {
  if (texto.includes(MARCA_RED)) {
    return parrafo
      ? texto.replace(MARCA_RED, parrafo)
      : texto.replace(/\n*\[ANTECEDENTES_RED\]/, "");
  }
  return parrafo ? `${texto}\n\n${parrafo}` : texto;
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
