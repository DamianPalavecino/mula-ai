import { downloadMediaMessage, type WAMessage, type WASocket } from '@whiskeysockets/baileys';
import type { ILogger } from '@whiskeysockets/baileys/lib/Utils/logger.js';
import { config } from './config.js';

const MODELO = 'gpt-4o-mini-transcribe';

function extension(mime: string | null | undefined): string {
  if (!mime) return 'ogg';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) return 'm4a';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('webm')) return 'webm';
  return 'ogg';
}

/**
 * Si el mensaje es un audio y hay OPENAI_API_KEY, lo baja y lo transcribe.
 * Devuelve null si no hay key, no es audio o falla (nunca tira).
 */
export async function transcribirAudio(msg: WAMessage, sock: WASocket, logger: ILogger): Promise<string | null> {
  const audio = msg.message?.audioMessage;
  if (!audio) return null;
  if (!config.openaiApiKey) {
    console.log('[transcribe] llegó un audio pero no hay OPENAI_API_KEY: no se transcribe');
    return null;
  }
  try {
    const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger, reuploadRequest: sock.updateMediaMessage });
    const mime = audio.mimetype?.split(';')[0] ?? 'audio/ogg';
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(buffer)], { type: mime }), `audio.${extension(mime)}`);
    form.append('model', MODELO);
    form.append('language', 'es');
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.openaiApiKey}` },
      body: form,
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const json = (await res.json()) as { text?: string };
    const texto = json.text?.trim() || null;
    console.log(`[transcribe] audio de ${audio.seconds ?? '?'}s → ${texto ? `"${texto.slice(0, 80)}"` : '(vacío)'}`);
    return texto;
  } catch (err) {
    console.error('[transcribe] falló la transcripción:', err);
    return null;
  }
}
