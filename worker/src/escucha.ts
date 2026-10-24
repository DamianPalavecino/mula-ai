import {
  isJidBroadcast,
  isJidGroup,
  isJidNewsletter,
  isJidStatusBroadcast,
  isLidUser,
  isPnUser,
  jidDecode,
  jidNormalizedUser,
  normalizeMessageContent,
  type WAMessage,
  type WAMessageKey,
  type WASocket,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { enviadorWhatsapp } from './alerts.js';
import { debeAnalizar, esMensajePrevio } from './filter.js';
import { normalizarTelefono } from './phone.js';
import { procesarMensaje as pipeline } from './pipeline.js';
import { transcribirAudio } from './transcribe.js';

/**
 * Listener de mensajes de una sesión de WhatsApp, compartido por la sesión principal (index.ts,
 * config por env) y las sesiones por protegido (sesionWa.ts, config de la tabla `protegidos`).
 */

export const baileysLogger = pino({ level: process.env.BAILEYS_LOG_LEVEL ?? 'warn' });
export const log = (...a: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...a);

export interface ContextoEscucha {
  /** Prefijo de logs y de las claves en memoria ("principal", "p7"). */
  etiqueta: string;
  /** Lo anterior a este momento son chats previos: no se analizan. */
  desdeMs: number;
  confianza: Set<string>;
  solo: Set<string>;
  /** JIDs que reciben el aviso a la familia. Sin definir → FAMILY_GROUP_JID. */
  familia?: string[];
  protegido?: string;
  provincia?: string;
  protegidoId?: number | null;
}

// ---------------- historial corto en memoria ----------------

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

export function telefonoDeJid(jid: string | null | undefined): string | null {
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

export async function procesarMensaje(sock: WASocket, msg: WAMessage, ctx: ContextoEscucha): Promise<void> {
  const recibido = Date.now();
  const key = msg.key;
  const chat = key.remoteJid;
  if (!chat || key.fromMe) return;
  if (isJidGroup(chat) || isJidStatusBroadcast(chat) || isJidBroadcast(chat) || isJidNewsletter(chat)) return;
  if (esMensajePrevio(msg.messageTimestamp, ctx.desdeMs)) return;
  if (yaProcesado(key.id && `${ctx.etiqueta}|${key.id}`)) return;
  const clave = `${ctx.etiqueta}|${chat}`;
  const pre = ctx.etiqueta === 'principal' ? '' : `[${ctx.etiqueta}] `;

  let texto = extraerTexto(msg);
  if (!texto && normalizeMessageContent(msg.message)?.audioMessage) {
    texto = await transcribirAudio({ ...msg, message: normalizeMessageContent(msg.message) }, sock, baileysLogger);
    if (texto) texto = `[audio transcripto] ${texto}`;
  }
  if (!texto) return; // stickers, reacciones, audios sin transcribir, etc.

  const telefono = await resolverTelefono(sock, key);
  const quien = telefono ?? `${chat} (sin número)`;

  if (!debeAnalizar(telefono, texto, ctx.confianza, ctx.solo)) {
    // contactos de confianza ni se loguean con contenido
    if (ctx.solo.size > 0 && !(telefono && ctx.solo.has(telefono))) return; // fuera de ANALIZAR_SOLO: ni se loguea
    const confiable = !!telefono && ctx.confianza.has(telefono);
    // Sin señales no gasta LLM, pero queda como contexto por si el próximo mensaje sí las trae.
    if (!confiable) pushHistorial(clave, texto);
    log(`${pre}[skip] ${confiable ? 'contacto de confianza' : 'sin señales'} · ${quien}`);
    return;
  }

  const previos = historial.get(clave) ?? [];
  pushHistorial(clave, texto);
  log(`${pre}[msg] ${quien} (${msg.pushName ?? 's/n'}): ${texto.slice(0, 160)}`);

  const r = await pipeline({
    texto,
    remitente: telefono,
    historial: previos,
    enviar: enviadorWhatsapp(sock, ctx.familia),
    recibido,
    protegido: ctx.protegido,
    provincia: ctx.provincia,
    protegidoId: ctx.protegidoId,
  });
  const c = r.clasificacion;
  log(
    `${pre}[clasif:${c.origen}] sospechoso=${c.es_sospechoso} riesgo=${c.riesgo} modalidad=${c.modalidad} ` +
      `entidades=${c.entidades.map((e) => `${e.tipo}:${e.valor}`).join(',') || '-'} · ${r.ms} ms` +
      (r.enviada_a.length ? ` · alerta → ${r.enviada_a.join(', ')}` : ''),
  );
}

/** Engancha el listener a `messages.upsert`. `ctx` se pide por mensaje (las sesiones refrescan su config). */
export function escuchar(sock: WASocket, ctx: () => ContextoEscucha | Promise<ContextoEscucha>): void {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        await procesarMensaje(sock, msg, await ctx());
      } catch (err) {
        log(`[error] procesando ${msg.key?.id ?? '?'}:`, err);
      }
    }
  });
}
