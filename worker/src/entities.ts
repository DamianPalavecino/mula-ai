/**
 * Detección determinista de entidades en un mensaje: alias, CBU/CVU, teléfonos AR y montos.
 * Acá solo se DETECTA; la normalización final (la que define la identidad en la red) la hace
 * Postgres con `normalizar(tipo, valor)`.
 */

export type TipoEntidadRed = 'alias' | 'cbu' | 'cvu' | 'telefono';
export type TipoEntidad = TipoEntidadRed | 'monto';

export interface Entidad {
  tipo: TipoEntidadRed;
  valor: string;
}

export interface EntidadDetectada {
  tipo: TipoEntidad;
  valor: string;
}

// ---------- CBU / CVU ----------

const PESOS_BLOQUE_1 = [7, 1, 3, 9, 7, 1, 3];
const PESOS_BLOQUE_2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];

function digitoVerificador(digitos: string, pesos: number[]): number {
  let suma = 0;
  for (let i = 0; i < pesos.length; i++) suma += Number(digitos[i]) * pesos[i]!;
  return (10 - (suma % 10)) % 10;
}

/** Valida los dos dígitos verificadores BCRA de un CBU/CVU de 22 dígitos. */
export function validarCbu(digitos: string): boolean {
  if (!/^\d{22}$/.test(digitos)) return false;
  const b1 = digitos.slice(0, 8);
  const b2 = digitos.slice(8);
  return (
    digitoVerificador(b1, PESOS_BLOQUE_1) === Number(b1[7]) &&
    digitoVerificador(b2, PESOS_BLOQUE_2) === Number(b2[13])
  );
}

/** Completa los dígitos verificadores de una base de 20 dígitos (7 + 13). Útil para tests/seed. */
export function completarCbu(base20: string): string {
  if (!/^\d{20}$/.test(base20)) throw new Error('base20 tiene que tener 20 dígitos');
  const b1 = base20.slice(0, 7);
  const b2 = base20.slice(7);
  return b1 + digitoVerificador(b1, PESOS_BLOQUE_1) + b2 + digitoVerificador(b2, PESOS_BLOQUE_2);
}

// ---------- utilidades ----------

/** Reemplaza un rango por espacios para que otros detectores no lo vuelvan a tomar. */
function blanquear(texto: string, inicio: number, fin: number): string {
  return texto.slice(0, inicio) + ' '.repeat(fin - inicio) + texto.slice(fin);
}

function sinTildes(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// ---------- montos ----------

const MULTIPLICADORES: Array<[RegExp, number]> = [
  [/^(mil|k|lucas?)$/i, 1_000],
  [/^(palos?|millon(es)?|millón|M)$/, 1_000_000],
];

function parsearNumero(num: string): number | null {
  let s = num.replace(/\s/g, '');
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, '');
  else s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function multiplicador(unidad: string | undefined): number {
  if (!unidad) return 1;
  for (const [re, m] of MULTIPLICADORES) if (re.test(unidad)) return m;
  return 1;
}

const RE_MONTOS: RegExp[] = [
  // $ 150.000 · $150000 · $ 1.500,50 · $150 mil · $2M
  /\$\s?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d+)?)(?:\s?(mil|k|lucas?|palos?|millones|millón|millon|M)(?![a-záéíóúñ]))?/gi,
  // 150 mil · 150k · 2 palos · 50 lucas · 1,5 millones
  /(?<![\d.,$])(\d+(?:[.,]\d+)?)\s?(mil|k|lucas?|palos?|millones|millón|millon)(?![a-záéíóúñ])/gi,
  // 150.000 pesos · 80000 ars
  /(?<![\d.,$])(\d{1,3}(?:\.\d{3})+|\d{4,})\s?(?:pesos|ars|mangos)(?![a-záéíóúñ])/gi,
];

// ---------- alias ----------

const RE_URL = /\b(?:https?:\/\/|www\.)\S+/gi;
const RE_EMAIL = /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/gi;
const RE_DOMINIO =
  /\b[a-z0-9\-]+(?:\.[a-z0-9\-]+)*\.(?:com|net|org|gob|gov|edu|io|app|ar|info|online|site|store|shop|xyz|me|ly|co)(?:\.ar)?\b(?:\/\S*)?/gi;
const RE_FORMATO_ALIAS = /^[a-z0-9][a-z0-9.\-]{4,18}[a-z0-9]$/; // 6 a 20 caracteres

/** Palabras que pueden ir entre "alias" y el alias real ("el alias es ...", "alias: ..."). */
const STOP_ALIAS = new Set([
  'es', 'de', 'del', 'mi', 'el', 'la', 'al', 'a', 'que', 'nuevo', 'nueva', 'este', 'ese', 'tu', 'su',
  'y', 'para', 'va', 'te', 'paso', 'queda', 'seria', 'sería', 'cbu', 'cvu', 'o', 'ahi', 'ahí', 'mio', 'mío',
]);

function esAliasPlausible(token: string): boolean {
  if (!RE_FORMATO_ALIAS.test(token)) return false;
  if (!/[a-z]/.test(token)) return false; // "150.000" no es alias
  if (/[.\-]{2,}/.test(token)) return false; // "hola...che"
  return true;
}

function limpiarToken(t: string): string {
  return t.replace(/^[.\-]+|[.\-]+$/g, '');
}

function detectarAlias(texto: string): string[] {
  let t = texto.toLowerCase();
  t = t.replace(RE_URL, ' ').replace(RE_EMAIL, ' ').replace(RE_DOMINIO, ' ');
  const tokens = t
    .split(/[\s,;:!?¿¡()"'“”«»*_]+/)
    .map(limpiarToken)
    .filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]!;
    if (tok === 'alias') {
      // tomar el primer token "no stopword" de los 3 siguientes
      for (let j = i + 1; j < Math.min(tokens.length, i + 5); j++) {
        const cand = tokens[j]!;
        if (STOP_ALIAS.has(sinTildes(cand))) continue;
        if (esAliasPlausible(cand)) out.push(cand);
        break;
      }
      continue;
    }
    if (tok.includes('.') && esAliasPlausible(tok)) out.push(tok);
  }
  return out;
}

// ---------- API ----------

/** Detecta alias, CBU/CVU, teléfonos AR y montos. Devuelve [{tipo, valor}] sin duplicados. */
export function detectarEntidades(texto: string): EntidadDetectada[] {
  if (!texto) return [];
  const out: EntidadDetectada[] = [];
  let resto = texto;

  // CBU / CVU (22 dígitos, admite espacios, guiones o puntos entre dígitos)
  for (const m of texto.matchAll(/(?<!\d)\d(?:[ \-.]?\d){21}(?!\d)/g)) {
    const digitos = m[0].replace(/\D/g, '');
    resto = blanquear(resto, m.index!, m.index! + m[0].length);
    if (validarCbu(digitos)) out.push({ tipo: digitos.startsWith('000') ? 'cvu' : 'cbu', valor: digitos });
  }

  // montos (antes que teléfonos, para no confundir "$ 1500000000")
  for (const re of RE_MONTOS) {
    for (const m of resto.matchAll(re)) {
      const n = parsearNumero(m[1]!);
      if (n == null || n <= 0) continue;
      out.push({ tipo: 'monto', valor: String(Math.round(n * multiplicador(m[2]))) });
      resto = blanquear(resto, m.index!, m.index! + m[0].length);
    }
  }

  // teléfonos AR: 10 a 13 dígitos (+54 9 341 555-1234, 0341 15 555 1234, 11 5555-1234)
  for (const m of resto.matchAll(/(?<![\d.,])\+?\d[\d \-()]{8,20}\d(?![\d.,]?\d)/g)) {
    const digitos = m[0].replace(/\D/g, '');
    if (digitos.length < 10 || digitos.length > 13) continue;
    out.push({ tipo: 'telefono', valor: m[0].trim() });
  }

  for (const a of detectarAlias(resto)) out.push({ tipo: 'alias', valor: a });

  return dedupe(out);
}

export function clave(e: EntidadDetectada): string {
  const v = e.tipo === 'alias' ? e.valor.toLowerCase() : e.valor.replace(/\D/g, '');
  return `${e.tipo}:${v}`;
}

export function dedupe<T extends EntidadDetectada>(lista: T[]): T[] {
  const vistos = new Set<string>();
  return lista.filter((e) => {
    const k = clave(e);
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

/** Solo las entidades que van a la red (sin montos). */
export function entidadesDeRed(lista: EntidadDetectada[]): Entidad[] {
  return lista.filter((e): e is Entidad => e.tipo !== 'monto');
}

/** El monto más alto detectado, o null. */
export function montoMaximo(lista: EntidadDetectada[]): number | null {
  const montos = lista.filter((e) => e.tipo === 'monto').map((e) => Number(e.valor));
  return montos.length ? Math.max(...montos) : null;
}
