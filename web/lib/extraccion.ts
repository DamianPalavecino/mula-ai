// Tipos de /api/extraer y /me-estafaron/registrar ("Me estafaron"). Compartidos entre server y browser.
import type { Modalidad, ResumenEntidad, TipoEntidad } from "@/lib/tipos";

export const MODALIDADES_LISTA: Modalidad[] = [
  "familiar_numero_nuevo",
  "accidente_o_comisaria",
  "falso_organismo",
  "premio_o_sorteo",
  "falso_comprador",
  "falsa_venta",
  "inversion",
  "otro",
];

export const PROVINCIAS = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

export type RolEntidad = "destino_plata" | "contacto_estafador" | "otro";

export interface EntidadExtraida {
  tipo: TipoEntidad;
  valor: string;
  rol: RolEntidad;
  /** Dónde se vio: "captura 2", "relato"... */
  donde: string;
}

export interface Transferencia {
  monto: number | null;
  fecha: string | null;
  destino: string | null;
  titular_destino: string | null;
  comprobante: string | null;
}

// Salida estructurada del modelo (esquema en app/api/extraer/route.ts).
export interface Extraccion {
  legible: boolean;
  modalidad: Modalidad;
  resumen: string;
  suplanta_a: string | null;
  senales: string[];
  entidades: EntidadExtraida[];
  transferencias: Transferencia[];
  monto_total: number | null;
  fecha_hecho: string | null;
  cronologia: string[];
  denuncia: string;
  pedido_bloqueo: string;
  pasos: string[];
}

export interface EntidadEnRed {
  entidad: EntidadExtraida;
  /** null si la red no está configurada o la consulta falló. */
  resumen: ResumenEntidad | null;
}

export interface RespuestaExtraer {
  extraccion: Extraccion;
  red: EntidadEnRed[];
  /** Si el server puede sumar el caso a la red (hay service role configurada). */
  puede_registrar: boolean;
}

export interface RespuestaReporte {
  reporte_id: number;
  entidades: ResumenEntidad[];
}
