import type { TipoEntidad, TipoNodo } from "@/lib/tipos";
import type { NivelRiesgo } from "@/lib/riesgo";

// Color por tipo de nodo. El grafo ya no lo usa (pinta por riesgo); queda para el styleguide.
export const COLORES: Record<TipoNodo, string> = {
  alias: "#2f5bd3",
  cbu: "#7a3fc4",
  cvu: "#0f8a7e",
  telefono: "#c77700",
  cuit: "#c2307a",
  link: "#5f8a1c",
  reporte: "#c3c7cc",
};

// Escala de riesgo del grafo (lib/riesgo.ts): neutro → ámbar → naranja → rojo.
// El rojo es --color-alerta y el neutro sale de --color-suave (DESIGN.md); ámbar y naranja no tienen
// token todavía, viven acá porque solo los usa el grafo.
export const RIESGO: Record<NivelRiesgo, { fill: string; rgb: string }> = {
  0: { fill: "#8b939c", rgb: "139, 147, 156" },
  1: { fill: "#d99a00", rgb: "217, 154, 0" },
  2: { fill: "#e8590c", rgb: "232, 89, 12" },
  3: { fill: "#c1121f", rgb: "193, 18, 31" },
};

export const COLOR_REPORTE = "#c3c7cc";

// Ícono de cada tipo de entidad: trazos SVG de 24×24 (estilo lucide). Los usa el canvas del grafo
// (Path2D) y la leyenda (<svg>), así se ven igual en los dos.
export const ICONOS_TIPO: Record<TipoEntidad, string[]> = {
  alias: ["M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8", "M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0"],
  cbu: ["M3 10 12 4l9 6", "M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"],
  cvu: [
    "M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v3h-4a2 2 0 0 0 0 4h4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5",
  ],
  telefono: ["M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z", "M11 18h2"],
  cuit: ["M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "M7 10h4M7 14h6M16 10h2"],
  link: [
    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
    "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  ],
};
