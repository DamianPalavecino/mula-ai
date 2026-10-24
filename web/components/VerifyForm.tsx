"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ResumenEntidad } from "@/lib/tipos";
import ResumenCard from "@/components/ResumenCard";
import FaltaConfig from "@/components/FaltaConfig";

type Estado =
  | { tipo: "inicial" }
  | { tipo: "cargando" }
  | { tipo: "listo"; resumen: ResumenEntidad }
  | { tipo: "error"; mensaje: string };

const EJEMPLO = "juli.martinez.mp";

export default function VerifyForm() {
  const router = useRouter();
  const valorUrl = useSearchParams().get("valor")?.trim() ?? "";
  const [input, setInput] = useState(valorUrl);
  const [estado, setEstado] = useState<Estado>({ tipo: "inicial" });
  const [intento, setIntento] = useState(0); // para re-buscar el mismo valor

  // La URL (?valor=) manda: precarga el input y dispara la búsqueda.
  useEffect(() => {
    setInput(valorUrl);
    if (!valorUrl || !supabase) {
      setEstado({ tipo: "inicial" });
      return;
    }
    let cancelado = false;
    setEstado({ tipo: "cargando" });
    supabase.rpc("resumen_entidad", { valor: valorUrl }).then(({ data, error }) => {
      if (cancelado) return;
      if (error || !data) {
        setEstado({ tipo: "error", mensaje: "No pudimos consultar la red. Probá de nuevo." });
      } else {
        setEstado({ tipo: "listo", resumen: data as ResumenEntidad });
      }
    });
    return () => {
      cancelado = true;
    };
  }, [valorUrl, intento]);

  function buscar(valor: string) {
    const limpio = valor.trim();
    if (!limpio) return;
    if (limpio === valorUrl) {
      setIntento((n) => n + 1);
    } else {
      router.replace(`/verificar?valor=${encodeURIComponent(limpio)}`, { scroll: false });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {!supabase && <FaltaConfig />}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          buscar(input);
        }}
      >
        <label htmlFor="valor" className="text-sm font-medium text-suave">
          Alias, CBU/CVU o teléfono
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="valor"
            name="valor"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`ej. ${EJEMPLO}`}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="h-12 flex-1 rounded-md border border-linea bg-fondo px-4 font-mono text-base text-tinta placeholder:text-suave focus:border-tinta focus:outline-none"
          />
          <button
            type="submit"
            disabled={!supabase || estado.tipo === "cargando"}
            className="h-12 cursor-pointer rounded-md bg-tinta px-6 text-base font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {estado.tipo === "cargando" ? "Buscando…" : "Verificar"}
          </button>
        </div>
        <p className="mt-3 text-sm text-suave">
          Probá con{" "}
          <button
            type="button"
            onClick={() => buscar(EJEMPLO)}
            className="cursor-pointer font-mono text-tinta underline underline-offset-2 hover:text-black"
          >
            {EJEMPLO}
          </button>
        </p>
      </form>

      {estado.tipo === "listo" && <ResumenCard resumen={estado.resumen} />}
      {estado.tipo === "error" && (
        <p className="rounded-lg border border-linea bg-panel p-4 text-base text-texto">
          {estado.mensaje}
        </p>
      )}
    </div>
  );
}
