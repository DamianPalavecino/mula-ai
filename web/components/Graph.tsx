"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject,
} from "react-force-graph-2d";
import type { Grafo, Nodo, TipoEntidad } from "@/lib/tipos";
import { labelModalidad, TIPOS_ENTIDAD } from "@/lib/tipos";
import {
  colorRiesgo,
  ESCALA_RIESGO,
  etiquetaNodo,
  nivelRiesgo,
  rgbaRiesgo,
  tintaSobreRiesgo,
  topDenunciados,
} from "@/lib/riesgo";
import { COLOR_REPORTE, ICONOS_TIPO } from "@/components/colores";

type N = NodeObject<Nodo>;
type L = LinkObject<Nodo>;

const ALERTA = "#c1121f"; // --color-alerta
const ALERTA_RGB = "193, 18, 31";
const TINTA = "#111418";
const TOP_N = 8; // los más denunciados: label siempre visible y ranking
const ZOOM_LABELS = 2.2; // desde este zoom se ven los labels de todas las entidades con ≥ 2 reportes
const TIPOS_LEYENDA: TipoEntidad[] = ["alias", "cbu", "cvu", "telefono", "cuit", "link"];
const CORTO: Record<TipoEntidad, string> = {
  alias: "Alias",
  cbu: "CBU",
  cvu: "CVU",
  telefono: "Tel.",
  cuit: "CUIT",
  link: "Link",
};

// Path2D de los íconos (se arman una vez, en el browser).
let paths: Record<TipoEntidad, Path2D[]> | null = null;
function iconos(): Record<TipoEntidad, Path2D[]> {
  paths ??= Object.fromEntries(
    Object.entries(ICONOS_TIPO).map(([t, ds]) => [t, ds.map((d) => new Path2D(d))]),
  ) as Record<TipoEntidad, Path2D[]>;
  return paths;
}

function esEntidad(n: Nodo | undefined | null): boolean {
  return !!n && n.tipo !== "reporte";
}

function radio(n: Nodo): number {
  if (!esEntidad(n)) return 2.5;
  return 4 + Math.sqrt(n.reportes ?? 1) * 3.2;
}

function idDe(extremo: L["source"]): string {
  if (extremo && typeof extremo === "object") return String(extremo.id);
  return String(extremo);
}

function IconoTipo({ tipo, className = "h-3.5 w-3.5" }: { tipo: TipoEntidad; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {ICONOS_TIPO[tipo].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export default function Graph({
  datos,
  destacados,
  foco,
  seleccionado,
  onSeleccionar,
  onFondo,
}: {
  datos: Grafo;
  destacados: string[];
  foco: { id: string; vez: number; conPanel: boolean } | null;
  seleccionado: string | null;
  onSeleccionar: (nodo: Nodo) => void;
  /** Clic en el fondo del grafo (cierra fichas y paneles). */
  onFondo?: () => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const fg = useRef<ForceGraphMethods<N, L> | undefined>(undefined);
  const [tam, setTam] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<string | null>(null);
  const [rankingAbierto, setRankingAbierto] = useState(true);
  const ajustado = useRef(false);
  const datosRef = useRef(datos);
  useEffect(() => {
    datosRef.current = datos;
  }, [datos]);

  const montado = tam.w > 0 && tam.h > 0;
  const destacadosSet = useMemo(() => new Set(destacados), [destacados]);
  const top = useMemo(() => topDenunciados(datos.nodes, TOP_N), [datos]);
  const topSet = useMemo(() => new Set(top.map((n) => n.id)), [top]);

  // Vecinos de cada nodo, para resaltar lo conectado al que está en foco.
  const vecinos = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const l of datos.links as L[]) {
      const a = idDe(l.source);
      const b = idDe(l.target);
      if (!m.has(a)) m.set(a, new Set());
      if (!m.has(b)) m.set(b, new Set());
      m.get(a)!.add(b);
      m.get(b)!.add(a);
    }
    return m;
  }, [datos]);
  const enFoco = hover ?? seleccionado;
  const conectado = (id: string) => !enFoco || id === enFoco || !!vecinos.get(enFoco)?.has(id);
  // El riesgo de una línea es el de su entidad (los links van reporte → entidad).
  const nodosPorId = useMemo(() => new Map(datos.nodes.map((n) => [n.id, n])), [datos]);
  const reportesLink = (l: L) => {
    const a = nodosPorId.get(idDe(l.source));
    const b = nodosPorId.get(idDe(l.target));
    const e = esEntidad(b) ? b : a;
    return e?.reportes ?? 1;
  };

  // En el celu el ranking arranca cerrado para no tapar el grafo.
  useEffect(() => {
    setRankingAbierto(window.matchMedia("(min-width: 640px)").matches);
  }, []);

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

  // Física: los más denunciados se repelen más y sus reportes quedan más lejos, así los hubs no se
  // pisan; los reportes sueltos casi no empujan. Encuadre a los 1,2 s y al terminar.
  useEffect(() => {
    if (!montado) return;
    const carga = fg.current?.d3Force("charge");
    carga?.strength?.((n: N) => (esEntidad(n) ? -40 - (n.reportes ?? 1) * 9 : -14));
    carga?.distanceMax?.(320);
    fg.current
      ?.d3Force("link")
      ?.distance?.((l: L) => {
        const a = l.source as N;
        const b = l.target as N;
        const e = esEntidad(b) ? b : a;
        return 22 + Math.sqrt(e?.reportes ?? 1) * 9;
      });
    fg.current?.d3ReheatSimulation();
    const t = setTimeout(() => {
      if (!ajustado.current) fg.current?.zoomToFit(400, 56);
    }, 1200);
    return () => clearTimeout(t);
  }, [montado]);

  function centrar(id: string, conPanel: boolean, zoom = 1.6) {
    const nodo = datosRef.current.nodes.find((n) => n.id === id) as N | undefined;
    if (!nodo || nodo.x == null || nodo.y == null) return false;
    // En desktop el panel de detalle tapa la derecha: corremos el nodo hacia la izquierda.
    const desplazar = conPanel && window.matchMedia("(min-width: 1024px)").matches ? 170 / zoom : 0;
    fg.current?.centerAt(nodo.x + desplazar, nodo.y, 700);
    fg.current?.zoom(zoom, 700);
    return true;
  }

  // Centrar la cámara en el nodo pedido (puede tardar en tener posición si es nuevo).
  useEffect(() => {
    if (!foco) return;
    let intentos = 0;
    const timer = setInterval(() => {
      if (centrar(foco.id, foco.conPanel) || ++intentos > 15) clearInterval(timer);
    }, 300);
    return () => clearInterval(timer);
  }, [foco]);

  return (
    <div
      ref={contenedor}
      className="absolute inset-0"
      style={{
        // Profundidad sin competir con los nodos: grilla de puntos sobre un gradiente radial.
        backgroundColor: "var(--color-fondo, #fff)",
        backgroundImage:
          "radial-gradient(circle, rgb(17 20 24 / 0.09) 1px, transparent 1.2px), radial-gradient(ellipse at 50% 45%, var(--color-papel, #fbfcf8) 0%, var(--color-panel, #f6f7f8) 100%)",
        backgroundSize: "22px 22px, 100% 100%",
      }}
    >
      {montado && (
        <ForceGraph2D<Nodo>
          ref={fg}
          width={tam.w}
          height={tam.h}
          graphData={datos as { nodes: N[]; links: L[] }}
          backgroundColor="rgba(0,0,0,0)"
          cooldownTicks={150}
          autoPauseRedraw={destacados.length === 0}
          onEngineStop={() => {
            if (!ajustado.current) {
              ajustado.current = true;
              fg.current?.zoomToFit(400, 56);
            }
          }}
          linkColor={(l) => {
            const a = idDe(l.source);
            const b = idDe(l.target);
            if (destacadosSet.has(a) || destacadosSet.has(b)) return `rgba(${ALERTA_RGB}, 0.75)`;
            const rep = reportesLink(l);
            if (!enFoco) return rgbaRiesgo(rep, 0.45);
            return a === enFoco || b === enFoco ? rgbaRiesgo(rep, 0.95) : "rgba(17, 20, 24, 0.05)";
          }}
          linkWidth={(l) => {
            const a = idDe(l.source);
            const b = idDe(l.target);
            if (enFoco && (a === enFoco || b === enFoco)) return 2.6;
            if (destacadosSet.has(a) || destacadosSet.has(b)) return 2;
            return 1.2;
          }}
          nodeLabel={(n) =>
            n.tipo === "reporte"
              ? `${labelModalidad(n.modalidad)}${n.provincia ? ` · ${n.provincia}` : ""}`
              : ""
          }
          showPointerCursor={(obj) => !!obj && "tipo" in obj && obj.tipo !== "reporte"}
          onNodeHover={(n) => setHover(n && esEntidad(n) ? n.id : null)}
          onBackgroundClick={() => onFondo?.()}
          onNodeClick={(n) => {
            if (esEntidad(n)) onSeleccionar(n);
          }}
          nodePointerAreaPaint={(n, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(n.x ?? 0, n.y ?? 0, radio(n) + 1.5, 0, 2 * Math.PI);
            ctx.fill();
          }}
          nodeCanvasObject={(n, ctx, escala) => {
            const x = n.x ?? 0;
            const y = n.y ?? 0;
            const r = radio(n);
            const destacado = destacadosSet.has(n.id);
            ctx.globalAlpha = conectado(n.id) || destacado ? 1 : 0.18;

            if (destacado) {
              // Pulso: un anillo que se expande y se desvanece.
              const t = (Date.now() % 1400) / 1400;
              ctx.beginPath();
              ctx.arc(x, y, r + 2 + t * 14, 0, 2 * Math.PI);
              ctx.strokeStyle = `rgba(${ALERTA_RGB}, ${1 - t})`;
              ctx.lineWidth = 2.5 / escala;
              ctx.stroke();
            }

            if (!esEntidad(n)) {
              ctx.beginPath();
              ctx.arc(x, y, r, 0, 2 * Math.PI);
              ctx.fillStyle = COLOR_REPORTE;
              ctx.fill();
              ctx.globalAlpha = 1;
              return;
            }

            // Disco del color del riesgo, con borde claro para separarlo de las líneas.
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = colorRiesgo(n.reportes ?? 1);
            ctx.fill();
            ctx.lineWidth = 1.5 / escala;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
            ctx.stroke();

            // Ícono del tipo adentro si el nodo se ve grande; en los neutros (1 reporte) solo en foco,
            // para que no compitan con los denunciados.
            const neutro = (n.reportes ?? 1) < 2 && hover !== n.id && seleccionado !== n.id;
            if (r * escala >= 7 && !neutro) {
              const lado = r * 1.15;
              ctx.save();
              ctx.translate(x - lado / 2, y - lado / 2);
              ctx.scale(lado / 24, lado / 24);
              ctx.strokeStyle = tintaSobreRiesgo(n.reportes ?? 1);
              ctx.lineWidth = 2.4;
              ctx.lineCap = "round";
              ctx.lineJoin = "round";
              for (const p of iconos()[n.tipo as TipoEntidad] ?? []) ctx.stroke(p);
              ctx.restore();
            }

            if (destacado || seleccionado === n.id || hover === n.id) {
              ctx.beginPath();
              ctx.arc(x, y, r + 2 / escala + 1, 0, 2 * Math.PI);
              ctx.strokeStyle = destacado ? ALERTA : TINTA;
              ctx.lineWidth = 2 / escala;
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          }}
          onRenderFramePost={(ctx, escala) => {
            // Labels en una pasada aparte: primero los prioritarios, y se saltean los que se pisan.
            const prioridad = (n: Nodo) =>
              (destacadosSet.has(n.id) ? 4000 : 0) +
              (seleccionado === n.id ? 3000 : 0) +
              (hover === n.id ? 2000 : 0) +
              (topSet.has(n.id) ? 1000 : 0) +
              (n.reportes ?? 0);
            const candidatos = (datos.nodes as N[])
              .filter(
                (n) =>
                  esEntidad(n) &&
                  (topSet.has(n.id) ||
                    hover === n.id ||
                    seleccionado === n.id ||
                    destacadosSet.has(n.id) ||
                    (escala >= ZOOM_LABELS && (n.reportes ?? 0) >= 2)) &&
                  (conectado(n.id) || destacadosSet.has(n.id)),
              )
              .sort((a, b) => prioridad(b) - prioridad(a));

            const fuente = 12 / escala;
            const pad = 4 / escala;
            ctx.font = `600 ${fuente}px ui-sans-serif, system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const ocupados: { x1: number; y1: number; x2: number; y2: number }[] = [];
            for (const n of candidatos) {
              const texto = etiquetaNodo(n);
              const ancho = ctx.measureText(texto).width;
              const x = n.x ?? 0;
              const cy = (n.y ?? 0) + radio(n) + 4 / escala + fuente * 0.7;
              const caja = {
                x1: x - ancho / 2 - pad,
                y1: cy - fuente * 0.7,
                x2: x + ancho / 2 + pad,
                y2: cy + fuente * 0.7,
              };
              const pisa = ocupados.some(
                (o) => caja.x1 < o.x2 && caja.x2 > o.x1 && caja.y1 < o.y2 && caja.y2 > o.y1,
              );
              if (pisa) continue;
              ocupados.push(caja);
              // Pastilla clara detrás del texto: se lee sobre líneas y nodos.
              ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
              ctx.beginPath();
              ctx.roundRect(caja.x1, caja.y1, caja.x2 - caja.x1, caja.y2 - caja.y1, fuente * 0.7);
              ctx.fill();
              ctx.fillStyle = destacadosSet.has(n.id) || nivelRiesgo(n.reportes ?? 1) === 3 ? ALERTA : TINTA;
              ctx.fillText(texto, x, cy);
            }
          }}
        />
      )}

      {/* Más denunciados: clic = enfocar el nodo y abrir su detalle */}
      {top.length > 0 && (
        <div className="pointer-events-none absolute top-3 left-3 flex max-w-[min(18rem,calc(100%-1.5rem))] flex-col items-start gap-2">
          <button
            type="button"
            onClick={() => setRankingAbierto((a) => !a)}
            aria-expanded={rankingAbierto}
            className="pointer-events-auto inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-[var(--color-tinta,#111418)] px-3.5 text-sm font-semibold text-white shadow-sm transition-[scale] duration-150 active:scale-[0.96]"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: ALERTA }} aria-hidden />
            Más denunciados
          </button>
          {rankingAbierto && (
            <ol className="pointer-events-auto w-full overflow-hidden rounded-2xl bg-white/90 p-1 shadow-[0_0_0_1px_rgb(17_20_24/0.06),0_8px_24px_-8px_rgb(17_20_24/0.2)] backdrop-blur">
              {top.map((n, i) => {
                const nivel = nivelRiesgo(n.reportes ?? 1);
                const rep = n.reportes ?? 1;
                const activo = seleccionado === n.id;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setHover(n.id)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => {
                        centrar(n.id, true, 2.4);
                        onSeleccionar(n);
                      }}
                      className={`flex w-full cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-[background-color] duration-150 hover:bg-black/5 ${
                        activo ? "bg-black/5" : ""
                      }`}
                    >
                      <span className="w-4 shrink-0 text-right text-xs font-semibold text-[var(--color-suave,#6b7280)] tabular-nums">
                        {i + 1}
                      </span>
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                        style={{ background: colorRiesgo(rep), color: tintaSobreRiesgo(rep) }}
                        title={TIPOS_ENTIDAD[n.tipo as TipoEntidad]}
                      >
                        <IconoTipo tipo={n.tipo as TipoEntidad} className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-[var(--color-tinta,#111418)]">
                        {n.label}
                      </span>
                      <span
                        className="shrink-0 text-sm font-bold tabular-nums"
                        style={{ color: nivel === 3 ? ALERTA : "var(--color-tinta, #111418)" }}
                      >
                        {n.reportes}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      {/* Leyenda: escala de riesgo (reportes) e íconos de tipo */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl bg-white/90 px-3 py-2 text-xs text-[var(--color-texto,#3d434b)] shadow-[0_0_0_1px_rgb(17_20_24/0.06)] backdrop-blur">
        <span className="flex flex-col gap-0.5" role="img" aria-label="Reportes por cuenta: 1 verde suave, 3 ámbar, 6 naranja, 10 rojo, 20 o más rojo intenso">
          <span
            className="h-2 w-40 rounded-full"
            style={{
              background: `linear-gradient(in oklab to right, ${ESCALA_RIESGO.map(
                (p, i) => `var(--color-riesgo-${i + 1}, ${p.color}) ${(i / (ESCALA_RIESGO.length - 1)) * 100}%`,
              ).join(", ")})`,
            }}
          />
          <span className="flex w-40 justify-between text-[11px] font-medium tabular-nums text-[var(--color-tinta,#111418)]">
            {ESCALA_RIESGO.map((p, i) => (
              <span key={p.desde}>{i === ESCALA_RIESGO.length - 1 ? `${p.desde}+` : p.desde}</span>
            ))}
          </span>
        </span>
        <span className="hidden h-4 w-px bg-black/10 sm:block" aria-hidden />
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {TIPOS_LEYENDA.map((t) => (
            <span key={t} className="flex items-center gap-1" title={TIPOS_ENTIDAD[t]}>
              <IconoTipo tipo={t} className="h-3.5 w-3.5 text-[var(--color-suave,#6b7280)]" />
              {CORTO[t]}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLOR_REPORTE }} aria-hidden />
            Reporte
          </span>
        </span>
      </div>
    </div>
  );
}
