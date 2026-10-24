import { jidNormalizedUser, type WASocket } from '@whiskeysockets/baileys';
import { config } from './config.js';
import type { ResultadoClasificacion } from './classify.js';
import { esCuenta } from './entities.js';
import type { ResumenEntidad } from './network.js';
import type { Destino, Enviador } from './pipeline.js';

export interface TextosAlerta {
  persona: string;
  familia: string;
  /** PDF con los datos para denunciar; se manda a la familia después del aviso. */
  denuncia?: { pdf: Uint8Array; nombre: string };
}

export const ETIQUETA_MODALIDAD: Record<string, string> = {
  familiar_numero_nuevo: 'familiar con número nuevo',
  accidente_o_comisaria: 'accidente o comisaría',
  falso_organismo: 'falso organismo o banco',
  premio_o_sorteo: 'premio o sorteo',
  falso_comprador: 'falso comprador',
  falsa_venta: 'falsa venta',
  inversion: 'inversión',
  otro: 'otro',
};

const NOMBRE_TIPO: Record<string, string> = {
  alias: 'El alias', cbu: 'El CBU', cvu: 'El CVU', telefono: 'El número', cuit: 'El CUIT', link: 'El link',
};

// Cuentas primero (alias/CBU/CVU, después el CUIT del titular), después links y al final teléfonos.
const PRIORIDAD: Record<string, number> = { alias: 0, cbu: 0, cvu: 0, cuit: 1, link: 2, telefono: 3 };

/** La entidad "de destino" más reportada (cuentas antes que links y teléfonos). */
export function entidadPrincipal(resumenes: ResumenEntidad[]): ResumenEntidad | null {
  const ordenadas = [...resumenes].sort((a, b) => {
    return (PRIORIDAD[a.tipo] ?? 3) - (PRIORIDAD[b.tipo] ?? 3) || (b.reportes ?? 0) - (a.reportes ?? 0);
  });
  return ordenadas[0] ?? null;
}

function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
}

/** "El alias juli.martinez.mp tiene 23 reportes en 5 provincias." */
export function lineaRed(e: ResumenEntidad | null): string | null {
  if (!e) return null;
  const nombre = `${NOMBRE_TIPO[e.tipo] ?? 'La cuenta'} ${e.valor_normalizado}`;
  const n = e.reportes ?? 0;
  if (n <= 1) return `${nombre} quedó registrado en la red para proteger a otros.`;
  const prov = e.provincias?.length ?? 0;
  return `${nombre} tiene ${plural(n, 'reporte', 'reportes')}${prov > 1 ? ` en ${prov} provincias` : ''}.`;
}

function asegurarPunto(s: string): string {
  const t = s.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/** Nombre corto de a quién suplanta, para "Llamá a Juli al número de siempre". */
function nombreFamiliar(suplanta: string | null): string | null {
  if (!suplanta) return null;
  const primero = suplanta.split(/[,(]/)[0]!.trim();
  if (!primero || /^(el|la|un|una)\s/i.test(primero) || /anses|afip|arca|banco|pami|organismo/i.test(primero)) return null;
  return primero;
}

/** Arma los textos finales combinando la salida del LLM con lo que dice la red. */
export function armarAlertas(
  c: ResultadoClasificacion,
  resumenes: ResumenEntidad[],
  quien: string = config.protegidoNombre,
): TextosAlerta {
  const principal = entidadPrincipal(resumenes);
  const red = lineaRed(principal);
  const familiar = nombreFamiliar(c.suplanta_a);

  // --- persona protegida ---
  const p: string[] = ['⚠️ *Mula AI*: Este mensaje tiene el patrón de una estafa.'];
  if (red) p.push(red);
  const base = c.alerta_persona?.trim();
  if (base && !/patr[oó]n de una estafa/i.test(base)) p.push(asegurarPunto(base));
  const yaDice = p.join(' ').toLowerCase();
  if (!/no transfier/.test(yaDice)) p.push('No transfieras.');
  if (!/n[uú]mero de siempre|agendad/.test(yaDice))
    p.push(familiar ? `Llamá a ${familiar} al número de siempre.` : 'Llamá a tu familiar al número de siempre.');
  p.push('No le respondas a ese número.');

  // --- grupo familiar ---
  const destino = principal && esCuenta(principal.tipo) ? principal : null;
  let familia: string;
  if (c.suplanta_a || destino) {
    familia = `🚨 *Mula AI*: Alguien le escribió a ${quien}`;
    if (c.suplanta_a) familia += ` haciéndose pasar por ${c.suplanta_a}`;
    if (destino) {
      const n = destino.reportes ?? 0;
      familia += ` y pidió plata a ${destino.valor_normalizado}`;
      if (n > 1) familia += ` (${plural(n, 'reporte', 'reportes')})`;
    }
    familia += `. Llamá a ${quien} para avisarle.`;
  } else {
    familia = `🚨 *Mula AI*: ${asegurarPunto(c.alerta_familia || `Alguien le escribió a ${quien} con un mensaje sospechoso`)} Llamá a ${quien} para avisarle.`;
  }
  familia += `\nRiesgo ${c.riesgo}/100 · ${ETIQUETA_MODALIDAD[c.modalidad] ?? c.modalidad}`;

  return { persona: p.join(' '), familia };
}

/** Manda un texto a un número (549…, sin @). Tira si no se pudo. */
export type EnviarTexto = (numero: string, text: string) => Promise<void>;

/**
 * Envío por el número de Kapso (WhatsApp Cloud API vía su proxy de Meta). Texto libre: solo llega
 * si el destinatario le escribió a ese número en las últimas 24 h (sin templates).
 */
export function enviadorKapso(apiKey: string, phoneNumberId: string, f: typeof fetch = fetch): EnviarTexto {
  return async (numero, text) => {
    const res = await f(`https://api.kapso.ai/meta/whatsapp/v23.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: numero, type: 'text', text: { body: text } }),
    });
    if (!res.ok) throw new Error(`kapso ${res.status}: ${(await res.text()).slice(0, 300)}`);
  };
}

/** Manda un PDF a un número (549…, sin @) como documento de WhatsApp. Tira si no se pudo. */
export type EnviarDocumento = (numero: string, pdf: Uint8Array, nombre: string, caption: string) => Promise<void>;

/** Documento por Kapso: sube el PDF a /media y lo manda por id (misma ventana de 24 h que el texto). */
export function documentoKapso(apiKey: string, phoneNumberId: string, f: typeof fetch = fetch): EnviarDocumento {
  const base = `https://api.kapso.ai/meta/whatsapp/v23.0/${phoneNumberId}`;
  return async (numero, pdf, nombre, caption) => {
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', 'application/pdf');
    form.append('file', new Blob([pdf], { type: 'application/pdf' }), nombre);
    const up = await f(`${base}/media`, { method: 'POST', headers: { 'X-API-Key': apiKey }, body: form });
    if (!up.ok) throw new Error(`kapso media ${up.status}: ${(await up.text()).slice(0, 300)}`);
    const { id } = (await up.json()) as { id: string };
    const res = await f(`${base}/messages`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: numero, type: 'document', document: { id, filename: nombre, caption } }),
    });
    if (!res.ok) throw new Error(`kapso ${res.status}: ${(await res.text()).slice(0, 300)}`);
  };
}

const CAPTION_DENUNCIA = '📄 Reporte con todos los datos para hacer la denuncia (Santa Fe: mpa.santafe.gov.ar/iris → "Fraude o estafa virtual").';

const kapsoConfig: EnviarTexto | null =
  config.kapsoApiKey && config.kapsoPhoneNumberId ? enviadorKapso(config.kapsoApiKey, config.kapsoPhoneNumberId) : null;
const kapsoDocConfig: EnviarDocumento | null =
  config.kapsoApiKey && config.kapsoPhoneNumberId ? documentoKapso(config.kapsoApiKey, config.kapsoPhoneNumberId) : null;

/**
 * Enviador de WhatsApp para el pipeline: manda al chat propio y a la familia (por defecto el
 * grupo FAMILY_GROUP_JID; en las sesiones por protegido, el chat de cada familiar). Nunca le
 * manda nada al remitente. Un destino que falla no corta el otro. Con Kapso configurado, los
 * números (no los grupos) reciben el aviso desde el número de Kapso; si Kapso falla, por Baileys.
 */
export function enviadorWhatsapp(
  sock: WASocket,
  familia: string[] = config.familyGroupJid ? [config.familyGroupJid] : [],
  kapso: EnviarTexto | null = kapsoConfig,
  kapsoDoc: EnviarDocumento | null = kapsoDocConfig,
): Enviador {
  return async (textos) => {
    const enviados: Array<{ destino: Destino; jid: string }> = [];
    const propio = sock.user?.id ? jidNormalizedUser(sock.user.id) : null;
    const destinos: Array<[Destino, string | null | undefined, string]> = [
      ['propio', propio, textos.persona],
      ...[...new Set(familia)].filter((jid) => jid !== propio).map((jid): [Destino, string, string] => ['familia', jid, textos.familia]),
    ];
    for (const [destino, jid, text] of destinos) {
      if (!jid) continue;
      if (kapso && jid.endsWith('@s.whatsapp.net')) {
        try {
          await kapso(jid.split('@')[0]!, text);
          enviados.push({ destino, jid });
          continue;
        } catch (err) {
          console.error(`[alerts] Kapso no pudo mandar a ${destino}, voy por Baileys:`, err);
        }
      }
      try {
        await sock.sendMessage(jid, { text });
        enviados.push({ destino, jid });
      } catch (err) {
        console.error(`[alerts] no pude mandar a ${destino}:`, err);
      }
    }
    // El PDF para denunciar va después de los avisos (no los demora) y solo a la familia.
    const d = textos.denuncia;
    if (d) {
      for (const { jid } of enviados.filter((e) => e.destino === 'familia')) {
        if (kapsoDoc && jid.endsWith('@s.whatsapp.net')) {
          try {
            await kapsoDoc(jid.split('@')[0]!, d.pdf, d.nombre, CAPTION_DENUNCIA);
            continue;
          } catch (err) {
            console.error('[alerts] Kapso no pudo mandar el PDF, voy por Baileys:', err);
          }
        }
        try {
          await sock.sendMessage(jid, { document: Buffer.from(d.pdf), mimetype: 'application/pdf', fileName: d.nombre, caption: CAPTION_DENUNCIA });
        } catch (err) {
          console.error('[alerts] no pude mandar el PDF de denuncia:', err);
        }
      }
    }
    return enviados;
  };
}
