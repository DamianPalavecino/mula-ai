"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Alerta, Grafo } from "@/lib/tipos";
import type { Conteo } from "@/lib/adminStats";
import type { ValoresSetup } from "@/components/AppSetupForm";
import AppAlertas from "@/components/AppAlertas";
import AppProbarMensaje from "@/components/AppProbarMensaje";
import AppSetupForm from "@/components/AppSetupForm";
import MeEstafaronForm from "@/components/MeEstafaronForm";
import AdminRed from "@/components/AdminRed";
import VerificarPanel from "@/components/VerificarPanel";
import {
  IconoAjustes,
  IconoBuscar,
  IconoCasa,
  IconoChat,
  IconoEscudo,
  IconoFlecha,
  IconoPeligro,
  IconoRed,
} from "@/components/iconos";

export const TABS = ["inicio", "probar", "verificar", "me-estafaron", "red", "ajustes"] as const;
export type Tab = (typeof TABS)[number];

const NAV: { id: Tab; label: string; Icono: (p: { className?: string }) => React.ReactNode }[] = [
  { id: "inicio", label: "Inicio", Icono: IconoCasa },
  { id: "probar", label: "Probar", Icono: IconoChat },
  { id: "verificar", label: "Verificar", Icono: IconoBuscar },
  { id: "me-estafaron", label: "Me estafaron", Icono: IconoPeligro },
  { id: "red", label: "Red", Icono: IconoRed },
  { id: "ajustes", label: "Ajustes", Icono: IconoAjustes },
];

export interface DatosPanel {
  tabInicial: Tab;
  valorVerificar: string;
  protegido: { nombre: string; ubicacion: string } | null;
  misAlertas: Alerta[];
  probarConfigurado: boolean;
  grafo: Grafo;
  alertasRed: Alerta[];
  stats: { reportes: number; cuentas: number; provincias: number; porProvincia: Conteo[]; porModalidad: Conteo[] };
  setup: { valores: ValoresSetup; provincias: string[] };
  error: boolean;
}

function Stat({ label, valor, tono = "normal" }: { label: string; valor: number; tono?: "normal" | "alerta" }) {
  return (
    <div className="min-w-0 rounded-tarjeta bg-white/10 px-4 py-3">
      <p className="truncate text-xs font-medium text-bosque-tinta/80">{label}</p>
      <p className={`mt-0.5 text-3xl font-bold tracking-tight tabular-nums ${tono === "alerta" ? "text-lima" : ""}`}>
        {valor.toLocaleString("es-AR")}
      </p>
    </div>
  );
}

function Barras({ titulo, items }: { titulo: string; items: Conteo[] }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  return (
    <section className="rounded-tarjeta border border-linea bg-fondo p-5">
      <h3 className="text-base font-semibold text-tinta">{titulo}</h3>
      <ul className="mt-4 flex flex-col gap-3">
        {items.slice(0, 8).map((i) => (
          <li key={i.clave}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-tinta">{i.label}</span>
              <span className="shrink-0 font-semibold tabular-nums text-texto">{i.n}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-panel">
              <div className="h-2 rounded-full bg-bosque" style={{ width: `${Math.max(2, (i.n / max) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Atajo({ Icono, titulo, tono, onClick }: { Icono: (p: { className?: string }) => React.ReactNode; titulo: string; tono: "bosque" | "alerta"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`presionable flex w-full cursor-pointer items-center gap-3 rounded-tarjeta border px-4 py-4 text-left text-base font-semibold ${
        tono === "alerta"
          ? "border-alerta-linea bg-alerta-fondo text-alerta"
          : "border-seguro-linea bg-seguro-fondo text-bosque"
      }`}
    >
      <Icono className="h-6 w-6 shrink-0" />
      <span className="flex-1">{titulo}</span>
      <IconoFlecha className="h-5 w-5 shrink-0 opacity-60" />
    </button>
  );
}

// Panel único de /app: todo en pestañas, sin recargar (la URL guarda ?tab=).
export default function Panel(d: DatosPanel) {
  const [tab, setTab] = useState<Tab>(d.tabInicial);
  const [visitadas, setVisitadas] = useState<Set<Tab>>(() => new Set([d.tabInicial, "inicio"]));

  const ir = useCallback((t: Tab) => {
    setTab(t);
    setVisitadas((v) => (v.has(t) ? v : new Set(v).add(t)));
    const url = t === "inicio" ? "/app" : `/app?tab=${t}`;
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0 });
  }, []);

  // Un link a /app?tab=… (header, redirects viejos) con el panel ya abierto cambia de pestaña.
  useEffect(() => {
    setTab(d.tabInicial);
    setVisitadas((v) => (v.has(d.tabInicial) ? v : new Set(v).add(d.tabInicial)));
  }, [d.tabInicial]);

  const nombre = d.protegido?.nombre ?? null;
  const panel = (t: Tab, contenido: React.ReactNode) =>
    visitadas.has(t) ? (
      <section hidden={tab !== t} aria-labelledby={`tab-${t}`}>
        {contenido}
      </section>
    ) : null;

  return (
    <main className="flex-1 bg-papel">
      {/* Banda superior: a quién cuidás + la red en números */}
      <div className="bg-bosque text-bosque-tinta">
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-6 sm:px-6 sm:pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {nombre ? `Cuidás a ${nombre}.` : "Protegé a alguien."}
              </h1>
              {d.protegido?.ubicacion && <p className="mt-1 text-base text-bosque-tinta/80">{d.protegido.ubicacion}</p>}
            </div>
            {nombre && (
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-2 rounded-pastilla bg-lima px-4 py-2 text-sm font-semibold text-bosque">
                  <IconoEscudo className="h-5 w-5" /> Protegida
                </span>
                <Link
                  href="/app/vincular"
                  className="presionable flex items-center gap-2 rounded-pastilla border border-bosque-tinta/30 px-4 py-2 text-sm font-semibold text-bosque-tinta hover:bg-white/10"
                >
                  <IconoChat className="h-5 w-5" /> WhatsApp
                </Link>
              </div>
            )}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Alertas" valor={d.misAlertas.length} tono={d.misAlertas.length ? "alerta" : "normal"} />
            <Stat label="Reportes en la red" valor={d.stats.reportes} />
            <Stat label="Cuentas y números" valor={d.stats.cuentas} />
            <Stat label="Provincias" valor={d.stats.provincias} />
          </div>
        </div>
      </div>

      {/* Pestañas: barra fija, con scroll horizontal en mobile */}
      <nav className="sticky top-0 z-20 border-b border-linea bg-papel/95 backdrop-blur" aria-label="Secciones del panel">
        <ul role="tablist" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 [scrollbar-width:none] sm:px-4">
          {NAV.map(({ id, label, Icono }) => {
            const activa = tab === id;
            return (
              <li key={id} className="shrink-0">
                <button
                  id={`tab-${id}`}
                  role="tab"
                  type="button"
                  aria-selected={activa}
                  onClick={() => ir(id)}
                  className={`flex cursor-pointer items-center gap-2 border-b-[3px] px-3 py-3.5 text-sm font-semibold ${
                    activa
                      ? id === "me-estafaron"
                        ? "border-alerta text-alerta"
                        : "border-bosque text-bosque"
                      : "border-transparent text-suave hover:text-tinta"
                  }`}
                >
                  <Icono className="h-5 w-5" />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {d.error && (
          <p className="mb-4 flex items-center gap-2 rounded-tarjeta border border-linea bg-panel p-4 text-sm font-medium text-texto">
            <IconoPeligro className="h-5 w-5 text-suave" /> Algunos datos no cargaron. Recargá en unos segundos.
          </p>
        )}

        {panel(
          "inicio",
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              {nombre ? (
                <AppAlertas iniciales={d.misAlertas} nombre={nombre} />
              ) : (
                <button
                  type="button"
                  onClick={() => ir("ajustes")}
                  className="presionable flex w-full cursor-pointer flex-col items-start gap-3 rounded-tarjeta bg-lima p-6 text-left text-bosque sm:p-8"
                >
                  <IconoEscudo className="h-10 w-10" />
                  <span className="text-2xl font-bold tracking-tight">Cargá a quién cuidás</span>
                  <span className="flex items-center gap-1 font-semibold">
                    Empezar <IconoFlecha className="h-5 w-5" />
                  </span>
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Atajo Icono={IconoBuscar} titulo="Verificar una cuenta" tono="bosque" onClick={() => ir("verificar")} />
              <Atajo Icono={IconoChat} titulo="Probar un mensaje" tono="bosque" onClick={() => ir("probar")} />
              <Atajo Icono={IconoRed} titulo="Ver la red" tono="bosque" onClick={() => ir("red")} />
              <Atajo Icono={IconoPeligro} titulo="Me estafaron" tono="alerta" onClick={() => ir("me-estafaron")} />
            </div>
          </div>,
        )}

        {panel(
          "probar",
          <div className="max-w-3xl">
            {d.probarConfigurado ? (
              <AppProbarMensaje />
            ) : (
              <p className="rounded-tarjeta border border-linea bg-panel p-5 text-texto">El guardián no está conectado ahora.</p>
            )}
          </div>,
        )}

        {panel(
          "verificar",
          <div className="max-w-3xl">
            <VerificarPanel inicial={d.valorVerificar} />
          </div>,
        )}

        {panel(
          "me-estafaron",
          <div className="max-w-3xl">
            <MeEstafaronForm />
          </div>,
        )}

        {panel(
          "red",
          <div className="flex flex-col gap-6">
            <AdminRed grafoInicial={d.grafo} alertasIniciales={d.alertasRed} />
            <div className="grid gap-4 md:grid-cols-2">
              <Barras titulo="Por provincia" items={d.stats.porProvincia} />
              <Barras titulo="Por modalidad" items={d.stats.porModalidad} />
            </div>
          </div>,
        )}

        {panel(
          "ajustes",
          <div className="max-w-2xl">
            <AppSetupForm valores={d.setup.valores} provincias={d.setup.provincias} />
          </div>,
        )}
      </div>
    </main>
  );
}
