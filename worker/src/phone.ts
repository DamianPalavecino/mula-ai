/**
 * Normalización de teléfonos AR, misma regla que `normalizar('telefono', ...)` del contrato:
 * solo dígitos, sin 54, sin el 9 de celular, sin 0 ni 15 locales → 10 dígitos (ej. 3415551234).
 * La normalización "oficial" la hace Postgres; esta copia existe para comparar contra
 * TRUSTED_CONTACTS sin ir a la base.
 */
export function normalizarTelefono(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2); // prefijo internacional 00
  if (d.startsWith('54') && d.length >= 12) d = d.slice(2);
  if (d.startsWith('9') && d.length === 11) d = d.slice(1);
  if (d.startsWith('0')) d = d.slice(1);
  // "15" local después del código de área (2, 3 o 4 dígitos): 341 15 555-1234 → 3415551234
  if (d.length === 12) {
    for (const area of [2, 3, 4]) {
      if (d.slice(area, area + 2) === '15') {
        d = d.slice(0, area) + d.slice(area + 2);
        break;
      }
    }
  }
  return d;
}
