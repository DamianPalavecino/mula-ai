"use client";

import { useCallback, useEffect, useState } from "react";
import { BellIcon, FileWarningIcon, MapPinIcon, NetworkIcon } from "lucide-react";
import type { Alerta, Grafo } from "@/lib/tipos";
import type { Conteo } from "@/lib/adminStats";
import type { Tab } from "@/lib/panel";
import { labelModalidad } from "@/lib/tipos";
import { fechaRelativa } from "@/lib/formato";
import type { ValoresSetup } from "@/components/AppSetupForm";
import AppAlertas from "@/components/AppAlertas";
import AppProbarMensaje from "@/components/AppProbarMensaje";
import AppSetupForm from "@/components/AppSetupForm";
import MeEstafaronForm from "@/components/MeEstafaronForm";
import AdminRed from "@/components/AdminRed";
import VerificarPanel from "@/components/VerificarPanel";
import { AppShell } from "@/components/app-shell";

export interface DatosPanel {
  tabInicial: Tab;
  valorVerificar: string;
  protegido: { nombre: string; ubicacion: string } | null;
  misAlertas: Alerta[];
  probarConfigurado: boolean;
  conUsuario: boolean;
  grafo: Grafo;
  alertasRed: Alerta[];
  stats: { reportes: number; cuentas: number; provincias: number; porProvincia: Conteo[]; porModalidad: Conteo[] };
  setup: { valores: ValoresSetup; provincias: string[] };
  error: boolean;
}

type Icono = (p: { className?: string }) => React.ReactNode;

function Stat({ label, valor, Icono, tono = "neutro" }: { label: string; valor: number; Icono: Icono; tono?: "neutro" | "alerta" }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-tarjeta border border-linea bg-fondo px-4 py-3">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-control ${
          tono === "alerta" ? "bg-alerta-fondo text-alerta" : "bg-seguro-fondo text-seguro"
        }`}
      >
        <Icono className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl leading-none font-bold tabular-nums text-tinta">{valor.toLocaleString("es-AR")}</p>
        <p className="mt-1 truncate text-xs font-medium text-suave">{label}</p>
      </div>
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
            <div className="mt-1 h-2 rounded-pastilla bg-panel">
              <div className="h-2 rounded-pastilla bg-seguro" style={{ width: `${Math.max(2, (i.n / max) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Alertas de toda la red (alertaParaRol ya sacó los datos personales para usuarios).
function AlertasRed({ alertas, onVer }: { alertas: Alerta[]; onVer: () => void }) {
  if (alertas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-tarjeta border border-dashed border-linea p-10 text-center">
        <BellIcon className="size-8 text-seguro" />
        <p className="font-semibold text-tinta">Sin alertas en la red</p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-linea overflow-hidden rounded-tarjeta border border-linea bg-fondo">
      {alertas.map((a) => {
        const alto = (a.riesgo ?? 0) >= 70;
        return (
          <li key={a.id}>
            <button type="button" onClick={onVer} className="flex min-h-11 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-panel">
              <span className={`size-2.5 shrink-0 rounded-full ${alto ? "bg-alerta" : "bg-suave"}`} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-tinta">{labelModalidad(a.modalidad)}</span>
                <span className="block text-sm text-suave">{fechaRelativa(a.created_at)}</span>
              </span>
              {a.riesgo != null && (
                <span className={`shrink-0 rounded-control px-2 py-0.5 text-sm font-semibold tabular-nums ${alto ? "bg-alerta text-white" : "bg-panel text-tinta"}`}>
                  {a.riesgo}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// Panel único de /app: shell de Efferd (sidebar) + una sección a la vez, sin recargar (?tab=).
export default function Panel(d: DatosPanel) {
  const [tab, setTab] = useState<Tab>(d.tabInicial);
  const [visitadas, setVisitadas] = useState<Set<Tab>>(() => new Set([d.tabInicial, "inicio"]));

  const ir = useCallback((t: Tab) => {
    setTab(t);
    setVisitadas((v) => (v.has(t) ? v : new Set(v).add(t)));
    window.history.replaceState(null, "", t === "inicio" ? "/app" : `/app?tab=${t}`);
  }, []);

  // Un link a /app?tab=… con el panel ya abierto cambia de sección.
  useEffect(() => {
    setTab(d.tabInicial);
    setVisitadas((v) => (v.has(d.tabInicial) ? v : new Set(v).add(d.tabInicial)));
  }, [d.tabInicial]);

  const seccion = (t: Tab, contenido: React.ReactNode) =>
    visitadas.has(t) ? (
      <section hidden={tab !== t} className="min-w-0">
        {contenido}
      </section>
    ) : null;

  return (
    <AppShell activa={tab} onIr={ir} protegido={d.protegido} alertas={d.misAlertas.length} conUsuario={d.conUsuario}>
      {d.error && (
        <p className="rounded-tarjeta border border-linea bg-panel p-4 text-sm font-medium text-texto">
          Algunos datos no cargaron. Recargá en unos segundos.
        </p>
      )}

      {seccion(
        "inicio",
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Alertas" valor={d.misAlertas.length} Icono={BellIcon} tono={d.misAlertas.length ? "alerta" : "neutro"} />
            <Stat label="Reportes en la red" valor={d.stats.reportes} Icono={FileWarningIcon} />
            <Stat label="Cuentas y números" valor={d.stats.cuentas} Icono={NetworkIcon} />
            <Stat label="Provincias" valor={d.stats.provincias} Icono={MapPinIcon} />
          </div>
          {d.protegido ? (
            <AppAlertas iniciales={d.misAlertas} nombre={d.protegido.nombre} />
          ) : (
            <button
              type="button"
              onClick={() => ir("ajustes")}
              className="presionable flex min-h-11 cursor-pointer flex-col items-center gap-2 rounded-tarjeta border border-dashed border-seguro-linea bg-seguro-fondo p-10 text-center text-bosque"
            >
              <BellIcon className="size-8 text-seguro" />
              <span className="text-lg font-bold">Cargá a quién cuidás</span>
            </button>
          )}
        </div>,
      )}

      {seccion(
        "alertas",
        <div className="max-w-3xl">
          <AlertasRed alertas={d.alertasRed} onVer={() => ir("red")} />
        </div>,
      )}

      {seccion(
        "probar",
        <div className="max-w-3xl">
          {d.probarConfigurado ? (
            <AppProbarMensaje />
          ) : (
            <p className="rounded-tarjeta border border-linea bg-panel p-5 text-texto">El guardián no está conectado ahora.</p>
          )}
        </div>,
      )}

      {seccion(
        "verificar",
        <div className="max-w-3xl">
          <VerificarPanel inicial={d.valorVerificar} />
        </div>,
      )}

      {seccion(
        "me-estafaron",
        <div className="max-w-3xl">
          <MeEstafaronForm />
        </div>,
      )}

      {seccion(
        "red",
        <div className="flex flex-col gap-6">
          <AdminRed grafoInicial={d.grafo} alertasIniciales={d.alertasRed} />
          <div className="grid gap-4 md:grid-cols-2">
            <Barras titulo="Por provincia" items={d.stats.porProvincia} />
            <Barras titulo="Por modalidad" items={d.stats.porModalidad} />
          </div>
        </div>,
      )}

      {seccion(
        "ajustes",
        <div className="max-w-2xl">
          <AppSetupForm valores={d.setup.valores} provincias={d.setup.provincias} />
        </div>,
      )}
    </AppShell>
  );
}
