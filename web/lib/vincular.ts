// Vincular el WhatsApp del protegido desde /app/vincular: la web consulta al worker
// (`/sesiones/:protegido_id`, server-only con MULA_TOKEN) y muestra el QR hasta que conecta.

export type EstadoVinculo = "conectado" | "desconectado" | "qr" | "inactiva";

export interface SesionVinculo {
  estado: EstadoVinculo;
  qr: string | null;
  telefono: string | null;
}

const ESTADOS: readonly EstadoVinculo[] = ["conectado", "desconectado", "qr", "inactiva"];

// Respuesta del worker → SesionVinculo, o null si no es una sesión válida.
export function leerSesion(json: unknown): SesionVinculo | null {
  if (!json || typeof json !== "object") return null;
  const j = json as Record<string, unknown>;
  if (!ESTADOS.includes(j.estado as EstadoVinculo)) return null;
  return {
    estado: j.estado as EstadoVinculo,
    qr: typeof j.qr === "string" ? j.qr : null,
    telefono: typeof j.telefono === "string" ? j.telefono : null,
  };
}

// Polling solo mientras hay algo por pasar (QR esperando o reconectando).
export function seguirConsultando(estado: EstadoVinculo): boolean {
  return estado === "qr" || estado === "desconectado";
}

export function textoEstado(estado: EstadoVinculo, nombre: string): { titulo: string; detalle: string } {
  switch (estado) {
    case "conectado":
      return {
        titulo: `El WhatsApp de ${nombre} está vinculado.`,
        detalle: "Mula ya lee sus mensajes nuevos y te avisa si algo necesita tu atención.",
      };
    case "qr":
      return {
        titulo: "Escaneá el código desde su teléfono.",
        detalle: "El código se renueva solo cada unos segundos. Dejá esta pantalla abierta.",
      };
    case "desconectado":
      return { titulo: "Conectando…", detalle: "Estamos abriendo la sesión de WhatsApp." };
    default:
      return {
        titulo: `Vinculá el WhatsApp de ${nombre}.`,
        detalle: "Como WhatsApp Web: escaneás un código desde su teléfono. No hay que instalarle nada.",
      };
  }
}
