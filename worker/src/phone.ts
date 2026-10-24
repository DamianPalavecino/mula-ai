/**
 * Normalización de teléfonos AR: copia 1:1 de `normalizar('telefono', ...)` en
 * supabase/functions.sql (solo dígitos, sin 54, sin el 9 de celular, sin 0 ni 15 locales →
 * 10 dígitos, ej. 3415551234). Acepta JIDs (5493415551234:12@s.whatsapp.net).
 * Existe para comparar contra TRUSTED_CONTACTS sin ir a la base; si cambia el SQL, cambiá esto.
 */
export function normalizarTelefono(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let v = raw;
  if (v.includes('@')) v = v.split('@')[0]!.split(':')[0]!;
  let d = v.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2); // prefijo internacional 00
  if (d.startsWith('54') && d.length >= 12) d = d.slice(2); // código de país
  if (d.startsWith('9') && (d.length === 11 || d.length === 13)) d = d.slice(1); // 9 de celular
  if (d.startsWith('0')) d = d.slice(1); // 0 de larga distancia
  if (d.length === 12) {
    // área + 15 + número
    if (d.startsWith('11') && d.slice(2, 4) === '15') d = d.slice(0, 2) + d.slice(4); // AMBA
    else if (d.slice(3, 5) === '15') d = d.slice(0, 3) + d.slice(5); // área de 3
    else if (d.slice(4, 6) === '15') d = d.slice(0, 4) + d.slice(6); // área de 4
  }
  return d || null;
}
