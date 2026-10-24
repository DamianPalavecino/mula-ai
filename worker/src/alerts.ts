import { jidNormalizedUser, type WASocket } from '@whiskeysockets/baileys';
import { config } from './config.js';
import type { ResultadoClasificacion } from './classify.js';
import { esCuenta } from './entities.js';
import type { ResumenEntidad } from './network.js';
import type { Destino, Enviador } from './pipeline.js';

export interface TextosAlerta {
  persona: string;
  familia: string;
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
export function armarAlertas(c: ResultadoClasificacion, resumenes: ResumenEntidad[]): TextosAlerta {
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
  const quien = config.protegidoNombre;
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

/**
 * Enviador de WhatsApp para el pipeline: manda al chat propio y al grupo familiar (si está
 * configurado). Nunca le manda nada al remitente. Un destino que falla no corta el otro.
 */
export function enviadorWhatsapp(sock: WASocket): Enviador {
  return async (textos) => {
    const enviados: Array<{ destino: Destino; jid: string }> = [];
    const propio = sock.user?.id ? jidNormalizedUser(sock.user.id) : null;
    const destinos: Array<[Destino, string | null | undefined, string]> = [
      ['propio', propio, textos.persona],
      ['familia', config.familyGroupJid, textos.familia],
    ];
    for (const [destino, jid, text] of destinos) {
      if (!jid) continue;
      try {
        await sock.sendMessage(jid, { text });
        enviados.push({ destino, jid });
      } catch (err) {
        console.error(`[alerts] no pude mandar a ${destino}:`, err);
      }
    }
    return enviados;
  };
}
