"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Alerta, Grafo, Nodo, ResumenEntidad, TipoNodo } from "@/lib/tipos";
import { TIPOS_ENTIDAD } from "@/lib/tipos";
import AdminFeed from "@/components/AdminFeed";
import ResumenCard from "@/components/ResumenCard";
import { COLORES } from "@/components/colores";
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


const LEYENDA: TipoNodo[] = ["alias", "cbu", "cvu", "telefono", "cuit", "link", "reporte"];

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
  const nodos = useRef(nodos0);
  const maxId = useRef(alertasIniciales.reduce((m, a) => Math.max(m, a.id), 0));
  const panelRef = useRef<HTMLDivElement>(null);
  const timerDestacado = useRef<ReturnType<typeof setTimeout> | null>(null);

  // En mobile el panel va debajo del grafo: lo traemos a la vista al abrirlo.
  useEffect(() => {
    if (seleccionado && !window.matchMedia("(min-width: 1024px)").matches) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [seleccionado]);

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

  return (
    <div className="grid gap-4 lg:h-[calc(100svh-22rem)] lg:min-h-[520px] lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="h-60 lg:order-2 lg:h-auto lg:min-h-0">
        <AdminFeed
          alertas={alertas}
          nuevas={nuevas}
          enVivo={enVivo}
          onSeleccionar={onSeleccionarAlerta}
          seleccionada={alertaSel}
        />
      </div>

      <div className="relative flex min-h-0 flex-col gap-3">
        <div className="relative h-[480px] overflow-hidden rounded-lg border border-linea bg-fondo lg:h-auto lg:flex-1">
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
                setFoco({ id: nodo.id, vez: Date.now(), conPanel: true });
              }}
            />
          )}
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-suave">
          {LEYENDA.map((tipo) => (
            <li key={tipo} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: COLORES[tipo] }}
                aria-hidden
              />
              {tipo === "reporte" ? "Reporte" : TIPOS_ENTIDAD[tipo]}
            </li>
          ))}
        </ul>

        {seleccionado && (
          <div
            ref={panelRef}
            className="rounded-lg border border-linea bg-fondo lg:absolute lg:top-3 lg:right-3 lg:max-h-[calc(100%-4.5rem)] lg:w-80 lg:overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-3 border-b border-linea px-4 py-2.5">
              <p className="min-w-0 truncate text-sm">
                <span className="font-medium text-suave">
                  {TIPOS_ENTIDAD[seleccionado.tipo as keyof typeof TIPOS_ENTIDAD] ?? "Entidad"}
                </span>{" "}
                <span className="font-mono text-tinta">{seleccionado.label}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setSeleccionado(null);
                  setAlertaSel(null);
                }}
                className="cursor-pointer text-sm font-medium text-suave hover:text-tinta"
              >
                Cerrar
              </button>
            </div>
            <div className="flex flex-col gap-3 p-3">
              {resumen ? (
                <ResumenCard resumen={resumen} compacto />
              ) : (
                <p className="px-1 py-2 text-sm text-suave">Cargando resumen…</p>
              )}
              <Link
                href={`/admin/verificar?valor=${encodeURIComponent(seleccionado.label)}`}
                className="px-1 text-sm font-medium text-tinta underline underline-offset-2 hover:text-black"
              >
                Abrir en Verificar
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
