"use client";

import { useState } from "react";
import type { RespuestaAnalizar } from "@/lib/tipos";
import { labelModalidad } from "@/lib/tipos";

type Estado =
  | { tipo: "inicial" }
  | { tipo: "cargando" }
  | { tipo: "listo"; r: RespuestaAnalizar }
  | { tipo: "error"; mensaje: string };

// "Probar un mensaje": pasa por /app/api/analizar (server, con sesión). No manda WhatsApp.
export default function AppProbarMensaje() {
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<Estado>({ tipo: "inicial" });

  async function analizar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEstado({ tipo: "cargando" });
    try {
      const res = await fetch("/app/api/analizar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || typeof json.riesgo !== "number") {
        setEstado({ tipo: "error", mensaje: json?.error ?? "No pudimos analizar el mensaje." });
        return;
      }
      setEstado({ tipo: "listo", r: json as RespuestaAnalizar });
    } catch {
      setEstado({ tipo: "error", mensaje: "No pudimos analizar el mensaje." });
    }
  }

  return (
    <section className="rounded-lg border border-linea bg-fondo p-4 sm:p-5">
      <h2 className="text-base font-semibold text-tinta">Probar un mensaje</h2>
      <p className="mt-1 text-sm text-suave">
        Pegá un mensaje que te llegó y fijate qué diría el guardián. No se manda nada por WhatsApp.
      </p>
      <form onSubmit={analizar} className="mt-3 flex flex-col gap-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="ej. Hola ma, cambié de número. Agendame este…"
          className="w-full rounded-md border border-linea bg-fondo px-3 py-2 text-base text-tinta placeholder:text-suave focus:border-tinta focus:outline-none"
        />
        <button
          type="submit"
          disabled={estado.tipo === "cargando" || !texto.trim()}
          className="h-11 cursor-pointer self-start rounded-md bg-tinta px-5 text-base font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {estado.tipo === "cargando" ? "Analizando…" : "Analizar"}
        </button>
      </form>
      {estado.tipo === "error" && <p className="mt-3 text-sm text-texto">{estado.mensaje}</p>}
      {estado.tipo === "listo" && (
        <div className="mt-4 rounded-md border border-linea bg-panel p-3">
          <p className="text-base font-semibold text-tinta">
            {estado.r.es_sospechoso ? labelModalidad(estado.r.modalidad) : "No parece una estafa"}
            <span
              className={`ml-2 rounded px-1.5 py-0.5 text-sm ${
                estado.r.riesgo >= 70
                  ? "bg-alerta text-white"
                  : estado.r.riesgo >= 40
                    ? "bg-orange-500 text-white"
                    : "bg-fondo text-tinta"
              }`}
            >
              Riesgo {estado.r.riesgo}
            </span>
          </p>
          {estado.r.senales?.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm text-texto">
              {estado.r.senales.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
