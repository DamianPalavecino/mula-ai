import { timingSafeEqual } from 'node:crypto';
import http from 'node:http';
import { normalizarTelefono } from './phone.js';
import type { ResultadoPipeline } from './pipeline.js';

/**
 * Servidor HTTP del worker (plan B de la demo: el simulador web usa la misma IA y la misma red).
 *   GET  /health    → { ok, whatsapp }
 *   POST /analizar  → contrato en CLAUDE.md ("Endpoint HTTP del worker")
 * Sin dependencias: node:http, CORS abierto, body ≤ 20 KB, 30 pedidos/min por IP.
 * Público (Tailscale Funnel): `POST /analizar` exige siempre el header `X-Mula-Token` = `token` (MULA_TOKEN);
 * sin token configurado responde 401 siempre. CORS solo para `origenWeb` (WEB_ORIGIN); `/health` no pide token.
 */

export type EstadoWhatsapp = 'conectado' | 'desconectado' | 'qr';

const MAX_BODY = 20 * 1024;
const MAX_TEXTO = 2000;

export interface PedidoAnalizar {
  texto: string;
  remitente: string | null;
  enviar_whatsapp: boolean;
}

export type Validacion = ({ ok: true } & PedidoAnalizar) | { ok: false; error: string };

export function validarAnalizar(body: unknown): Validacion {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'el body tiene que ser un objeto JSON' };
  const b = body as Record<string, unknown>;
  if (typeof b.texto !== 'string') return { ok: false, error: '"texto" es obligatorio y tiene que ser string' };
  const texto = b.texto.trim();
  if (texto.length < 1 || texto.length > MAX_TEXTO) return { ok: false, error: `"texto" tiene que tener de 1 a ${MAX_TEXTO} caracteres` };
  if (b.remitente != null && typeof b.remitente !== 'string') return { ok: false, error: '"remitente" tiene que ser string' };
  if (b.enviar_whatsapp != null && typeof b.enviar_whatsapp !== 'boolean')
    return { ok: false, error: '"enviar_whatsapp" tiene que ser boolean' };
  return {
    ok: true,
    texto,
    remitente: typeof b.remitente === 'string' ? normalizarTelefono(b.remitente.slice(0, 60)) : null,
    enviar_whatsapp: b.enviar_whatsapp === true,
  };
}

/** Ventana fija en memoria: `max` pedidos por `ventanaMs` por clave (IP). */
export class RateLimiter {
  private hits = new Map<string, { desde: number; n: number }>();
  constructor(
    private max = 30,
    private ventanaMs = 60_000,
    private now: () => number = Date.now,
  ) {}
  permitir(clave: string): boolean {
    const t = this.now();
    const h = this.hits.get(clave);
    if (!h || t - h.desde > this.ventanaMs) {
      this.hits.set(clave, { desde: t, n: 1 });
      if (this.hits.size > 5000) this.hits.delete(this.hits.keys().next().value!);
      return true;
    }
    h.n++;
    return h.n <= this.max;
  }
}

/** Respuesta de `POST /analizar` (contrato con la web, no cambiar). */
export function respuestaAnalizar(r: ResultadoPipeline) {
  const c = r.clasificacion;
  return {
    es_sospechoso: c.es_sospechoso,
    riesgo: c.riesgo,
    modalidad: c.modalidad,
    senales: c.senales,
    suplanta_a: c.suplanta_a,
    entidades: r.resumenes,
    alerta_persona: r.textos.persona,
    alerta_familia: r.textos.familia,
    reporte_id: r.reporte_id,
    alerta_id: r.alerta_id,
    enviada_a: r.enviada_a,
    fuente_clasificacion: c.origen,
  };
}

export interface OpcionesHttp {
  analizar: (p: PedidoAnalizar) => Promise<ResultadoPipeline>;
  estadoWhatsapp: () => EstadoWhatsapp;
  limiter?: RateLimiter;
  /** MULA_TOKEN. Sin token configurado, `POST /analizar` responde 401 siempre. */
  token?: string;
  /** WEB_ORIGIN: único origen con CORS. Sin él no se manda Access-Control-Allow-Origin. */
  origenWeb?: string;
}

/** Headers CORS solo si el Origin del pedido es el de la web. */
function cors(origen: string | undefined, origenWeb: string | undefined): Record<string, string> {
  if (!origenWeb || origen !== origenWeb) return {};
  return {
    'Access-Control-Allow-Origin': origenWeb,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Mula-Token',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

/** Compara el header con el token sin filtrar tiempos. Sin token configurado, nunca coincide. */
export function tokenValido(recibido: string | string[] | undefined, token: string | undefined): boolean {
  if (!token || typeof recibido !== 'string') return false;
  const a = Buffer.from(recibido);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

class ErrorHttp extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function leerBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const partes: Buffer[] = [];
    let total = 0;
    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BODY) {
        reject(new ErrorHttp(400, `body demasiado grande (máx ${MAX_BODY / 1024} KB)`));
        req.resume();
        return;
      }
      partes.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(partes).toString('utf8')));
    req.on('error', reject);
  });
}

/** Solo se confía en X-Forwarded-For si viene del proxy local (Funnel), y se toma el último valor (el que agrega el proxy). */
export function ipCliente(fwd: string | string[] | undefined, remota: string | undefined): string {
  const local = !!remota && /^(127\.|::1$|::ffff:127\.)/.test(remota);
  const ultima = local ? (Array.isArray(fwd) ? fwd.join(',') : fwd)?.split(',').pop()?.trim() : undefined;
  return ultima || remota || '?';
}

export function crearServidorHttp({ analizar, estadoWhatsapp, limiter = new RateLimiter(), token, origenWeb }: OpcionesHttp): http.Server {
  return http.createServer(async (req, res) => {
    const responder = (status: number, body?: unknown) => {
      if (res.headersSent) return;
      res.writeHead(status, { ...cors(req.headers.origin, origenWeb), ...(body !== undefined ? { 'Content-Type': 'application/json; charset=utf-8' } : {}) });
      res.end(body !== undefined ? JSON.stringify(body) : undefined);
    };
    const ruta = (req.url ?? '/').split('?')[0];
    try {
      if (req.method === 'OPTIONS') return responder(204);
      if (req.method === 'GET' && (ruta === '/health' || ruta === '/'))
        return responder(200, { ok: true, whatsapp: estadoWhatsapp() });
      if (ruta !== '/analizar') return responder(404, { error: 'no existe' });
      if (req.method !== 'POST') return responder(405, { error: 'usá POST' });

      const ip = ipCliente(req.headers['x-forwarded-for'], req.socket.remoteAddress);
      if (!limiter.permitir(ip)) return responder(429, { error: 'demasiados pedidos, probá en un minuto' });
      if (!tokenValido(req.headers['x-mula-token'], token)) throw new ErrorHttp(401, 'falta el header X-Mula-Token o no es válido');

      let body: unknown;
      try {
        body = JSON.parse(await leerBody(req));
      } catch (err) {
        if (err instanceof ErrorHttp) throw err;
        throw new ErrorHttp(400, 'JSON inválido');
      }
      const v = validarAnalizar(body);
      if (!v.ok) throw new ErrorHttp(400, v.error);

      const r = await analizar(v);
      console.log(
        `[http] /analizar ${ip} · riesgo ${r.clasificacion.riesgo} · ${r.clasificacion.origen} · ${r.ms} ms` +
          (r.enviada_a.length ? ` · enviada a ${r.enviada_a.join(', ')}` : ''),
      );
      return responder(200, respuestaAnalizar(r));
    } catch (err) {
      if (err instanceof ErrorHttp) return responder(err.status, { error: err.message });
      console.error('[http] error en', req.method, ruta, err);
      return responder(500, { error: 'error interno' });
    }
  });
}

export function iniciarHttp(opts: OpcionesHttp, port = Number(process.env.PORT ?? 8080)): http.Server {
  const server = crearServidorHttp(opts);
  server.on('error', (err) => console.error('[http] no pude levantar el servidor:', err));
  server.listen(port, () => console.log(`[http] escuchando en :${port} (GET /health · POST /analizar)`));
  return server;
}
