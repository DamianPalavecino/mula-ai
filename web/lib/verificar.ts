// Validación del input de "verificar" (cliente) y ejemplos de un clic.
// Sin imports de runtime: se testea con `node --test` (lib/verificar.test.ts).
import type { TipoEntidad } from "./tipos";

export type Validacion = { ok: true; tipo: TipoEntidad } | { ok: false; error: string | null };

const PREFIJOS_CUIT = ["20", "23", "24", "27", "30", "33", "34"];

export function validarValor(crudo: string): Validacion {
  const v = crudo.trim();
  if (!v) return { ok: false, error: null };

  if (/^(https?:\/\/|www\.)/i.test(v) || (/\//.test(v) && /\.[a-z]{2,}/i.test(v))) {
    return { ok: true, tipo: "link" };
  }

  const digitos = v.replace(/[\s\-+().]/g, "");
  if (/^\d+$/.test(digitos)) {
    if (digitos.length === 22) return { ok: true, tipo: digitos.startsWith("000") ? "cvu" : "cbu" };
    if (digitos.length >= 14) return { ok: false, error: "Un CBU/CVU tiene 22 dígitos" };
    if (digitos.length === 11 && PREFIJOS_CUIT.some((p) => digitos.startsWith(p))) {
      return { ok: true, tipo: "cuit" };
    }
    if (digitos.length >= 8 && digitos.length <= 13) return { ok: true, tipo: "telefono" };
    return { ok: false, error: "Número incompleto" };
  }

  const alias = v.toLowerCase().replace(/^@/, "");
  if (/^[a-z0-9.-]+$/.test(alias)) {
    if (alias.length >= 6 && alias.length <= 20) return { ok: true, tipo: "alias" };
    return { ok: false, error: "El alias tiene de 6 a 20 caracteres" };
  }
  return { ok: false, error: "Solo letras, números, punto o guion" };
}

// Ejemplos reales de la red (prod, 13:5x): con reportes y uno limpio.
export const EJEMPLOS_VERIFICAR: { valor: string; etiqueta: string; limpio?: boolean }[] = [
  { valor: "juli.martinez.mp", etiqueta: "juli.martinez.mp" },
  { valor: "0110599540000123456782", etiqueta: "CBU 0110…6782" },
  { valor: "1167891234", etiqueta: "Tel. 11 6789-1234" },
  { valor: "maria.lopez.ok", etiqueta: "maria.lopez.ok", limpio: true },
];
