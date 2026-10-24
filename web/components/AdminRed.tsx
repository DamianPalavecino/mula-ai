"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Alerta, Grafo, Nodo, ResumenEntidad } from "@/lib/tipos";
import { TIPOS_ENTIDAD } from "@/lib/tipos";
import AdminFeed from "@/components/AdminFeed";
import BotonCerrar from "@/components/BotonCerrar";
import ResumenCard from "@/components/ResumenCard";
import { fusionar } from "@/lib/red";

// react-force-graph-2d usa canvas/window: solo en el cliente.
const Graph = dynamic(() => import("@/components/Graph"), {
  ssr: false,
  loading: () => <Aviso texto="Cargando la red…" />,
});

const DURACION_DESTACADO = 8000;
const POLL_MS = 4000;
// Refresco propio del grafo: casos sin alerta (me-estafaron, detecciones bajo el umbral).
const GRAFO_MS = 15000;
const MAX_ALERTAS = 30;

function Aviso({ texto }: { texto: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-sm text-suave">
      {texto}
    </div>
  );
}

// Nodos ya dibujados (con su x/y): fusionar() los reusa para que el grafo no se reacomode.
const nodos0 = new Map<string, Nodo>();



export default function AdminRed({
  grafoInicial,
  alertasIniciales,
}: {
  grafoInicial: Grafo;
  alertasIniciales: Alerta[];
}) {
  const [grafo, setGrafo] = useState<Grafo | null>(() => fusionar(nodos0, grafoInicial).grafo);
  const [alertas, setAlertas] = useState<Alerta[]>(alertasIniciales);
  const [nuevas, setNuevas] = useState<number[]>([]);
  const [enVivo, setEnVivo] = useState(true);
  const [error, setError] = useState(false);
  const [destacados, setDestacados] = useState<string[]>([]);
  const [foco, setFoco] = useState<{ id: string; vez: number; conPanel: boolean } | null>(null);
  const [alertaSel, setAlertaSel] = useState<number | null>(null);
  const [seleccionado, setSeleccionado] = useState<Nodo | null>(null);
  const [resumen, setResumen] = useState<ResumenEntidad | null>(null);
  const [alertasAbiertas, setAlertasAbiertas] = useState(false);
  const nodos = useRef(nodos0);
  const maxId = useRef(alertasIniciales.reduce((m, a) => Math.max(m, a.id), 0));
  const timerDestacado = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Devuelve los ids de nodos que no estaban (para destacarlos).
  const cargarGrafo = useCallback(async (): Promise<string[]> => {
    try {
      const r = await fetch("/admin/api/grafo", { cache: "no-store" });
      if (!r.ok) throw new Error();
      const { grafo: g, nuevos } = fusionar(nodos.current, (await r.json()) as Grafo);
      setError(false);
      setGrafo(g);
      return nuevos;
    } catch {
      setError(true);
      return [];
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerDestacado.current) clearTimeout(timerDestacado.current);
    };
  }, []);

  const seleccionar = useCallback((nodo: Nodo) => {
    setSeleccionado(nodo);
    setResumen(null);
    if (nodo.tipo === "reporte") return;
    fetch(
      `/admin/api/resumen?valor=${encodeURIComponent(nodo.label)}&tipo=${nodo.tipo}`,
      { cache: "no-store" },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setResumen(data as ResumenEntidad);
      })
      .catch(() => {});
  }, []);

  // Pulso rojo por unos segundos y cámara sobre el primero.
  const destacarIds = useCallback((ids: string[], conPanel = false) => {
    if (ids.length === 0) return;
    setDestacados(ids);
    setFoco({ id: ids.find((id) => id.startsWith("e_")) ?? ids[0], vez: Date.now(), conPanel });
    if (timerDestacado.current) clearTimeout(timerDestacado.current);
    timerDestacado.current = setTimeout(() => setDestacados([]), DURACION_DESTACADO);
  }, []);

  const destacar = useCallback(
    (alerta: Alerta, conPanel = false, extra: string[] = []) => {
      const ids = (alerta.entidad_ids ?? []).map((id) => `e_${id}`);
      destacarIds([...ids, ...extra.filter((id) => !ids.includes(id))], conPanel);
    },
    [destacarIds],
  );

  // El grafo se refresca solo, aunque no entren alertas, y destaca lo nuevo.
  useEffect(() => {
    const t = setInterval(async () => {
      destacarIds(await cargarGrafo());
    }, GRAFO_MS);
    return () => clearInterval(t);
  }, [cargarGrafo, destacarIds]);

  // Polling: trae las alertas con id mayor al máximo que tenemos.
  useEffect(() => {
    let vivo = true;
    const tick = async () => {
      try {
        const r = await fetch(`/admin/api/alertas?desde=${maxId.current}`, { cache: "no-store" });
        if (!r.ok) throw new Error();
        const { alertas: nuevasAlertas } = (await r.json()) as { alertas: Alerta[] };
        if (!vivo) return;
        setEnVivo(true);
        if (nuevasAlertas.length === 0) return;
        maxId.current = Math.max(maxId.current, ...nuevasAlertas.map((a) => a.id));
        setAlertas((act) => {
          const ids = new Set(act.map((a) => a.id));
          return [...nuevasAlertas.filter((a) => !ids.has(a.id)), ...act].slice(0, MAX_ALERTAS);
        });
        const idsNuevas = nuevasAlertas.map((a) => a.id);
        setNuevas((n) => [...n, ...idsNuevas]);
        setTimeout(() => setNuevas((n) => n.filter((id) => !idsNuevas.includes(id))), 6000);
        destacar(nuevasAlertas[0], false, await cargarGrafo());
      } catch {
        if (vivo) setEnVivo(false);
      }
    };
    const t = setInterval(tick, POLL_MS);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [cargarGrafo, destacar]);

  const onSeleccionarAlerta = useCallback(
    (alerta: Alerta) => {
      setAlertaSel(alerta.id);
      const primero = nodos.current.get(`e_${alerta.entidad_ids?.[0]}`);
      destacar(alerta, !!primero);
      if (primero) seleccionar(primero);
    },
    [destacar, seleccionar],
  );

  const cerrarFicha = useCallback(() => {
    setSeleccionado(null);
    setAlertaSel(null);
    setDestacados([]);
  }, []);

  // Escape cierra lo de arriba: primero la ficha, después las alertas.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (seleccionado) cerrarFicha();
      else if (alertasAbiertas) setAlertasAbiertas(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [seleccionado, alertasAbiertas, cerrarFicha]);

  return (
    // El grafo ocupa toda el área; alertas, ranking, leyenda y ficha van superpuestos.
    <div className="relative h-[calc(100svh-9rem)] min-h-[480px] overflow-hidden rounded-tarjeta border border-linea bg-fondo">
      {error && <Aviso texto="No pudimos actualizar la red." />}
      {grafo && grafo.nodes.length === 0 && <Aviso texto="La red todavía está vacía." />}
      {grafo && grafo.nodes.length > 0 && (
        <Graph
          datos={grafo}
          destacados={destacados}
          foco={foco}
          seleccionado={seleccionado?.id ?? null}
          onSeleccionar={(nodo) => {
            seleccionar(nodo);
            setAlertasAbiertas(false);
            setFoco({ id: nodo.id, vez: Date.now(), conPanel: true });
          }}
          onFondo={() => {
            cerrarFicha();
            setAlertasAbiertas(false);
          }}
        />
      )}

      {/* Alertas: pastilla arriba a la derecha; se abre como panel flotante */}
      <div className="pointer-events-none absolute top-3 right-3 flex w-[min(22rem,calc(100%-1.5rem))] flex-col items-end gap-2">
        {!alertasAbiertas && (
          <button
            type="button"
            onClick={() => {
              setSeleccionado(null);
              setAlertasAbiertas(true);
            }}
            aria-expanded={false}
            className="presionable pointer-events-auto inline-flex h-11 cursor-pointer items-center gap-2 rounded-pastilla bg-fondo/95 px-4 text-sm font-semibold text-tinta shadow-flotante backdrop-blur focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
          >
            <span className={`h-2 w-2 rounded-full ${enVivo ? "bg-seguro" : "bg-linea"}`} aria-hidden />
            Alertas
            {alertas.length > 0 && (
              <span
                className={`rounded-pastilla px-2 py-0.5 text-xs tabular-nums ${
                  nuevas.length > 0 ? "bg-alerta text-white" : "bg-panel text-tinta"
                }`}
              >
                {nuevas.length > 0 ? `+${nuevas.length}` : alertas.length}
              </span>
            )}
          </button>
        )}
        {alertasAbiertas && (
          <div className="animate-entrada pointer-events-auto h-[26rem] max-h-[min(70svh,calc(100%-1.5rem))] w-full overflow-hidden rounded-tarjeta shadow-flotante">
            <AdminFeed
              alertas={alertas}
              nuevas={nuevas}
              enVivo={enVivo}
              onSeleccionar={(a) => {
                setAlertasAbiertas(false);
                onSeleccionarAlerta(a);
              }}
              seleccionada={alertaSel}
              onCerrar={() => setAlertasAbiertas(false)}
            />
          </div>
        )}
      </div>

      {seleccionado && <FichaNodo nodo={seleccionado} resumen={resumen} onCerrar={cerrarFicha} />}
    </div>
  );
}

// Ficha del nodo: panel flotante a la derecha en desktop; bottom sheet que se desliza en mobile.
function FichaNodo({
  nodo,
  resumen,
  onCerrar,
}: {
  nodo: Nodo;
  resumen: ResumenEntidad | null;
  onCerrar: () => void;
}) {
  const [arrastre, setArrastre] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const inicio = useRef<number | null>(null);
  const cabecera = useRef<HTMLDivElement>(null);

  // Al abrir, el foco va al botón de cerrar (Escape también cierra).
  useEffect(() => {
    cabecera.current?.querySelector("button")?.focus({ preventScroll: true });
  }, [nodo.id]);

  return (
    <section
      role="dialog"
      aria-label={`Detalle de ${nodo.label}`}
      className="animate-entrada absolute inset-x-0 bottom-0 z-10 flex max-h-[72%] flex-col overflow-hidden rounded-t-tarjeta bg-fondo shadow-flotante sm:inset-x-auto sm:top-3 sm:right-3 sm:bottom-auto sm:max-h-[calc(100%-1.5rem)] sm:w-80 sm:rounded-tarjeta"
      style={{
        transform: arrastre ? `translateY(${arrastre}px)` : undefined,
        transition: arrastrando ? "none" : "transform 200ms var(--ease-salida)",
      }}
    >
      {/* Agarradera: deslizar hacia abajo cierra (solo mobile) */}
      <div
        className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center sm:hidden"
        onPointerDown={(e) => {
          inicio.current = e.clientY;
          setArrastrando(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (inicio.current != null) setArrastre(Math.max(0, e.clientY - inicio.current));
        }}
        onPointerUp={() => {
          const cerrar = arrastre > 80;
          inicio.current = null;
          setArrastrando(false);
          setArrastre(0);
          if (cerrar) onCerrar();
        }}
        onPointerCancel={() => {
          inicio.current = null;
          setArrastrando(false);
          setArrastre(0);
        }}
        aria-hidden
      >
        <span className="h-1.5 w-10 rounded-pastilla bg-linea" />
      </div>
      <div ref={cabecera} className="flex items-center justify-between gap-2 border-b border-linea py-1 pr-1 pl-4">
        <p className="min-w-0 truncate text-sm">
          <span className="font-medium text-suave">
            {TIPOS_ENTIDAD[nodo.tipo as keyof typeof TIPOS_ENTIDAD] ?? "Entidad"}
          </span>{" "}
          <span className="font-mono text-tinta">{nodo.label}</span>
        </p>
        <BotonCerrar onClick={onCerrar} etiqueta="Cerrar detalle" />
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto overscroll-contain p-3">
        {resumen ? (
          <ResumenCard resumen={resumen} compacto />
        ) : (
          <p className="px-1 py-2 text-sm text-suave">Cargando resumen…</p>
        )}
        <Link
          href={`/app?tab=verificar&valor=${encodeURIComponent(nodo.label)}`}
          className="px-1 text-sm font-medium text-tinta underline underline-offset-2 hover:text-black"
        >
          Abrir en Verificar
        </Link>
      </div>
    </section>
  );
}
