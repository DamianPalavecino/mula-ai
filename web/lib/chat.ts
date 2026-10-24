// Lógica pura del asistente de /app (chat con IA): validar el body, encontrar cuentas en lo que
// escribe la persona y partir el texto de la respuesta. Sin imports de runtime: lib/chat.test.ts.
import type { ResumenEntidad, TipoEntidad } from "./tipos";
import { validarValor } from "./verificar.ts";

export type RolChat = "usuario" | "asistente";

export interface MensajeChat {
  rol: RolChat;
  texto: string;
  /** data URLs JPEG/PNG; solo el último mensaje del usuario las conserva. */
  imagenes: string[];
}

export interface RespuestaChat {
  respuesta: string;
  /** Cuentas que se consultaron en la red para esta respuesta (para mostrarlas como tarjetas). */
  cuentas: ResumenEntidad[];
}

export const MAX_IMAGENES_CHAT = 3;
export const MAX_TEXTO_CHAT = 2000;
export const MAX_HISTORIAL = 12;
const MAX_CANDIDATOS = 5;
// Vercel corta el body en 4,5 MB; el cliente ya achica las fotos a JPEG.
const MAX_CHARS_IMAGENES = 4_000_000;
const PREFIJO_IMAGEN = /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/;

export type Validado = { ok: true; mensajes: MensajeChat[] } | { ok: false; error: string };

export function validarChat(body: unknown): Validado {
  const crudos = (body as { mensajes?: unknown })?.mensajes;
  if (!Array.isArray(crudos) || crudos.length === 0) return { ok: false, error: "Escribí una pregunta." };

  const recientes = crudos.slice(-MAX_HISTORIAL);
  const mensajes: MensajeChat[] = [];
  for (const [i, m] of recientes.entries()) {
    const rol = (m as { rol?: unknown })?.rol;
    if (rol !== "usuario" && rol !== "asistente") return { ok: false, error: "Mensaje inválido." };
    const texto = typeof m.texto === "string" ? m.texto.trim().slice(0, MAX_TEXTO_CHAT) : "";
    const ultimo = i === recientes.length - 1;
    let imagenes: string[] = [];
    if (ultimo && Array.isArray(m.imagenes)) {
      if (m.imagenes.length > MAX_IMAGENES_CHAT) {
        return { ok: false, error: `Podés mandar hasta ${MAX_IMAGENES_CHAT} fotos por mensaje.` };
      }
      if (!m.imagenes.every((x: unknown) => typeof x === "string" && PREFIJO_IMAGEN.test(x))) {
        return { ok: false, error: "Las fotos tienen que ser PNG o JPG." };
      }
      imagenes = m.imagenes as string[];
      if (imagenes.reduce((n, x) => n + x.length, 0) > MAX_CHARS_IMAGENES) {
        return { ok: false, error: "Las fotos pesan demasiado. Probá con menos." };
      }
    }
    if (!texto && !imagenes.length && !ultimo) continue;
    mensajes.push({ rol, texto, imagenes });
  }

  const ultimo = mensajes.at(-1);
  if (!ultimo || ultimo.rol !== "usuario" || (!ultimo.texto && !ultimo.imagenes.length)) {
    return { ok: false, error: "Escribí una pregunta o mandá una captura." };
  }
  return { ok: true, mensajes };
}

const RE_LINK =
  /\b(?:https?:\/\/\S+|www\.\S+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|online|site|xyz|info|app|io|shop|store|club|top|ly|me|link)(?:\.ar)?(?:\/[^\s]*)?)/gi;
const RE_NUMERO = /\+?\d[\d\s\-().]{6,32}\d/g;
const RE_ALIAS = /@?[a-z0-9]+(?:[.-][a-z0-9]+)+/gi;

// Alias, CBU/CVU, teléfonos, CUIT y links que aparecen en el texto, en orden y sin repetir.
export function candidatosEnTexto(texto: string): { tipo: TipoEntidad; valor: string }[] {
  const usados: [number, number][] = [];
  const libre = (a: number, b: number) => usados.every(([x, y]) => b <= x || a >= y);
  const hallados: { i: number; tipo: TipoEntidad; valor: string }[] = [];

  const buscar = (re: RegExp, aceptar: (crudo: string) => { tipo: TipoEntidad; valor: string } | null) => {
    for (const m of texto.matchAll(re)) {
      const a = m.index!;
      const b = a + m[0].length;
      if (!libre(a, b)) continue;
      const c = aceptar(m[0].replace(/[).,;:!?]+$/, ""));
      if (!c) continue;
      usados.push([a, b]);
      hallados.push({ i: a, ...c });
    }
  };

  buscar(RE_LINK, (v) => ({ tipo: "link", valor: v }));
  buscar(RE_NUMERO, (v) => {
    const r = validarValor(v);
    return r.ok ? { tipo: r.tipo, valor: v.replace(/[^\d]/g, "") } : null;
  });
  buscar(RE_ALIAS, (v) => {
    const alias = v.replace(/^@/, "").toLowerCase();
    if (!/[a-z]/.test(alias)) return null;
    const r = validarValor(alias);
    return r.ok && r.tipo === "alias" ? { tipo: "alias", valor: alias } : null;
  });

  const vistos = new Set<string>();
  return hallados
    .sort((x, y) => x.i - y.i)
    .filter((h) => {
      const k = `${h.tipo}:${h.valor}`;
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    })
    .slice(0, MAX_CANDIDATOS)
    .map(({ tipo, valor }) => ({ tipo, valor }));
}

// "*x*" (WhatsApp) y "**x**" (markdown) → negrita. El resto, texto plano.
export function partesTexto(texto: string): { texto: string; negrita: boolean }[] {
  const partes: { texto: string; negrita: boolean }[] = [];
  let desde = 0;
  for (const m of texto.matchAll(/\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g)) {
    if (m.index! > desde) partes.push({ texto: texto.slice(desde, m.index), negrita: false });
    partes.push({ texto: m[1] ?? m[2], negrita: true });
    desde = m.index! + m[0].length;
  }
  if (desde < texto.length) partes.push({ texto: texto.slice(desde), negrita: false });
  return partes;
}
