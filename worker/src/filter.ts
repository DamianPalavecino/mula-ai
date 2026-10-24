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
  // plata en criollo
  'guita', 'luca', 'lucas', 'mango', 'mangos', 'palo', 'palos', 'mil', 'pagar', 'pago', 'pagame', 'cobrar',
  'cobro', 'deuda', 'debo', 'cuota', 'monto', 'saldo', 'presta', 'prestas', 'prestar', 'devuelvo', 'seña',
  'comprobante', 'cuenta', 'billetera', 'uala', 'brubank', 'naranja x', 'lemon', 'binance', 'usdt', 'bitcoin',
  // organismos, policía y salud
  'policia', 'detenido', 'fianza', 'multa', 'hospital', 'operacion', 'internado', 'pami', 'mi argentina',
  'banco nacion', 'galicia', 'santander', 'macro', 'bbva',
  // links, cuentas y beneficios
  'link', 'enlace', 'verifica', 'verificar', 'verificacion', 'bloqueada', 'bloqueado', 'suspendida', 'datos',
  'reintegro', 'reembolso', 'beneficio', 'bono', 'subsidio', 'reclamar', 'ganancia', 'ganancias', 'rendimiento',
  'agendame', 'agenda este', 'guarda este', 'whatsapp nuevo',
];

const LINK = /\b(?:https?:\/\/|www\.)\S+|\b(?:bit\.ly|tinyurl\.com|wa\.me|t\.me)\/\S+/i;
const PLATA = /\$\s?\d|\b\d+\s?(?:k|mil|lucas?|palos?|millones?)\b/i;

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

/** Palabra clave, monto, link o entidad (alias/CBU/CVU/teléfono). Sin nada de eso no se gasta el LLM. */
export function tieneSenales(texto: string): boolean {
  return tienePalabraClave(texto) || LINK.test(texto) || PLATA.test(texto) || detectarEntidades(texto).length > 0;
}

/**
 * ¿Hay que mandar este mensaje al clasificador?
 * - ANALIZAR_SOLO seteado → solo esos teléfonos (para vincular un número personal en la demo).
 * - Contacto de confianza → nunca (ni se procesa).
 * - Desconocido (o teléfono no resuelto) → solo si trae señales (palabra clave de plata/estafa,
 *   monto, link o entidad). La charla común no pasa por el LLM: ahorra tokens. El contexto no se
 *   pierde porque el listener igual guarda los mensajes salteados en el historial del chat.
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

  return tieneSenales(t);
}

/**
 * ¿El mensaje es de antes de que arrancara el worker? Al reconectar, Baileys entrega como
 * `notify` lo que llegó offline; esos chats previos no se analizan. `messageTimestamp` viene
 * en segundos (number o Long). Sin timestamp → se procesa.
 */
export function esMensajePrevio(
  ts: number | { toNumber(): number } | null | undefined,
  desdeMs: number,
): boolean {
  if (ts == null) return false;
  const seg = typeof ts === 'number' ? ts : ts.toNumber();
  return seg * 1000 < desdeMs;
}
