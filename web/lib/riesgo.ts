// Riesgo de una entidad en el grafo según cuántos reportes tiene. Lógica pura (la testea
// lib/riesgo.test.ts). La escala es continua: interpola en OKLab entre los tokens --color-riesgo-1…5
// (DESIGN.md / globals.css), así nodos, líneas y leyenda salen del mismo lugar.
import type { Nodo } from "@/lib/tipos";

/** Paradas de la escala: desde cuántos reportes vale cada token. Iguales a --color-riesgo-N. */
export const ESCALA_RIESGO = [
  { desde: 1, color: "#8fbf9a" }, // --color-riesgo-1: verde suave (un solo reporte)
  { desde: 3, color: "#f0b429" }, // --color-riesgo-2: ámbar
  { desde: 6, color: "#f07a1a" }, // --color-riesgo-3: naranja
  { desde: 10, color: "#d9381e" }, // --color-riesgo-4: rojo anaranjado
  { desde: 20, color: "#9e0f1d" }, // --color-riesgo-5: rojo intenso
] as const;

export type NivelRiesgo = 0 | 1 | 2 | 3;

/** Escalones gruesos (para decidir énfasis de texto, no para el color). */
export function nivelRiesgo(reportes: number): NivelRiesgo {
  if (reportes >= 10) return 3;
  if (reportes >= 5) return 2;
  if (reportes >= 2) return 1;
  return 0;
}

// ---- sRGB ↔ OKLab (Björn Ottosson) ----
type Lab = [number, number, number];

const aLineal = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const aGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function hexAOklab(hex: string): Lab {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => aLineal(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabAHex([L, a, b]: Lab): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return (
    "#" +
    rgb
      .map((c) => Math.round(Math.min(1, Math.max(0, aGamma(c))) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function distanciaOklab(a: string, b: string): number {
  const [x, y] = [hexAOklab(a), hexAOklab(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

const PARADAS = ESCALA_RIESGO.map((p) => ({ desde: p.desde, lab: hexAOklab(p.color), hex: p.color.toLowerCase() }));

/** Color de la escala continua para una cantidad de reportes (hex). */
export function colorRiesgo(reportes: number): string {
  if (reportes <= PARADAS[0].desde) return PARADAS[0].hex;
  for (let i = 1; i < PARADAS.length; i++) {
    const [a, b] = [PARADAS[i - 1], PARADAS[i]];
    if (reportes === b.desde) return b.hex;
    if (reportes < b.desde) {
      const t = (reportes - a.desde) / (b.desde - a.desde);
      return oklabAHex([0, 1, 2].map((k) => a.lab[k] + (b.lab[k] - a.lab[k]) * t) as Lab);
    }
  }
  return PARADAS[PARADAS.length - 1].hex;
}

/** El mismo color con transparencia, para líneas del canvas. */
export function rgbaRiesgo(reportes: number, alfa: number): string {
  const n = parseInt(colorRiesgo(reportes).slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
}

// Luminancia relativa WCAG de un hex.
function luminancia(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => aLineal(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const TINTA = "#111418";

/** Color del ícono dentro de un nodo: tinta o blanco, el que más contraste tenga con su fondo. */
export function tintaSobreRiesgo(reportes: number): string {
  const fondo = luminancia(colorRiesgo(reportes));
  const conTinta = (fondo + 0.05) / (luminancia(TINTA) + 0.05);
  const conBlanco = 1.05 / (fondo + 0.05);
  return conTinta >= conBlanco ? TINTA : "#ffffff";
}

/** Las entidades más denunciadas (≥ 2 reportes), de mayor a menor; desempata por valor. */
export function topDenunciados(nodos: Nodo[], n: number): Nodo[] {
  return nodos
    .filter((x) => x.tipo !== "reporte" && (x.reportes ?? 0) >= 2)
    .sort((a, b) => (b.reportes ?? 0) - (a.reportes ?? 0) || a.label.localeCompare(b.label))
    .slice(0, n);
}

export function etiquetaNodo(n: Nodo): string {
  return `${n.label} · ${n.reportes ?? 0}`;
}
