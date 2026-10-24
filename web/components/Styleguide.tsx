"use client";

import { useState } from "react";
import type { ResumenEntidad } from "@/lib/tipos";
import { validarValor } from "@/lib/verificar";
import ResumenCard from "@/components/ResumenCard";
import { COLORES } from "@/components/colores";
import {
  IconoAjustes,
  IconoBuscar,
  IconoCasa,
  IconoChat,
  IconoEscudo,
  IconoFlecha,
  IconoGiro,
  IconoGuion,
  IconoOk,
  IconoPeligro,
  IconoPlata,
  IconoRed,
  IconoReloj,
  IconoUbicacion,
} from "@/components/iconos";

// Nombres de los tokens de color (valores en DESIGN.md / globals.css).
const COLORES_TOKENS = [
  ["Neutro", ["tinta", "texto", "suave", "linea", "fondo", "panel", "papel"]],
  ["Protegido", ["seguro", "seguro-fondo", "seguro-linea", "bosque", "bosque-tinta", "lima"]],
  ["Riesgo", ["alerta", "alerta-fondo", "alerta-linea"]],
  ["WhatsApp", ["wa-barra", "wa-fondo", "wa-propio", "wa-composer"]],
] as const;

// Tema "noche": pisa los tokens neutros en el contenedor (los componentes no cambian).
const NOCHE: Record<string, string> = {
  "--color-tinta": "#f0f7e7",
  "--color-texto": "#cfdccb",
  "--color-suave": "#9fb09c",
  "--color-linea": "#2c4a39",
  "--color-fondo": "#0f2a1c",
  "--color-panel": "#163525",
  "--color-papel": "#0c2216",
};

const ROJO: ResumenEntidad = {
  entidad_id: 1,
  tipo: "alias",
  valor_normalizado: "ejemplo.mula.ok",
  encontrada: true,
  reportes: 24,
  provincias: ["Buenos Aires", "Córdoba", "Mendoza", "Santa Fe", "Tucumán"],
  modalidades: ["familiar_numero_nuevo", "accidente_o_comisaria"],
  ultimo: "2026-10-24T15:00:00Z",
  monto_total: 4380000,
};
const VERDE: ResumenEntidad = { ...ROJO, valor_normalizado: "otro.ejemplo", encontrada: false, reportes: 0, provincias: [], modalidades: [], ultimo: null, monto_total: null };

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-linea py-10">
      <h2 className="text-2xl font-bold tracking-tight text-tinta">{titulo}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-semibold tracking-wide text-suave uppercase">{children}</p>;
}

const btnPrincipal =
  "presionable inline-flex h-12 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-control bg-bosque px-6 font-semibold text-bosque-tinta disabled:cursor-not-allowed disabled:opacity-40";
const btnSecundario =
  "presionable inline-flex h-12 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-control border-2 border-linea bg-fondo px-6 font-semibold text-tinta";
const btnPeligro =
  "presionable inline-flex h-12 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-control bg-alerta px-6 font-semibold text-white";

export default function Styleguide() {
  const [noche, setNoche] = useState(false);
  const [compacto, setCompacto] = useState(false);
  const [valor, setValor] = useState("ab");
  const [tab, setTab] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState(false);
  const v = validarValor(valor);

  return (
    <div
      style={{ ...(noche ? NOCHE : {}), zoom: compacto ? 0.88 : 1 } as React.CSSProperties}
      className="min-h-full bg-papel text-tinta"
    >
      {/* Controles en vivo */}
      <div className="sticky top-0 z-30 border-b border-linea bg-fondo/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
          <p className="mr-auto flex items-center gap-2 font-bold text-bosque">
            <IconoEscudo className="h-5 w-5 text-seguro" /> Styleguide
          </p>
          <button type="button" aria-pressed={noche} onClick={() => setNoche((x) => !x)} className={btnSecundario + " h-11"}>
            {noche ? "Tema: noche" : "Tema: día"}
          </button>
          <button type="button" aria-pressed={compacto} onClick={() => setCompacto((x) => !x)} className={btnSecundario + " h-11"}>
            {compacto ? "Densidad: compacta" : "Densidad: cómoda"}
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <h1 className="pt-10 text-5xl font-bold tracking-tight text-tinta">Mula AI · sistema</h1>
        <p className="mt-2 text-suave">Fuente de verdad: DESIGN.md. Sin datos reales.</p>

        <Seccion titulo="Color">
          <div className="grid gap-6 md:grid-cols-2">
            {COLORES_TOKENS.map(([grupo, nombres]) => (
              <div key={grupo}>
                <Etiqueta>{grupo}</Etiqueta>
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {nombres.map((n) => (
                    <li key={n} className="overflow-hidden rounded-control border border-linea bg-fondo">
                      <div className="h-14" style={{ background: `var(--color-${n})` }} />
                      <p className="truncate px-2 py-1.5 font-mono text-xs text-texto">{n}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Tipografía y espaciado">
          <div className="flex flex-col gap-3">
            <p className="text-5xl font-bold tracking-tight">Cuidás a Marta.</p>
            <p className="text-7xl font-extrabold tabular-nums text-alerta">24</p>
            <p className="text-xl font-semibold">Título de bloque</p>
            <p className="text-base text-texto">Cuerpo de texto, corto y directo.</p>
            <p className="text-sm text-suave">Texto secundario</p>
            <p className="font-mono text-base">juli.martinez.mp · 0110599540000123456782</p>
          </div>
          <div className="mt-6 flex flex-wrap items-end gap-4">
            {[2, 3, 4, 6, 8, 12].map((n) => (
              <div key={n} className="flex flex-col items-center gap-1">
                <div className="bg-seguro" style={{ width: n * 4, height: n * 4 }} />
                <span className="font-mono text-xs text-suave">{n * 4}px</span>
              </div>
            ))}
            {(
              [
                ["rounded-control", "rounded-control"],
                ["rounded-tarjeta", "rounded-tarjeta"],
                ["rounded-pastilla", "rounded-pastilla"],
              ] as const
            ).map(([clase, nombre]) => (
              <div key={nombre} className="flex flex-col items-center gap-1">
                <div className={`h-14 w-20 border-2 border-bosque bg-seguro-fondo ${clase}`} />
                <span className="font-mono text-xs text-suave">{nombre}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1">
              <div className="h-14 w-20 rounded-tarjeta bg-fondo shadow-flotante" />
              <span className="font-mono text-xs text-suave">shadow-flotante</span>
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Íconos">
          <div className="flex flex-wrap gap-4 text-bosque">
            {[IconoCasa, IconoChat, IconoBuscar, IconoPeligro, IconoRed, IconoAjustes, IconoEscudo, IconoOk, IconoFlecha, IconoUbicacion, IconoGuion, IconoPlata, IconoReloj, IconoGiro].map((I, i) => (
              <span key={i} className="flex h-11 w-11 items-center justify-center rounded-control bg-fondo">
                <I className="h-6 w-6" />
              </span>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Botones">
          <div className="flex flex-wrap gap-3">
            <button type="button" className={btnPrincipal}>
              <IconoBuscar className="h-5 w-5" /> Principal
            </button>
            <button type="button" className={btnPrincipal} disabled>
              Deshabilitado
            </button>
            <button type="button" className={btnPrincipal}>
              <IconoGiro className="h-5 w-5" /> Cargando
            </button>
            <button type="button" className={btnSecundario}>
              Secundario
            </button>
            <button type="button" className={btnPeligro}>
              <IconoPeligro className="h-5 w-5" /> Peligro
            </button>
          </div>
        </Seccion>

        <Seccion titulo="Input con validación">
          <div className="max-w-xl">
            <div className="relative">
              <IconoBuscar className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-suave" />
              <input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                aria-label="Ejemplo de input"
                aria-invalid={!v.ok && !!v.error}
                className={`h-14 w-full rounded-control border-2 bg-fondo pr-24 pl-12 font-mono text-lg text-tinta focus:outline-none ${
                  !v.ok && v.error ? "border-alerta" : "border-linea focus:border-bosque"
                }`}
              />
              {v.ok && (
                <span className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 rounded-control bg-seguro-fondo px-2 py-1 text-xs font-semibold text-seguro">
                  <IconoOk className="h-3.5 w-3.5" /> {v.tipo}
                </span>
              )}
            </div>
            <p className="mt-1.5 h-5 text-sm font-medium text-alerta">{!v.ok ? v.error : ""}</p>
            <div className="flex flex-wrap gap-2">
              {["", "ab", "juli.martinez.mp", "0110599540000123456782", "12345"].map((x) => (
                <button key={x || "vacío"} type="button" onClick={() => setValor(x)} className="presionable min-h-11 cursor-pointer rounded-pastilla border border-linea bg-fondo px-3 font-mono text-sm">
                  {x || "(vacío)"}
                </button>
              ))}
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Chips y badges">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-pastilla border border-alerta-linea bg-alerta-fondo px-3 py-1.5 font-mono text-sm text-alerta">
              <span className="h-2 w-2 rounded-full bg-alerta" /> con reportes
            </span>
            <span className="flex items-center gap-1.5 rounded-pastilla border border-seguro-linea bg-seguro-fondo px-3 py-1.5 font-mono text-sm text-seguro">
              <span className="h-2 w-2 rounded-full bg-seguro" /> limpio
            </span>
            <span className="rounded px-1.5 py-0.5 text-sm font-semibold bg-alerta text-white">Riesgo 94</span>
            <span className="rounded px-1.5 py-0.5 text-sm font-semibold bg-panel text-tinta">Riesgo 30</span>
            <span className="flex items-center gap-2 rounded-pastilla bg-lima px-4 py-2 text-sm font-semibold text-bosque">
              <IconoEscudo className="h-5 w-5" /> Protegida
            </span>
          </div>
        </Seccion>

        <Seccion titulo="Resultado de cuenta">
          <div className="grid gap-6 lg:grid-cols-2">
            <ResumenCard resumen={ROJO} />
            <div className="flex flex-col gap-6">
              <ResumenCard resumen={VERDE} />
              <ResumenCard resumen={ROJO} compacto />
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Alerta">
          <ul className="max-w-xl divide-y divide-linea overflow-hidden rounded-tarjeta border border-linea bg-fondo">
            {[true, false].map((nueva) => (
              <li key={String(nueva)} className={`px-4 py-3 ${nueva ? "bg-alerta-fondo" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">Familiar número nuevo</p>
                  <span className="rounded bg-alerta px-1.5 py-0.5 text-sm font-semibold text-white">Riesgo 94</span>
                </div>
                <p className="text-sm text-suave">{nueva ? "recién" : "hace 2 horas"} · Marta</p>
              </li>
            ))}
          </ul>
        </Seccion>

        <Seccion titulo="Pestañas y barra lateral">
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <nav aria-label="Barra lateral de ejemplo" className="flex flex-col gap-1 rounded-tarjeta bg-bosque p-2 text-bosque-tinta">
              {[IconoCasa, IconoBuscar, IconoRed].map((I, i) => (
                <button key={i} type="button" onClick={() => setTab(i)} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-3 font-semibold ${tab === i ? "bg-lima text-bosque" : "hover:bg-white/10"}`}>
                  <I className="h-5 w-5" /> {["Inicio", "Verificar", "Red"][i]}
                </button>
              ))}
            </nav>
            <div>
              <ul role="tablist" className="flex gap-1 border-b border-linea">
                {["Inicio", "Verificar", "Red"].map((t, i) => (
                  <li key={t}>
                    <button role="tab" type="button" aria-selected={tab === i} onClick={() => setTab(i)} className={`min-h-11 cursor-pointer border-b-[3px] px-3 font-semibold ${tab === i ? "border-bosque text-bosque" : "border-transparent text-suave"}`}>
                      {t}
                    </button>
                  </li>
                ))}
              </ul>
              <table className="mt-4 w-full text-left text-sm">
                <thead className="text-suave">
                  <tr>
                    <th className="py-2 font-semibold">Cuenta</th>
                    <th className="py-2 font-semibold">Reportes</th>
                    <th className="py-2 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-linea">
                  {[
                    ["ejemplo.mula.ok", 24, true],
                    ["otro.ejemplo", 0, false],
                  ].map(([c, n, r]) => (
                    <tr key={String(c)}>
                      <td className="py-2 font-mono">{c}</td>
                      <td className="py-2 tabular-nums">{n}</td>
                      <td className="py-2">
                        <span className={`font-semibold ${r ? "text-alerta" : "text-seguro"}`}>{r ? "Riesgo" : "Limpio"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Drawer y toast">
          <div className="flex flex-wrap gap-3">
            <button type="button" className={btnSecundario} onClick={() => setDrawer(true)}>
              Abrir drawer
            </button>
            <button
              type="button"
              className={btnSecundario}
              onClick={() => {
                setToast(true);
                setTimeout(() => setToast(false), 2500);
              }}
            >
              Mostrar toast
            </button>
          </div>
        </Seccion>

        <Seccion titulo="Estados">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col items-center gap-2 rounded-tarjeta border border-dashed border-linea p-6 text-center text-suave">
              <IconoEscudo className="h-8 w-8" /> Vacío: todavía no hay alertas
            </div>
            <div className="h-28 animate-pulse rounded-tarjeta bg-panel" aria-label="Cargando" />
            <p className="flex items-center gap-2 rounded-tarjeta border-2 border-linea bg-panel p-4 font-medium text-texto">
              <IconoPeligro className="h-5 w-5 text-suave" /> No pudimos cargar. Probá de nuevo.
            </p>
          </div>
        </Seccion>

        <Seccion titulo="WhatsApp y grafo">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-tarjeta bg-wa-fondo p-4">
              <p className="max-w-[85%] self-start rounded-2xl rounded-tl-none bg-white px-3 py-2 text-[15px] shadow-sm">Hola abu, cambié de número…</p>
              <p className="max-w-[85%] self-end rounded-2xl rounded-tr-none bg-wa-propio px-3 py-2 text-[15px] shadow-sm">¿Quién sos?</p>
              <div className="self-center overflow-hidden rounded-2xl border-2 border-alerta bg-white">
                <p className="flex items-center gap-2 bg-alerta px-3 py-1.5 font-bold text-white">
                  <IconoPeligro className="h-5 w-5" /> Mula AI · 94/100
                </p>
                <p className="px-3 py-2 text-sm">No transfieras.</p>
              </div>
            </div>
            <ul className="flex flex-wrap items-center gap-4 rounded-tarjeta bg-fondo p-4">
              {Object.entries(COLORES).map(([tipo, color]) => (
                <li key={tipo} className="flex items-center gap-2 text-sm">
                  <span className="h-4 w-4 rounded-full" style={{ background: color }} /> {tipo}
                </li>
              ))}
              <li className="flex items-center gap-2 text-sm">
                <span className="h-4 w-4 animate-ping rounded-full bg-alerta" /> destacado
              </li>
            </ul>
          </div>
        </Seccion>
      </main>

      {drawer && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={() => setDrawer(false)}>
          <aside
            role="dialog"
            aria-label="Drawer de ejemplo"
            onClick={(e) => e.stopPropagation()}
            className="h-full w-full max-w-sm animate-entrada overflow-y-auto overscroll-contain bg-fondo p-6 shadow-flotante"
          >
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold">Me estafaron</p>
              <button type="button" onClick={() => setDrawer(false)} className={btnSecundario + " h-11"}>
                Cerrar
              </button>
            </div>
            <p className="mt-4 text-texto">Contenido del panel lateral.</p>
          </aside>
        </div>
      )}
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 animate-entrada items-center gap-2 rounded-pastilla bg-bosque px-5 py-3 font-semibold text-bosque-tinta shadow-flotante">
          <IconoOk className="h-5 w-5 text-lima" /> Guardado
        </div>
      )}
    </div>
  );
}
