import { normalizarTelefono } from './phone.js';

/**
 * Sesiones de WhatsApp por protegido (cada persona vincula su teléfono escaneando el QR desde la
 * web). La sesión "principal" de la demo (AUTH_DIR, config por env) sigue aparte en index.ts.
 * Acá solo vive el estado; la conexión real con Baileys la hace el `Conector` (sesionWa.ts).
 */

export type EstadoSesion = 'conectado' | 'desconectado' | 'qr' | 'inactiva';

export interface InfoSesion {
  protegido_id: number;
  estado: EstadoSesion;
  /** String del QR para renderizar (vence en ~20 s; Baileys emite uno nuevo solo). */
  qr: string | null;
  /** Teléfono vinculado (10 dígitos), cuando está conectada. */
  telefono: string | null;
}

/** Lo que el conector avisa al gestor. */
export interface EventosSesion {
  qr(qr: string): void;
  abierta(telefono: string | null): void;
  /** Se cortó pero el conector reconecta solo. */
  cerrada(): void;
  /** No vuelve: logout desde el teléfono o QR vencido sin escanear. */
  terminada(): void;
}

export interface ConexionSesion {
  /** `logout` = desvincular el dispositivo y borrar la sesión guardada. */
  cerrar(logout: boolean): Promise<void>;
}

export type Conector = (protegidoId: number, eventos: EventosSesion) => Promise<ConexionSesion>;

/** "3415551234" / "+54 9 341…" → "5493415551234@s.whatsapp.net" (celular AR). */
export function jidDeTelefono(tel: string | null | undefined): string | null {
  const d = normalizarTelefono(tel);
  return d && d.length === 10 ? `549${d}@s.whatsapp.net` : null;
}

/** "/sesiones/7" → 7. Cualquier otra cosa → null. */
export function rutaSesion(ruta: string): number | null {
  const m = /^\/sesiones\/(\d{1,12})$/.exec(ruta);
  const id = m ? Number(m[1]) : 0;
  return id > 0 ? id : null;
}

interface Sesion {
  info: InfoSesion;
  conexion: Promise<ConexionSesion>;
}

export class GestorSesiones {
  private sesiones = new Map<number, Sesion>();
  constructor(
    private conector: Conector,
    private max = 20,
  ) {}

  estado(id: number): InfoSesion {
    return { ...(this.sesiones.get(id)?.info ?? { protegido_id: id, estado: 'inactiva', qr: null, telefono: null }) };
  }

  activas(): number[] {
    return [...this.sesiones.keys()];
  }

  /** Idempotente: si ya hay sesión para ese protegido, devuelve su estado. */
  async iniciar(id: number): Promise<InfoSesion> {
    if (this.sesiones.has(id)) return this.estado(id);
    if (this.sesiones.size >= this.max) throw new Error(`máximo de ${this.max} sesiones simultáneas`);
    const info: InfoSesion = { protegido_id: id, estado: 'desconectado', qr: null, telefono: null };
    const actual = () => this.sesiones.get(id)?.info === info;
    const eventos: EventosSesion = {
      qr: (qr) => actual() && Object.assign(info, { estado: 'qr', qr }),
      abierta: (telefono) => actual() && Object.assign(info, { estado: 'conectado', qr: null, telefono }),
      cerrada: () => actual() && Object.assign(info, { estado: 'desconectado', qr: null }),
      terminada: () => void (actual() && this.sesiones.delete(id)),
    };
    const conexion = this.conector(id, eventos);
    this.sesiones.set(id, { info, conexion });
    try {
      await conexion;
    } catch (err) {
      if (actual()) this.sesiones.delete(id);
      throw err;
    }
    return this.estado(id);
  }

  async desvincular(id: number): Promise<InfoSesion> {
    const s = this.sesiones.get(id);
    this.sesiones.delete(id);
    if (s) await (await s.conexion).cerrar(true);
    return this.estado(id);
  }
}
