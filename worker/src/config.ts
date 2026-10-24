import path from 'node:path';
import dotenv from 'dotenv';
import { normalizarTelefono } from './phone.js';

// Carga worker/.env y, si existe, el de la raíz del monorepo (el primero gana).
dotenv.config({
  path: [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '..', '.env')],
  quiet: true,
});

const env = (k: string): string | undefined => {
  const v = process.env[k]?.trim();
  return v ? v : undefined;
};

const telefonos = (raw: string | undefined): Set<string> =>
  new Set(
    (raw ?? '')
      .split(',')
      .map((t) => normalizarTelefono(t))
      .filter((t): t is string => !!t),
  );

export const config = {
  supabaseUrl: env('SUPABASE_URL'),
  supabaseServiceRoleKey: env('SUPABASE_SERVICE_ROLE_KEY'),
  openrouterApiKey: env('OPENROUTER_API_KEY'),
  classifierModel: env('CLASSIFIER_MODEL') ?? 'deepseek/deepseek-v4-flash',
  classifierTimeoutMs: Number(env('CLASSIFIER_TIMEOUT_MS') ?? 8000),
  /** Si el LLM no contestó en este tiempo y la heurística ya da alerta, se alerta con la heurística. */
  classifierBudgetMs: Number(env('CLASSIFIER_BUDGET_MS') ?? 3500),
  protegidoNombre: env('PROTEGIDO_NOMBRE') ?? 'la persona protegida',
  familyGroupJid: env('FAMILY_GROUP_JID'),
  trustedContacts: telefonos(env('TRUSTED_CONTACTS')),
  /** Si tiene números, solo se analizan esos remitentes (el resto se ignora sin loguear). */
  analizarSolo: telefonos(env('ANALIZAR_SOLO')),
  provinciaDefault: env('PROVINCIA_DEFAULT') ?? 'Santa Fe',
  authDir: path.resolve(env('AUTH_DIR') ?? './auth_info'),
  openaiApiKey: env('OPENAI_API_KEY'),
  /** Token de `POST /analizar` (header X-Mula-Token). HTTP_TOKEN_ENVIO es el nombre viejo. */
  mulaToken: env('MULA_TOKEN') ?? env('HTTP_TOKEN_ENVIO'),
  /** Único origen con CORS en el HTTP del worker (ej. https://mula-ai.vercel.app). */
  webOrigin: env('WEB_ORIGIN'),
  /** Riesgo mínimo (0-100) para mandar alerta. */
  alertThreshold: Number(env('ALERT_THRESHOLD') ?? 60),
};

export type Config = typeof config;

/**
 * Valida lo imprescindible para arrancar el worker. Corta con mensajes claros si falta algo
 * crítico; avisa (sin cortar) por lo opcional.
 */
export function validarConfig(): void {
  const faltan: string[] = [];
  if (!config.supabaseUrl) faltan.push('SUPABASE_URL (URL del proyecto Supabase, https://xxxx.supabase.co)');
  if (!config.supabaseServiceRoleKey)
    faltan.push('SUPABASE_SERVICE_ROLE_KEY (Project Settings → API → service_role; solo en el worker)');
  if (faltan.length) {
    console.error('[config] Faltan variables obligatorias:\n  - ' + faltan.join('\n  - '));
    console.error('[config] Copiá .env.example a .env en worker/ (o en la raíz) y completalas.');
    process.exit(1);
  }
  if (!config.openrouterApiKey)
    console.warn('[config] OPENROUTER_API_KEY no está: se usa solo el clasificador heurístico (sin LLM).');
  if (!config.familyGroupJid)
    console.warn(
      '[config] FAMILY_GROUP_JID no está: las alertas van solo al chat propio. Al conectar se listan los grupos para copiar el JID.',
    );
  if (config.trustedContacts.size === 0)
    console.warn('[config] TRUSTED_CONTACTS vacío: todos los remitentes se tratan como desconocidos.');
  if (config.analizarSolo.size > 0)
    console.warn(`[config] ANALIZAR_SOLO activo: solo se analizan ${config.analizarSolo.size} número(s); el resto se ignora.`);
  if (!config.mulaToken)
    console.warn('[config] MULA_TOKEN no está: POST /analizar rechaza todo con 401 (solo /health responde).');
  if (!config.openaiApiKey) console.warn('[config] OPENAI_API_KEY no está: los audios no se transcriben.');
  if (!process.env.PROTEGIDO_NOMBRE) console.warn('[config] PROTEGIDO_NOMBRE no está: uso "la persona protegida".');
  if ([config.alertThreshold, config.classifierTimeoutMs, config.classifierBudgetMs].some(Number.isNaN)) {
    console.error('[config] ALERT_THRESHOLD, CLASSIFIER_TIMEOUT_MS y CLASSIFIER_BUDGET_MS tienen que ser números.');
    process.exit(1);
  }
}
