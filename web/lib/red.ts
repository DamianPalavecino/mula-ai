// Fusión de refrescos de grafo(): conserva los objetos de nodos existentes (con su x/y)
// para que el grafo no se reacomode, y devuelve qué ids son nuevos para destacarlos.
// Sin imports de runtime: se testea con `node --test` (lib/red.test.ts).
import type { Grafo, Nodo } from "./tipos";

export function fusionar(previos: Map<string, Nodo>, nuevo: Grafo): { grafo: Grafo; nuevos: string[] } {
  const primeraCarga = previos.size === 0;
  const nuevos: string[] = [];
  const nodes = (nuevo.nodes ?? []).map((n) => {
    const previo = previos.get(n.id);
    if (previo) return Object.assign(previo, n);
    if (!primeraCarga) nuevos.push(n.id);
    return { ...n };
  });
  previos.clear();
  for (const n of nodes) previos.set(n.id, n);
  return { grafo: { nodes, links: (nuevo.links ?? []).map((l) => ({ ...l })) }, nuevos };
}
