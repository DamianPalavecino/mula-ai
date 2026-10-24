import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  isJidGroup,
  isJidNewsletter,
  isJidStatusBroadcast,
  isLidUser,
  isPnUser,
  jidDecode,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  normalizeMessageContent,
  useMultiFileAuthState,
  type WAMessage,
  type WAMessageKey,
  type WASocket,
} from '@whiskeysockets/baileys';
import { rm } from 'node:fs/promises';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { enviadorWhatsapp } from './alerts.js';
import { config, validarConfig } from './config.js';
import { debeAnalizar, esMensajePrevio } from './filter.js';
import { iniciarHttp, type EstadoWhatsapp } from './http.js';
import { normalizarTelefono } from './phone.js';
import { procesarMensaje as pipeline } from './pipeline.js';
import { decidirReconexion } from './reconnect.js';
import { transcribirAudio } from './transcribe.js';

validarConfig();

const baileysLogger = pino({ level: process.env.BAILEYS_LOG_LEVEL ?? 'warn' });
const log = (...a: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ---------------- historial corto en memoria ----------------

/** Lo anterior a este momento son chats previos: no se analizan. */
const ARRANQUE_MS = Date.now();

const HISTORIAL_MAX = 5;
const historial = new Map<string, string[]>();
function pushHistorial(chat: string, texto: string): void {
  const h = historial.get(chat) ?? [];
  h.push(texto);
  while (h.length > HISTORIAL_MAX) h.shift();
  historial.set(chat, h);
}

// Baileys a veces re-entrega el mismo mensaje: dedupe por id.
const procesados = new Set<string>();
function yaProcesado(id: string | null | undefined): boolean {
  if (!id) return false;
  if (procesados.has(id)) return true;
  procesados.add(id);
  if (procesados.size > 2000) procesados.delete(procesados.values().next().value!);
  return false;
}

// ---------------- remitente (@lid → teléfono) ----------------

function telefonoDeJid(jid: string | null | undefined): string | null {
  if (!jid || !isPnUser(jid)) return null;
  return normalizarTelefono(jidDecode(jid)?.user);
}

/**
 * Teléfono real del remitente, normalizado a 10 dígitos. En Baileys 7 los chats 1:1 pueden
 * venir con `remoteJid` en formato `@lid`; el número va en `key.remoteJidAlt` (y en grupos,
 * `participantAlt`). `senderPn` era el nombre en versiones viejas. Último recurso: el mapeo
 * LID→PN que guarda el signal repository. Si no se resuelve → null (desconocido).
 */
async function resolverTelefono(sock: WASocket, key: WAMessageKey): Promise<string | null> {
  const legacy = key as WAMessageKey & { senderPn?: string; participantPn?: string };
  for (const jid of [key.remoteJid, key.remoteJidAlt, legacy.senderPn, key.participant, key.participantAlt, legacy.participantPn]) {
    const tel = telefonoDeJid(jid);
    if (tel) return tel;
  }
  const lid = [key.remoteJid, key.participant].find((j) => j && isLidUser(j));
  if (lid) {
    try {
      const pn = await sock.signalRepository.lidMapping.getPNForLID(lid);
      const tel = telefonoDeJid(pn ? jidNormalizedUser(pn) : null);
      if (tel) return tel;
    } catch (err) {
      log('[lid] no pude mapear', lid, err);
    }
  }
  return null;
}

// ---------------- extracción de texto ----------------

function extraerTexto(msg: WAMessage): string | null {
  const m = normalizeMessageContent(msg.message);
  if (!m) return null;
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    null
  );
}

// ---------------- pipeline por mensaje ----------------

async function procesarMensaje(sock: WASocket, msg: WAMessage): Promise<void> {
  const recibido = Date.now();
  const key = msg.key;
  const chat = key.remoteJid;
  if (!chat || key.fromMe) return;
  if (isJidGroup(chat) || isJidStatusBroadcast(chat) || isJidBroadcast(chat) || isJidNewsletter(chat)) return;
  if (esMensajePrevio(msg.messageTimestamp, ARRANQUE_MS)) return;
  if (yaProcesado(key.id)) return;

  let texto = extraerTexto(msg);
  if (!texto && normalizeMessageContent(msg.message)?.audioMessage) {
    texto = await transcribirAudio({ ...msg, message: normalizeMessageContent(msg.message) }, sock, baileysLogger);
    if (texto) texto = `[audio transcripto] ${texto}`;
  }
  if (!texto) return; // stickers, reacciones, audios sin transcribir, etc.

  const telefono = await resolverTelefono(sock, key);
  const quien = telefono ?? `${chat} (sin número)`;

  if (!debeAnalizar(telefono, texto)) {
    // contactos de confianza ni se loguean con contenido
    if (config.analizarSolo.size > 0 && !(telefono && config.analizarSolo.has(telefono))) return; // fuera de ANALIZAR_SOLO: ni se loguea
    log(`[skip] ${telefono && config.trustedContacts.has(telefono) ? 'contacto de confianza' : 'sin señales'} · ${quien}`);
    return;
  }

  const previos = historial.get(chat) ?? [];
  pushHistorial(chat, texto);
  log(`[msg] ${quien} (${msg.pushName ?? 's/n'}): ${texto.slice(0, 160)}`);

  const r = await pipeline({ texto, remitente: telefono, historial: previos, enviar: enviadorWhatsapp(sock), recibido });
  const c = r.clasificacion;
  log(
    `[clasif:${c.origen}] sospechoso=${c.es_sospechoso} riesgo=${c.riesgo} modalidad=${c.modalidad} ` +
      `entidades=${c.entidades.map((e) => `${e.tipo}:${e.valor}`).join(',') || '-'} · ${r.ms} ms` +
      (r.enviada_a.length ? ` · alerta → ${r.enviada_a.join(', ')}` : ''),
  );
}

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

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        await procesarMensaje(sock, msg);
      } catch (err) {
        log(`[error] procesando ${msg.key?.id ?? '?'}:`, err);
      }
    }
  });

  sock.ev.on('call', (calls) => {
    for (const c of calls) if (c.status === 'offer') log(`[call] llamada entrante de ${c.from}`);
  });
}

process.on('unhandledRejection', (e) => log('[unhandledRejection]', e));
process.on('uncaughtException', (e) => log('[uncaughtException]', e));

log(`[mula] worker arrancando · AUTH_DIR=${config.authDir} · modelo=${config.classifierModel} · protegido="${config.protegidoNombre}"`);
iniciarHttp({
  estadoWhatsapp: () => estadoWa,
  tokenEnvio: process.env.HTTP_TOKEN_ENVIO || undefined,
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
