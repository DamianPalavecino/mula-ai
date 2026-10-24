// Estadísticas puras del panel /admin (sin imports: corre también bajo node --test).

const LABELS: Record<string, string> = {
  familiar_numero_nuevo: "Familiar número nuevo",
  accidente_o_comisaria: "Accidente o comisaría",
  falso_organismo: "Falso organismo",
  premio_o_sorteo: "Premio o sorteo",
  falso_comprador: "Falso comprador",
  falsa_venta: "Falsa venta",
  inversion: "Inversión",
  otro: "Otro",
};

export interface Conteo {
  clave: string;
  label: string;
  n: number;
}

export interface Stats {
  total: number;
  porProvincia: Conteo[]; // top 8
  porModalidad: Conteo[];
  provinciasConReportes: number;
}

function contar(valores: (string | null | undefined)[], label: (c: string) => string): Conteo[] {
  const mapa = new Map<string, number>();
  for (const v of valores) {
    if (!v) continue;
    mapa.set(v, (mapa.get(v) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([clave, n]) => ({ clave, label: label(clave), n }))
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
}

export function calcularStats(
  filas: { provincia?: string | null; modalidad?: string | null }[],
): Stats {
  const provincias = contar(
    filas.map((f) => f.provincia),
    (c) => c,
  );
  return {
    total: filas.length,
    porProvincia: provincias.slice(0, 8),
    porModalidad: contar(
      filas.map((f) => f.modalidad),
      (c) => LABELS[c] ?? c,
    ),
    provinciasConReportes: provincias.length,
  };
}

export function entidadesDistintas(grafo: { nodes?: { id: string }[] } | null | undefined): number {
  return (grafo?.nodes ?? []).filter((n) => n.id.startsWith("e_")).length;
}

export function alertasUltimas24h(alertas: { created_at: string }[], ahora = Date.now()): number {
  const desde = ahora - 24 * 3600 * 1000;
  return alertas.filter((a) => new Date(a.created_at).getTime() >= desde).length;
}

// La red la ve cualquier usuario logueado: a quien no es admin no le mostramos a quién
// protege cada alerta ni sus mensajes (son de otros usuarios).
type AlertaPrivada = {
  protegido: string | null;
  mensaje_persona: string | null;
  mensaje_familia: string | null;
  enviada_a: string[] | null;
  protegido_id?: number | null;
};

export function alertaParaRol<T extends AlertaPrivada>(a: T, rol: "admin" | "usuario"): T {
  if (rol === "admin") return a;
  return { ...a, protegido: null, mensaje_persona: null, mensaje_familia: null, enviada_a: null, protegido_id: null };
}
