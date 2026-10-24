import makeWASocket, {
  Browsers,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  type WASocket,
} from '@whiskeysockets/baileys';
import { rm } from 'node:fs/promises';
import qrcode from 'qrcode-terminal';
import { enviadorWhatsapp } from './alerts.js';
import { config, validarConfig } from './config.js';
import { baileysLogger, escuchar, log } from './escucha.js';
import { iniciarHttp, type EstadoWhatsapp } from './http.js';
import { procesarMensaje as pipeline } from './pipeline.js';
import { decidirReconexion } from './reconnect.js';
import { conectorWhatsapp, restaurarSesiones } from './sesionWa.js';
import { GestorSesiones } from './sesiones.js';

validarConfig();

/** Lo anterior a este momento son chats previos: no se analizan. */
const ARRANQUE_MS = Date.now();

/** Sesión principal (la de la demo): config por env. */
const ctxPrincipal = () => ({
  etiqueta: 'principal',
  desdeMs: ARRANQUE_MS,
  confianza: config.trustedContacts,
  solo: config.analizarSolo,
});

/** Sesiones por protegido (QR desde la web, `/sesiones/:id`). */
const sesiones = new GestorSesiones(conectorWhatsapp(), config.maxSesiones);

// ---------------- conexión ----------------

let intentos = 0;
/** Socket y estado actuales, para que el HTTP pueda mandar alertas reales si WhatsApp está arriba. */
let sockActual: WASocket | null = null;
let estadoWa: EstadoWhatsapp = 'desconectado';

async function listarGrupos(sock: WASocket): Promise<void> {
  try {
    const grupos = await sock.groupFetchAllParticipating();
    const lista = Object.values(grupos);
    if (!lista.length) {
      log('[grupos] este número no está en ningún grupo. Creá el grupo familiar y reiniciá para ver su JID.');
      return;
    }
    log(`[grupos] ${lista.length} grupo(s). Copiá el JID del familiar en FAMILY_GROUP_JID:`);
    for (const g of lista) {
      const marca = g.id === config.familyGroupJid ? '  ← FAMILY_GROUP_JID actual' : '';
      console.log(`    ${g.id}  ${g.subject}${marca}`);
    }
    if (config.familyGroupJid && !grupos[config.familyGroupJid])
      log(`[grupos] OJO: FAMILY_GROUP_JID=${config.familyGroupJid} no está entre los grupos de este número.`);
  } catch (err) {
    log('[grupos] no pude listar grupos:', err);
  }
}

async function conectar(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(config.authDir);
  let version: [number, number, number] | undefined;
  try {
    version = (await fetchLatestBaileysVersion()).version;
  } catch {
    version = undefined; // usa la que trae Baileys
  }

  const sock = makeWASocket({
    version,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, baileysLogger) },
    logger: baileysLogger,
    browser: Browsers.macOS('Mula AI'),
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  sockActual = sock;
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      estadoWa = 'qr';
      log('[qr] Escaneá con WhatsApp → Dispositivos vinculados → Vincular un dispositivo:');
      qrcode.generate(qr, { small: true });
      console.log(`[qr] Si no se ve bien (ej. logs del VPS), copiá este string en un generador de QR:\n${qr}`);
      console.log(
        `[qr] o abrí este link (renderiza el QR; vence en ~20s): https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`,
      );
    }
    if (connection === 'open') {
      intentos = 0;
      estadoWa = 'conectado';
      const propio = sock.user?.id ? jidNormalizedUser(sock.user.id) : '?';
      log(`[wa] conectado como ${propio}${sock.user?.lid ? ` (lid ${jidNormalizedUser(sock.user.lid)})` : ''}`);
      log(`[wa] alertas → chat propio${config.familyGroupJid ? ` + grupo ${config.familyGroupJid}` : ' (sin grupo familiar)'}`);
      await listarGrupos(sock);
    }
    if (connection === 'close') {
      estadoWa = 'desconectado';
      const code = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode;
      intentos++;
      const d = decidirReconexion(code, intentos);
      if (d.accion === 'relogin') {
        // Antes era process.exit(1): Railway reiniciaba con la sesión muerta y quedaba en loop.
        log(`[wa] ⚠️ ${d.motivo} (${config.authDir})`);
        await rm(config.authDir, { recursive: true, force: true }).catch((e) => log('[wa] no pude borrar la sesión:', e));
        intentos = 0;
      } else log(`[wa] ${d.motivo}. Reconecto en ${d.esperaMs / 1000}s…`);
      setTimeout(() => void conectar().catch((e) => log('[wa] error al reconectar:', e)), d.esperaMs);
    }
  });

  escuchar(sock, ctxPrincipal);

  sock.ev.on('call', (calls) => {
    for (const c of calls) if (c.status === 'offer') log(`[call] llamada entrante de ${c.from}`);
  });
}

process.on('unhandledRejection', (e) => log('[unhandledRejection]', e));
process.on('uncaughtException', (e) => log('[uncaughtException]', e));

log(`[mula] worker arrancando · AUTH_DIR=${config.authDir} · modelo=${config.classifierModel} · protegido="${config.protegidoNombre}"`);
iniciarHttp({
  estadoWhatsapp: () => estadoWa,
  token: config.mulaToken,
  origenWeb: config.webOrigin,
  sesiones,
  analizar: ({ texto, remitente, enviar_whatsapp }) =>
    pipeline({
      texto,
      remitente,
      enviar: enviar_whatsapp && estadoWa === 'conectado' && sockActual ? enviadorWhatsapp(sockActual) : null,
    }),
});
conectar().catch((e) => {
  log('[mula] no pude arrancar:', e);
  process.exit(1);
});
void restaurarSesiones(sesiones);
