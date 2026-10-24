"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject,
} from "react-force-graph-2d";
import type { Grafo, Nodo } from "@/lib/tipos";
import { COLORES } from "@/components/colores";
import { labelModalidad } from "@/lib/tipos";

type N = NodeObject<Nodo>;
type L = LinkObject<Nodo>;


const ALERTA = "#c1121f";
const UMBRAL_LABEL = 5; // entidades con al menos esta cantidad de reportes muestran su label

function esEntidad(n: Nodo | undefined | null): boolean {
  return !!n && n.tipo !== "reporte";
}

function radio(n: Nodo): number {
  if (!esEntidad(n)) return 2;
  return 4 + Math.sqrt(n.reportes ?? 1) * 1.8;
}

function idDe(extremo: L["source"]): string {
  if (extremo && typeof extremo === "object") return String(extremo.id);
  return String(extremo);
}

export default function Graph({
  datos,
  destacados,
  foco,
  seleccionado,
  onSeleccionar,
}: {
  datos: Grafo;
  destacados: string[];
  foco: { id: string; vez: number } | null;
  seleccionado: string | null;
  onSeleccionar: (nodo: Nodo) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const fg = useRef<ForceGraphMethods<N, L> | undefined>(undefined);
  const [tam, setTam] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<string | null>(null);
  const ajustado = useRef(false);
  const datosRef = useRef(datos);
  datosRef.current = datos;

  const destacadosSet = useMemo(() => new Set(destacados), [destacados]);

  // El canvas sigue el tamaño del contenedor.
  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const ro = new ResizeObserver(([entrada]) => {
      const { width, height } = entrada.contentRect;
      setTam({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Centrar la cámara en el nodo de la alerta (puede tardar en tener posición si es nuevo).
  useEffect(() => {
    if (!foco) return;
    let intentos = 0;
    const timer = setInterval(() => {
      const nodo = datosRef.current.nodes.find((n) => n.id === foco.id) as N | undefined;
      if (nodo && nodo.x != null && nodo.y != null) {
        fg.current?.centerAt(nodo.x, nodo.y, 800);
        fg.current?.zoom(3, 800);
        clearInterval(timer);
      } else if (++intentos > 15) {
        clearInterval(timer);
      }
    }, 300);
    return () => clearInterval(timer);
  }, [foco]);

  return (
    <div ref={contenedor} className="absolute inset-0">
      {tam.w > 0 && tam.h > 0 && (
        <ForceGraph2D<Nodo>
          ref={fg}
          width={tam.w}
          height={tam.h}
          graphData={datos as { nodes: N[]; links: L[] }}
          backgroundColor="#ffffff"
          cooldownTicks={150}
          autoPauseRedraw={destacados.length === 0}
          onEngineStop={() => {
            if (!ajustado.current) {
              ajustado.current = true;
              fg.current?.zoomToFit(400, 40);
            }
          }}
          linkColor={(l) =>
            destacadosSet.has(idDe(l.source)) || destacadosSet.has(idDe(l.target))
              ? "rgba(193, 18, 31, 0.55)"
              : "rgba(17, 20, 24, 0.12)"
          }
          linkWidth={(l) =>
            destacadosSet.has(idDe(l.source)) || destacadosSet.has(idDe(l.target)) ? 1.5 : 0.6
          }
          nodeLabel={(n) =>
            n.tipo === "reporte"
              ? `${labelModalidad(n.modalidad)}${n.provincia ? ` · ${n.provincia}` : ""}`
              : ""
          }
          showPointerCursor={(obj) => !!obj && "tipo" in obj && obj.tipo !== "reporte"}
          onNodeHover={(n) => setHover(n && esEntidad(n) ? n.id : null)}
          onNodeClick={(n) => {
            if (esEntidad(n)) onSeleccionar(n);
          }}
          nodePointerAreaPaint={(n, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(n.x ?? 0, n.y ?? 0, radio(n) + 1, 0, 2 * Math.PI);
            ctx.fill();
          }}
          nodeCanvasObject={(n, ctx, escala) => {
            const x = n.x ?? 0;
            const y = n.y ?? 0;
            const r = radio(n);
            const destacado = destacadosSet.has(n.id);

            if (destacado) {
              // Pulso: un anillo que se expande y se desvanece.
              const t = (Date.now() % 1400) / 1400;
              ctx.beginPath();
              ctx.arc(x, y, r + 2 + t * 14, 0, 2 * Math.PI);
              ctx.strokeStyle = `rgba(193, 18, 31, ${1 - t})`;
              ctx.lineWidth = 2.5 / escala;
              ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = COLORES[n.tipo] ?? COLORES.reporte;
            ctx.fill();

            if (destacado || seleccionado === n.id) {
              ctx.beginPath();
              ctx.arc(x, y, r + 2 / escala + 1, 0, 2 * Math.PI);
              ctx.strokeStyle = destacado ? ALERTA : "#111418";
              ctx.lineWidth = 2 / escala;
              ctx.stroke();
            }

            const conLabel =
              esEntidad(n) &&
              ((n.reportes ?? 0) >= UMBRAL_LABEL ||
                hover === n.id ||
                destacado ||
                seleccionado === n.id);
            if (conLabel) {
              const fuente = 12 / escala;
              ctx.font = `600 ${fuente}px ui-sans-serif, system-ui, sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              const ty = y + r + 3 / escala;
              ctx.lineWidth = 3 / escala;
              ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
              ctx.strokeText(n.label, x, ty);
              ctx.fillStyle = destacado ? ALERTA : "#111418";
              ctx.fillText(n.label, x, ty);
            }
          }}
        />
      )}
    </div>
  );
}
