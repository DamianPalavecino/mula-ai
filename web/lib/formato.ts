const relativo = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });

// "hace 3 días", "hace 5 minutos", "ayer"...
export function fechaRelativa(iso: string | null | undefined): string {
  if (!iso) return "—";
  const segundos = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(segundos);
  if (abs < 45) return "recién";
  if (abs < 3600) return relativo.format(Math.round(segundos / 60), "minute");
  if (abs < 86400) return relativo.format(Math.round(segundos / 3600), "hour");
  if (abs < 86400 * 30) return relativo.format(Math.round(segundos / 86400), "day");
  if (abs < 86400 * 365) return relativo.format(Math.round(segundos / (86400 * 30)), "month");
  return relativo.format(Math.round(segundos / (86400 * 365)), "year");
}

export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function monto(valor: number | string | null | undefined): string {
  const n = Number(valor ?? 0);
  return pesos.format(Number.isFinite(n) ? n : 0);
}

export function plural(n: number, singular: string, pluralForma: string): string {
  return `${n} ${n === 1 ? singular : pluralForma}`;
}
