"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Alerta, Grafo, Nodo, ResumenEntidad, TipoNodo } from "@/lib/tipos";
import { TIPOS_ENTIDAD } from "@/lib/tipos";
import AlertFeed from "@/components/AlertFeed";
import ResumenCard from "@/components/ResumenCard";
import FaltaConfig from "@/components/FaltaConfig";
import { COLORES } from "@/components/colores";

// react-force-graph-2d usa canvas/window: solo en el cliente.
const Graph = dynamic(() => import("@/components/Graph"), {
  ssr: false,
  loading: () => <Aviso texto="Cargando la red…" />,
});

const DURACION_DESTACADO = 8000;

function Aviso({ texto }: { texto: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-sm text-suave">
      {texto}
    </div>
  );
}

// Mantiene los objetos de nodos ya existentes (con su posición x/y) para que
// el grafo no se reacomode entero cada vez que se refresca.
function fusionar(previos: Map<string, Nodo>, nuevo: Grafo): Grafo {
  const nodes = (nuevo.nodes ?? []).map((n) => {
    const previo = previos.get(n.id);
    if (previo) return Object.assign(previo, n);
    return { ...n };
  });
  previos.clear();
  for (const n of nodes) previos.set(n.id, n);
  return { nodes, links: (nuevo.links ?? []).map((l) => ({ ...l })) };
}

const LEYENDA: TipoNodo[] = ["alias", "cbu", "cvu", "telefono", "cuit", "link", "reporte"];

export default function RedView() {
  const [grafo, setGrafo] = useState<Grafo | null>(null);
  const [error, setError] = useState(false);
  const [destacados, setDestacados] = useState<string[]>([]);
  const [foco, setFoco] = useState<{ id: string; vez: number; conPanel: boolean } | null>(null);
  const [alertaSel, setAlertaSel] = useState<number | null>(null);
  const [seleccionado, setSeleccionado] = useState<Nodo | null>(null);
  const [resumen, setResumen] = useState<ResumenEntidad | null>(null);
  const nodos = useRef(new Map<string, Nodo>());
  const panelRef = useRef<HTMLDivElement>(null);
  const timerDestacado = useRef<ReturnType<typeof setTimeout> | null>(null);

  // En mobile el panel va debajo del grafo: lo traemos a la vista al abrirlo.
  useEffect(() => {
    if (seleccionado && !window.matchMedia("(min-width: 1024px)").matches) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [seleccionado]);

  const cargarGrafo = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.rpc("grafo");
    if (error) {
      setError(true);
      return;
    }
    setError(false);
    setGrafo(fusionar(nodos.current, (data ?? { nodes: [], links: [] }) as Grafo));
  }, []);

  useEffect(() => {
    cargarGrafo();
    return () => {
      if (timerDestacado.current) clearTimeout(timerDestacado.current);
    };
  }, [cargarGrafo]);

  const seleccionar = useCallback((nodo: Nodo) => {
    setSeleccionado(nodo);
    setResumen(null);
    if (!supabase || nodo.tipo === "reporte") return;
    supabase
      .rpc("resumen_entidad", { valor: nodo.label, tipo: nodo.tipo })
      .then(({ data }) => {
        if (data) setResumen(data as ResumenEntidad);
      });
  }, []);

  const destacar = useCallback((alerta: Alerta, conPanel = false) => {
    const ids = (alerta.entidad_ids ?? []).map((id) => `e_${id}`);
    if (ids.length === 0) return;
    setDestacados(ids);
    setFoco({ id: ids[0], vez: Date.now(), conPanel });
    if (timerDestacado.current) clearTimeout(timerDestacado.current);
    timerDestacado.current = setTimeout(() => setDestacados([]), DURACION_DESTACADO);
  }, []);

  const onNueva = useCallback(
    async (alerta: Alerta) => {
      await cargarGrafo();
      destacar(alerta);
    },
    [cargarGrafo, destacar],
  );

  const onSeleccionarAlerta = useCallback(
    (alerta: Alerta) => {
      setAlertaSel(alerta.id);
      const primero = nodos.current.get(`e_${alerta.entidad_ids?.[0]}`);
      destacar(alerta, !!primero);
      if (primero) seleccionar(primero);
    },
    [destacar, seleccionar],
  );

  if (!supabase) return <FaltaConfig />;

  return (
    <div className="grid gap-4 lg:h-[calc(100svh-17rem)] lg:min-h-[520px] lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="h-60 lg:order-2 lg:h-auto lg:min-h-0">
        <AlertFeed
          onNueva={onNueva}
          onSeleccionar={onSeleccionarAlerta}
          seleccionada={alertaSel}
        />
      </div>

      <div className="relative flex min-h-0 flex-col gap-3">
        <div className="relative h-[480px] overflow-hidden rounded-lg border border-linea bg-fondo lg:h-auto lg:flex-1">
          {error && <Aviso texto="No pudimos cargar la red. Recargá la página." />}
          {!error && !grafo && <Aviso texto="Cargando la red…" />}
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
                href={`/verificar?valor=${encodeURIComponent(seleccionado.label)}`}
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
