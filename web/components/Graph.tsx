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
const UMBRAL_LABEL = 12; // entidades con al menos esta cantidad de reportes muestran su label

function esEntidad(n: Nodo | undefined | null): boolean {
  return !!n && n.tipo !== "reporte";
}

function radio(n: Nodo): number {
  if (!esEntidad(n)) return 3;
  return 3 + Math.sqrt(n.reportes ?? 1) * 2.6;
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
  foco: { id: string; vez: number; conPanel: boolean } | null;
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

  const montado = tam.w > 0 && tam.h > 0;
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

  // Menos repulsión: los clusters quedan más juntos y el grafo se ve más grande.
  useEffect(() => {
    const carga = fg.current?.d3Force("charge");
    carga?.strength?.(-24);
    carga?.distanceMax?.(160);
    fg.current?.d3Force("link")?.distance?.(36);
    fg.current?.d3ReheatSimulation();
  }, [montado]);

  // Centrar la cámara en el nodo de la alerta (puede tardar en tener posición si es nuevo).
  useEffect(() => {
    if (!foco) return;
    let intentos = 0;
    const timer = setInterval(() => {
      const nodo = datosRef.current.nodes.find((n) => n.id === foco.id) as N | undefined;
      if (nodo && nodo.x != null && nodo.y != null) {
        // En desktop el panel de detalle tapa la derecha: corremos el nodo hacia la izquierda.
        const zoom = 1.5;
        const desplazar =
          foco.conPanel && window.matchMedia("(min-width: 1024px)").matches ? 170 / zoom : 0;
        fg.current?.centerAt(nodo.x + desplazar, nodo.y, 800);
        fg.current?.zoom(zoom, 800);
        clearInterval(timer);
      } else if (++intentos > 15) {
        clearInterval(timer);
      }
    }, 300);
    return () => clearInterval(timer);
  }, [foco]);

  return (
    <div ref={contenedor} className="absolute inset-0">
      {montado && (
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
          }}
          onRenderFramePost={(ctx, escala) => {
            // Labels en una pasada aparte: primero los prioritarios, y se saltean los que se pisan.
            const prioridad = (n: Nodo) =>
              (destacadosSet.has(n.id) ? 3000 : 0) +
              (seleccionado === n.id ? 2000 : 0) +
              (hover === n.id ? 1000 : 0) +
              (n.reportes ?? 0);
            const candidatos = (datos.nodes as N[])
              .filter(
                (n) =>
                  esEntidad(n) &&
                  ((n.reportes ?? 0) >= UMBRAL_LABEL ||
                    hover === n.id ||
                    seleccionado === n.id ||
                    destacadosSet.has(n.id)),
              )
              .sort((a, b) => prioridad(b) - prioridad(a));

            const fuente = 12 / escala;
            ctx.font = `600 ${fuente}px ui-sans-serif, system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.lineWidth = 3 / escala;
            const ocupados: { x1: number; y1: number; x2: number; y2: number }[] = [];
            for (const n of candidatos) {
              const ancho = ctx.measureText(n.label).width;
              const x = n.x ?? 0;
              const ty = (n.y ?? 0) + radio(n) + 3 / escala;
              const caja = { x1: x - ancho / 2, y1: ty, x2: x + ancho / 2, y2: ty + fuente * 1.2 };
              const pisa = ocupados.some(
                (o) => caja.x1 < o.x2 && caja.x2 > o.x1 && caja.y1 < o.y2 && caja.y2 > o.y1,
              );
              if (pisa) continue;
              ocupados.push(caja);
              ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
              ctx.strokeText(n.label, x, ty);
              ctx.fillStyle = destacadosSet.has(n.id) ? ALERTA : "#111418";
              ctx.fillText(n.label, x, ty);
            }
          }}
        />
      )}
    </div>
  );
}
