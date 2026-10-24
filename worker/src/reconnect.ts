import { DisconnectReason } from '@whiskeysockets/baileys';

export interface DecisionReconexion {
  /** `relogin` = la sesión murió: borrar AUTH_DIR y reconectar para mostrar un QR nuevo. */
  accion: 'reconectar' | 'relogin';
  esperaMs: number;
  motivo: string;
}

/** Qué hacer cuando Baileys cierra la conexión, según el status code y los intentos seguidos. */
export function decidirReconexion(code: number | undefined, intentos: number): DecisionReconexion {
  if (code === DisconnectReason.loggedOut)
    return {
      accion: 'relogin',
      esperaMs: 0,
      motivo: 'sesión cerrada (logged out, se desvinculó desde el teléfono): borro la sesión y muestro un QR nuevo',
    };
  if (code === DisconnectReason.restartRequired)
    return { accion: 'reconectar', esperaMs: 0, motivo: 'reinicio pedido por WhatsApp (normal después de escanear el QR)' };
  if (code === DisconnectReason.connectionReplaced)
    return {
      accion: 'reconectar',
      esperaMs: 60_000,
      motivo: 'hay otra instancia con la misma sesión (code 440): dejá una sola réplica / cerrá el worker local',
    };
  return {
    accion: 'reconectar',
    esperaMs: Math.min(30_000, 1000 * 2 ** Math.min(intentos, 5)),
    motivo: `conexión cerrada (code ${code ?? '?'})`,
  };
}
