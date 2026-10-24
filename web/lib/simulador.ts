// Helpers puros de formato WhatsApp (los usa AlertFeed). Sin red ni imports de runtime:
// se testea con `node --test` (lib/simulador.test.ts).

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
