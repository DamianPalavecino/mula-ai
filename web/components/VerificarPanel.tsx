"use client";

import { useEffect, useState } from "react";
import type { ResumenEntidad } from "@/lib/tipos";
import { TIPOS_ENTIDAD } from "@/lib/tipos";
import { EJEMPLOS_VERIFICAR, validarValor } from "@/lib/verificar";
import ResumenCard from "@/components/ResumenCard";
import { IconoBuscar, IconoGiro, IconoOk, IconoPeligro } from "@/components/iconos";

type Estado =
  | { tipo: "inicial" }
  | { tipo: "cargando" }
  | { tipo: "listo"; resumen: ResumenEntidad }
  | { tipo: "error" };

// Pestaña "Verificar" del panel: valida en vivo y consulta /admin/api/resumen (sesión de Clerk).
export default function VerificarPanel({ inicial = "" }: { inicial?: string }) {
  const [valor, setValor] = useState(inicial);
  const [tocado, setTocado] = useState(false);
  const [estado, setEstado] = useState<Estado>({ tipo: "inicial" });
  const v = validarValor(valor);

  async function consultar(x: string) {
    setValor(x);
    const val = validarValor(x);
    if (!val.ok) {
      setTocado(true);
      return;
    }
    setEstado({ tipo: "cargando" });
    try {
      const r = await fetch(
        `/admin/api/resumen?valor=${encodeURIComponent(x.trim().slice(0, 60))}`,
        { cache: "no-store" },
      );
      if (!r.ok) throw new Error();
      setEstado({ tipo: "listo", resumen: (await r.json()) as ResumenEntidad });
    } catch {
      setEstado({ tipo: "error" });
    }
  }

  useEffect(() => {
    if (inicial) consultar(inicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargando = estado.tipo === "cargando";
  const error = tocado && !v.ok ? v.error : null;

  return (
    <div className="flex flex-col gap-5">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTocado(true);
          consultar(valor);
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 sm:flex-1">
            <IconoBuscar className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-suave" />
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onBlur={() => setTocado(true)}
              maxLength={60}
              placeholder="alias, CBU, teléfono…"
              aria-label="Alias, CBU/CVU, teléfono, CUIT o link"
              aria-invalid={!!error}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className={`h-14 w-full rounded-2xl border-2 bg-fondo pr-24 pl-12 font-mono text-lg text-tinta placeholder:font-sans placeholder:text-suave focus:outline-none ${
                error ? "border-alerta" : "border-linea focus:border-bosque"
              }`}
            />
            {v.ok && (
              <span className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 rounded-lg bg-seguro-fondo px-2 py-1 text-xs font-semibold text-seguro">
                <IconoOk className="h-3.5 w-3.5" />
                {TIPOS_ENTIDAD[v.tipo]}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!v.ok || cargando}
            className="presionable flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-bosque px-7 text-lg font-semibold text-bosque-tinta disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cargando ? <IconoGiro className="h-5 w-5" /> : <IconoBuscar className="h-5 w-5" />}
            Verificar
          </button>
        </div>
        <p className="mt-1.5 h-5 text-sm font-medium text-alerta" role="status">
          {error ?? ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {EJEMPLOS_VERIFICAR.map((e) => (
            <button
              key={e.valor}
              type="button"
              onClick={() => {
                setTocado(false);
                consultar(e.valor);
              }}
              className={`presionable flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-sm ${
                e.limpio
                  ? "border-seguro-linea bg-seguro-fondo text-seguro"
                  : "border-alerta-linea bg-alerta-fondo text-alerta"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${e.limpio ? "bg-seguro" : "bg-alerta"}`} aria-hidden />
              {e.etiqueta}
            </button>
          ))}
        </div>
      </form>

      {cargando && <div className="h-56 animate-pulse rounded-xl bg-panel" aria-label="Buscando" />}
      {estado.tipo === "listo" && <ResumenCard key={estado.resumen.valor_normalizado} resumen={estado.resumen} />}
      {estado.tipo === "error" && (
        <p className="flex items-center gap-2 rounded-xl border-2 border-linea bg-panel p-4 font-medium text-texto">
          <IconoPeligro className="h-5 w-5 text-suave" /> No pudimos consultar la red. Probá de nuevo.
        </p>
      )}
    </div>
  );
}
