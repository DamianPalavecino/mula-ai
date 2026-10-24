import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import { ETIQUETA_MODALIDAD } from './alerts.js';
import type { ResultadoClasificacion } from './classify.js';
import type { ResumenEntidad } from './network.js';

export interface DatosDenuncia {
  c: ResultadoClasificacion;
  resumenes: ResumenEntidad[];
  texto: string;
  historial?: string[];
  remitente: string | null;
  protegido: string;
  provincia: string;
  fecha?: Date;
}

export interface Seccion {
  titulo: string;
  lineas: string[];
}

const TIPO: Record<string, string> = {
  alias: 'Alias', cbu: 'CBU', cvu: 'CVU', telefono: 'Teléfono', cuit: 'CUIT/CUIL', link: 'Sitio/link',
};

const MPA_SANTA_FE = 'https://mpa.santafe.gov.ar/iris/';

const pesos = (n: number) => `$ ${n.toLocaleString('es-AR')}`;

function cuando(d: Date): string {
  return d.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'long', timeStyle: 'short' });
}

/** "+54 9 341 555-1234" a partir de los 10 dígitos normalizados. */
function telefono(t: string): string {
  return t.length === 10 ? `+54 9 ${t.slice(0, 3)} ${t.slice(3, 6)}-${t.slice(6)}` : t;
}

function lineaEntidad(e: ResumenEntidad): string {
  const valor = e.tipo === 'telefono' ? telefono(e.valor_normalizado) : e.valor_normalizado;
  let l = `${TIPO[e.tipo] ?? e.tipo}: ${valor}`;
  const n = e.reportes ?? 0;
  if (n > 0) {
    l += ` — ${n} ${n === 1 ? 'reporte' : 'reportes'} en la red Mula`;
    if (e.provincias?.length) l += ` (${e.provincias.join(', ')})`;
    if (e.modalidades?.length) l += `; modalidades: ${e.modalidades.map((m) => ETIQUETA_MODALIDAD[m] ?? m).join(', ')}`;
    if (e.monto_total) l += `; ${pesos(e.monto_total)} reportados`;
  }
  return l;
}

/** Contenido del reporte para denunciar, en secciones (lo usa el PDF y se testea sin PDF). */
export function armarDenuncia(d: DatosDenuncia): Seccion[] {
  const fecha = d.fecha ?? new Date();
  const { c } = d;
  const modalidad = ETIQUETA_MODALIDAD[c.modalidad] ?? c.modalidad;
  const cuentas = d.resumenes.filter((e) => e.tipo !== 'telefono' && e.tipo !== 'link');
  const otros = d.resumenes.filter((e) => e.tipo === 'telefono' || e.tipo === 'link');
  const remitente = d.remitente ? telefono(d.remitente) : '[NÚMERO QUE ESCRIBIÓ]';
  const listaCuentas = cuentas.map((e) => `${TIPO[e.tipo]} ${e.valor_normalizado}`).join('; ') || '[CUENTA INFORMADA]';

  return [
    {
      titulo: 'Dónde denunciar',
      lineas: [
        `Santa Fe: denuncia online en ${MPA_SANTA_FE} → "Fraude o estafa virtual".`,
        'Otras provincias: comisaría, fiscalía o la web del Ministerio Público de la provincia.',
        'Si hubo transferencia: llamá ya al banco o billetera y pedí el bloqueo de la cuenta de destino.',
      ],
    },
    {
      titulo: 'Datos del hecho',
      lineas: [
        `Fecha y hora: ${cuando(fecha)}`,
        `Persona contactada: ${d.protegido}${d.provincia ? ` (${d.provincia})` : ''}`,
        'Medio: WhatsApp',
        `Número que escribió: ${remitente}`,
        `Se hizo pasar por: ${c.suplanta_a ?? '—'}`,
        `Modalidad: ${modalidad}`,
        `Monto pedido: ${c.monto != null ? pesos(c.monto) : '—'}`,
        `Riesgo detectado por Mula AI: ${c.riesgo}/100`,
        ...(c.senales.length ? [`Señales: ${c.senales.join('; ')}`] : []),
      ],
    },
    {
      titulo: 'Cuentas y datos del estafador',
      lineas: d.resumenes.length ? [...cuentas, ...otros].map(lineaEntidad) : ['No se detectaron cuentas ni números en el mensaje.'],
    },
    {
      titulo: 'Mensaje recibido (textual)',
      lineas: [...(d.historial ?? []).slice(-5), d.texto].map((m) => `"${m}"`),
    },
    {
      titulo: 'Datos del denunciante (completar)',
      lineas: ['Nombre y apellido:', 'DNI:', 'Domicilio:', 'Teléfono:', 'Email:', 'Vínculo con la persona contactada:'],
    },
    {
      titulo: 'Texto sugerido para la denuncia',
      lineas: [
        `El ${cuando(fecha)}, ${d.protegido} recibió por WhatsApp, desde el número ${remitente}, mensajes de una persona que ` +
          `${c.suplanta_a ? `se hizo pasar por ${c.suplanta_a}` : 'mediante engaño'} con la modalidad "${modalidad}"` +
          `${c.monto != null ? ` y pidió ${pesos(c.monto)}` : ' y pidió dinero'}, a transferir a: ${listaCuentas}.`,
        ...(cuentas.some((e) => (e.reportes ?? 0) > 1)
          ? [`Según la red Mula AI, ${cuentas.filter((e) => (e.reportes ?? 0) > 1).map(lineaEntidad).join('; ')}.`]
          : []),
        'Solicito que se investigue el hecho, se identifique a los titulares de las cuentas y líneas mencionadas y se ordene ' +
          'el bloqueo preventivo de las cuentas de destino.',
        'Acompaño capturas del chat donde se ve el número y los mensajes.',
      ],
    },
    {
      titulo: 'Qué adjuntar',
      lineas: [
        'Capturas del chat completo, con el número visible.',
        'Comprobantes de transferencia, si se llegó a transferir.',
        'Este reporte. No borres el chat ni bloquees el número hasta denunciar.',
      ],
    },
  ];
}

/** Helvetica estándar solo codifica WinAnsi: saco emojis y otros caracteres que no entran. */
function limpiar(s: string): string {
  return s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, '-').replace(/·/g, '·').replace(/→/g, '>').replace(/[^\n\x20-\x7e\xa0-\xff•]/g, '');
}

function partir(texto: string, font: PDFFont, size: number, ancho: number): string[] {
  const out: string[] = [];
  for (const parrafo of texto.split('\n')) {
    let linea = '';
    for (const palabra of parrafo.split(/\s+/)) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (font.widthOfTextAtSize(prueba, size) > ancho && linea) {
        out.push(linea);
        linea = palabra;
      } else linea = prueba;
    }
    out.push(linea);
  }
  return out;
}

/** PDF A4 con el reporte para denunciar. */
export async function pdfDenuncia(d: DatosDenuncia): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle('Mula AI - Reporte para denuncia');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold);
  const [W, H, M] = [595, 842, 50];
  let page = doc.addPage([W, H]);
  let y = H - M;
  const escribir = (texto: string, f: PDFFont, size: number, color = rgb(0.1, 0.1, 0.1), sangria = 0) => {
    for (const l of partir(limpiar(texto), f, size, W - 2 * M - sangria)) {
      if (y < M + size) {
        page = doc.addPage([W, H]);
        y = H - M;
      }
      page.drawText(l, { x: M + sangria, y, size, font: f, color });
      y -= size * 1.4;
    }
  };

  escribir('Mula AI - Reporte para denuncia por intento de estafa', negrita, 16, rgb(0.05, 0.35, 0.2));
  escribir(`Generado: ${cuando(d.fecha ?? new Date())} · Datos detectados automáticamente: revisalos antes de presentar.`, font, 9, rgb(0.4, 0.4, 0.4));
  y -= 8;
  for (const s of armarDenuncia(d)) {
    y -= 6;
    escribir(s.titulo, negrita, 12);
    for (const l of s.lineas) escribir(`• ${l}`, font, 10, undefined, 8);
  }
  return doc.save();
}
