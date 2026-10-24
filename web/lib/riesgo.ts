// Riesgo de una entidad en el grafo según cuántos reportes tiene. Lógica pura (la testea
// lib/riesgo.test.ts); los colores de cada nivel están en components/colores.ts.
import type { Nodo } from "@/lib/tipos";

export type NivelRiesgo = 0 | 1 | 2 | 3;

export const NIVELES_RIESGO: { nivel: NivelRiesgo; desde: number; rotulo: string }[] = [
  { nivel: 0, desde: 1, rotulo: "1" },
  { nivel: 1, desde: 2, rotulo: "2–4" },
  { nivel: 2, desde: 5, rotulo: "5–9" },
  { nivel: 3, desde: 10, rotulo: "10+" },
];

export function nivelRiesgo(reportes: number): NivelRiesgo {
  if (reportes >= 10) return 3;
  if (reportes >= 5) return 2;
  if (reportes >= 2) return 1;
  return 0;
}

/** Las entidades más denunciadas (≥ 2 reportes), de mayor a menor; desempata por valor. */
export function topDenunciados(nodos: Nodo[], n: number): Nodo[] {
  return nodos
    .filter((x) => x.tipo !== "reporte" && (x.reportes ?? 0) >= 2)
    .sort((a, b) => (b.reportes ?? 0) - (a.reportes ?? 0) || a.label.localeCompare(b.label))
    .slice(0, n);
}

export function etiquetaNodo(n: Nodo): string {
  return `${n.label} · ${n.reportes ?? 0}`;
}
