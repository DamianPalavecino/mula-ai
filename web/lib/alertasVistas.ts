// Campana del panel: cuántas alertas no vio todavía (por id, guardado en el browser).
// Sin imports de runtime: se testea con `node --test` (lib/alertasVistas.test.ts).
export function noVistas(alertas: { id: number }[], vistoHasta: number): number {
  return alertas.filter((a) => a.id > vistoHasta).length;
}

export function marcarVistas(alertas: { id: number }[], vistoHasta: number): number {
  return alertas.reduce((m, a) => Math.max(m, a.id), vistoHasta);
}
