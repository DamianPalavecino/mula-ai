import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  type WASocket,
} from '@whiskeysockets/baileys';
import { access, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import { baileysLogger, escuchar, log, telefonoDeJid, type ContextoEscucha } from './escucha.js';
import { cargarProtegido, type ProtegidoConfig } from './network.js';
import { normalizarTelefono } from './phone.js';
import { decidirReconexion } from './reconnect.js';
import { jidDeTelefono, type Conector, type GestorSesiones } from './sesiones.js';

/** La config que cargó la web se relee cada tanto: lo que se edita en /app/setup aplica sin reconectar. */
const REFRESCO_MS = 30_000;

function contexto(p: ProtegidoConfig, desdeMs: number): ContextoEscucha {
  const telefonos = (xs: string[] | null) => new Set((xs ?? []).map((t) => normalizarTelefono(t)).filter((t): t is string => !!t));
  return {
    etiqueta: `p${p.id}`,
    desdeMs,
    confianza: telefonos(p.contactos_confianza),
    solo: new Set(),
    familia: (p.familiares ?? []).map(jidDeTelefono).filter((j): j is string => !!j),
    protegido: p.nombre,
    provincia: p.provincia || config.provinciaDefault,
    protegidoId: p.id,
  };
}

/**
 * Conector real (Baileys) de una sesión por protegido. Auth en `<SESIONES_DIR>/<protegido_id>`.
 * Si se corta reconecta sola; si el teléfono la desvincula o el QR vence sin escanear, borra la
 * sesión y avisa `terminada` (la web ofrece un QR nuevo).
 */
export function conectorWhatsapp(dir = config.sesionesDir): Conector {
  return async (id, ev) => {
    const inicial = await cargarProtegido(id);
    if (!inicial) throw new Error(`no existe el protegido ${id}`);
    const authDir = path.join(dir, String(id));
    const desdeMs = Date.now();
    let cache = { at: Date.now(), ctx: contexto(inicial, desdeMs) };
    const ctx = async () => {
      if (Date.now() - cache.at > REFRESCO_MS) {
        cache.at = Date.now();
        const p = await cargarProtegido(id).catch(() => null);
        if (p) cache = { at: Date.now(), ctx: contexto(p, desdeMs) };
      }
      return cache.ctx;
    };

    let cerrado = false;
    let sock: WASocket | null = null;
    let intentos = 0;
    let version: [number, number, number] | undefined;
    try {
      version = (await fetchLatestBaileysVersion()).version;
    } catch {
      version = undefined;
    }

    const terminar = async (motivo: string) => {
      cerrado = true;
      log(`[p${id}] ${motivo}: sesión terminada`);
      await rm(authDir, { recursive: true, force: true }).catch(() => {});
      ev.terminada();
    };

    const abrir = async (): Promise<void> => {
      const { state, saveCreds } = await useMultiFileAuthState(authDir);
      const s = makeWASocket({
        version,
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, baileysLogger) },
        logger: baileysLogger,
        browser: Browsers.macOS('Mula AI'),
        markOnlineOnConnect: false,
        syncFullHistory: false,
      });
      sock = s;
      s.ev.on('creds.update', saveCreds);
      s.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (cerrado) return;
        if (qr) ev.qr(qr);
        if (connection === 'open') {
          intentos = 0;
          const tel = telefonoDeJid(s.user?.id ? jidNormalizedUser(s.user.id) : null);
          log(`[p${id}] conectado como ${tel ?? '?'} (${cache.ctx.protegido})`);
          ev.abierta(tel);
        }
        if (connection === 'close') {
          const code = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode;
          intentos++;
          const d = decidirReconexion(code, intentos);
          if (d.accion === 'relogin') return void (await terminar('se desvinculó desde el teléfono'));
          if (!state.creds.registered && code !== DisconnectReason.restartRequired)
            return void (await terminar('el QR venció sin escanear'));
          log(`[p${id}] ${d.motivo}. Reconecto en ${d.esperaMs / 1000}s…`);
          ev.cerrada();
          setTimeout(() => {
            if (!cerrado) void abrir().catch((e) => log(`[p${id}] error al reconectar:`, e));
          }, d.esperaMs);
        }
      });
      escuchar(s, ctx);
    };

    await abrir();
    return {
      cerrar: async (logout) => {
        cerrado = true;
        try {
          if (logout) await (sock as WASocket | null)?.logout();
          else (sock as WASocket | null)?.end(undefined);
        } catch (err) {
          log(`[p${id}] al cerrar:`, err);
        }
        if (logout) await rm(authDir, { recursive: true, force: true }).catch(() => {});
        log(`[p${id}] sesión ${logout ? 'desvinculada' : 'cerrada'}`);
      },
    };
  };
}

/** Al arrancar, reabre las sesiones que ya estaban vinculadas (tienen creds.json). */
export async function restaurarSesiones(gestor: GestorSesiones, dir = config.sesionesDir): Promise<void> {
  const ids = await readdir(dir).catch(() => [] as string[]);
  for (const nombre of ids) {
    const id = Number(nombre);
    if (!Number.isInteger(id) || id <= 0) continue;
    try {
      await access(path.join(dir, nombre, 'creds.json'));
    } catch {
      continue;
    }
    await gestor.iniciar(id).then(
      () => log(`[sesiones] restaurada p${id}`),
      (e) => log(`[sesiones] no pude restaurar p${id}:`, e),
    );
  }
}
