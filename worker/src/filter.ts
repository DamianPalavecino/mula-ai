import { config } from './config.js';
import { detectarEntidades } from './entities.js';

/** Palabras clave de guiones de estafa (se comparan sin tildes y en minúsculas). */
export const PALABRAS_CLAVE = [
  'transferi', 'transferime', 'transferencia', 'transferir', 'urgente', 'urgencia',
  'numero nuevo', 'cambie de numero', 'cambie el numero', 'nuevo numero', 'este es mi numero',
  'anses', 'afip', 'arca', 'cbu', 'cvu', 'alias', 'plata', 'deposita', 'deposito', 'depositame',
  'mandame', 'manda', 'pasame', 'prestame', 'prestamo', 'banco', 'home banking', 'tarjeta',
  'clave', 'codigo', 'token', 'premio', 'sorteo', 'ganaste', 'ganador', 'comisaria', 'accidente',
  'choque', 'abogado', 'inversion', 'invertir', 'cripto', 'mercado pago', 'pesos', 'dolares', 'efectivo',
];

const RISA_O_RELLENO =
  /^(?:(?:j[aeiou]){2,}j?|(?:a?j){2,}|ok|oka|okey|dale|si|no|gracias|genial|joya|bueno|listo|jaj+a?|xd+|[\p{Extended_Pictographic}\s]+)$/iu;

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function tienePalabraClave(texto: string): boolean {
  const t = normalizar(texto);
  return PALABRAS_CLAVE.some((p) => new RegExp(`(?<![a-z])${p}(?![a-z])`).test(t));
}

/**
 * ¿Hay que mandar este mensaje al clasificador?
 * - ANALIZAR_SOLO seteado → solo esos teléfonos (para vincular un número personal en la demo).
 * - Contacto de confianza → nunca (ni se procesa).
 * - Desconocido (o teléfono no resuelto) → sí si tiene más de 2 palabras o trae
 *   entidades / palabras clave. "jaja", "dale", stickers y emojis sueltos se ignoran.
 */
export function debeAnalizar(
  telefono: string | null,
  texto: string | null | undefined,
  confianza: Set<string> = config.trustedContacts,
  solo: Set<string> = config.analizarSolo,
): boolean {
  if (solo.size > 0 && !(telefono && solo.has(telefono))) return false;
  if (telefono && confianza.has(telefono)) return false;
  const t = (texto ?? '').trim();
  if (!t) return false;

  const palabras = t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
  if (palabras.length <= 2 && RISA_O_RELLENO.test(normalizar(t).replace(/[!.?¡¿]+/g, '').trim())) return false;
  // Todo risa/relleno aunque sean varias palabras ("jaja dale ok")
  if (palabras.every((w) => RISA_O_RELLENO.test(normalizar(w).replace(/[!.?¡¿,]+/g, '')))) return false;

  if (palabras.length > 2) return true;
  if (tienePalabraClave(t)) return true;
  return detectarEntidades(t).length > 0;
}
