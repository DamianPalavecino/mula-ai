// Tipos del contrato Supabase (ver CLAUDE.md en la raíz del repo).

export type TipoEntidad = "alias" | "cbu" | "cvu" | "telefono";
export type TipoNodo = TipoEntidad | "reporte";

export type Modalidad =
  | "familiar_numero_nuevo"
  | "accidente_o_comisaria"
  | "falso_organismo"
  | "premio_o_sorteo"
  | "falso_comprador"
  | "falsa_venta"
  | "inversion"
  | "otro";

// resumen_entidad(valor, tipo?) → jsonb
export interface ResumenEntidad {
  entidad_id: number | null;
  tipo: TipoEntidad;
  valor_normalizado: string;
  encontrada: boolean;
  reportes: number;
  provincias: string[];
  modalidades: string[];
  ultimo: string | null;
  monto_total: number | null;
}

// Nodo de grafo(): "e_<id>" para entidades, "r_<id>" para reportes.
export interface Nodo {
  id: string;
  tipo: TipoNodo;
  label: string;
  reportes?: number; // solo entidades
  modalidad?: string; // solo reportes
  provincia?: string;
  fuente?: string;
  created_at?: string;
}

export interface Link {
  source: string;
  target: string;
}

export interface Grafo {
  nodes: Nodo[];
  links: Link[];
}

// Fila de la tabla public.alertas
export interface Alerta {
  id: number;
  reporte_id: number | null;
  protegido: string | null;
  riesgo: number | null;
  modalidad: string | null;
  mensaje_persona: string | null;
  mensaje_familia: string | null;
  enviada_a: string[] | null;
  entidad_ids: number[] | null;
  created_at: string;
  protegido_id?: number | null;
}

// Fila de public.protegidos (solo service role; la web filtra por owner = Clerk userId).
export interface Protegido {
  id: number;
  owner: string;
  nombre: string | null;
  telefono: string | null;
  contactos_confianza: string[] | null;
  familiares: string[] | null;
  provincia: string | null;
  created_at: string;
}

export const MODALIDADES: Record<Modalidad, string> = {
  familiar_numero_nuevo: "Familiar número nuevo",
  accidente_o_comisaria: "Accidente o comisaría",
  falso_organismo: "Falso organismo",
  premio_o_sorteo: "Premio o sorteo",
  falso_comprador: "Falso comprador",
  falsa_venta: "Falsa venta",
  inversion: "Inversión",
  otro: "Otro",
};

export function labelModalidad(m: string | null | undefined): string {
  if (!m) return "Otro";
  return MODALIDADES[m as Modalidad] ?? m;
}

export const TIPOS_ENTIDAD: Record<TipoEntidad, string> = {
  alias: "Alias",
  cbu: "CBU",
  cvu: "CVU",
  telefono: "Teléfono",
};

// POST {WORKER_URL}/analizar (server-side) → respuesta (contrato del worker).
export interface RespuestaAnalizar {
  es_sospechoso: boolean;
  riesgo: number;
  modalidad: string;
  senales: string[];
  suplanta_a: string | null;
  entidades: ResumenEntidad[];
  alerta_persona: string;
  alerta_familia: string;
  reporte_id: number | null;
  alerta_id: number | null;
  enviada_a: string[];
  fuente_clasificacion: "llm" | "heuristica";
}
