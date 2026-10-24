"use client";

import { useCallback, useEffect, useState } from "react";
import { formatearTelefono } from "@/lib/setup";
import { seguirConsultando, textoEstado, type EstadoVinculo } from "@/lib/vincular";

interface Respuesta {
  estado: EstadoVinculo;
  telefono: string | null;
  qr_svg: string | null;
}

const POLL_MS = 2500;

const PASOS = [
  "Abrí WhatsApp en su teléfono.",
  "Entrá a Configuración → Dispositivos vinculados.",
  "Tocá “Vincular un dispositivo” y apuntá la cámara a este código.",
];

export default function VincularWhatsapp({ nombre }: { nombre: string }) {
  const [sesion, setSesion] = useState<Respuesta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  const pedir = useCallback(async (method: "GET" | "POST" | "DELETE") => {
    try {
      const res = await fetch("/app/api/whatsapp", { method, cache: "no-store" });
      const json = await res.json().catch(() => ({ error: "Respuesta inválida." }));
      if (!res.ok) throw new Error(json.error ?? "No pudimos contactar al guardián.");
      setSesion(json as Respuesta);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void pedir("GET");
  }, [pedir]);

  const estado = sesion?.estado;
  useEffect(() => {
    if (!estado || !seguirConsultando(estado)) return;
    const t = setInterval(() => void pedir("GET"), POLL_MS);
    return () => clearInterval(t);
  }, [estado, pedir]);

  const accion = async (method: "POST" | "DELETE") => {
    setOcupado(true);
    setConfirmar(false);
    await pedir(method);
    setOcupado(false);
  };

  const texto = textoEstado(estado ?? "inactiva", nombre);
  const boton =
    "inline-flex h-11 items-center justify-center rounded-md px-5 text-base font-medium disabled:opacity-60";

  return (
    <section className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_280px] sm:items-start">
      <div>
        <p
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
            estado === "conectado" ? "bg-seguro-fondo text-seguro" : "bg-panel text-suave"
          }`}
        >
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${estado === "conectado" ? "bg-seguro" : "bg-suave"}`}
          />
          {!sesion ? "Consultando…" : estado === "conectado" ? "WhatsApp vinculado" : "Sin vincular"}
        </p>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-tinta">{texto.titulo}</h2>
        <p className="mt-2 max-w-md text-base leading-relaxed text-texto">{texto.detalle}</p>

        {estado === "conectado" && sesion?.telefono && (
          <p className="mt-3 text-base text-tinta">
            Número vinculado: <strong>{formatearTelefono(sesion.telefono)}</strong>
          </p>
        )}

        {estado === "qr" && (
          <ol className="mt-5 flex max-w-md flex-col gap-3">
            {PASOS.map((p, i) => (
              <li key={p} className="flex gap-3 text-base text-texto">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tinta text-xs font-semibold text-white">
                  {i + 1}
                </span>
                {p}
              </li>
            ))}
          </ol>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {(estado === "inactiva" || (!sesion && error)) && (
            <button
              type="button"
              onClick={() => void accion("POST")}
              disabled={ocupado}
              className={`${boton} bg-tinta text-white hover:bg-black`}
            >
              {ocupado ? "Generando código…" : "Mostrar el código QR"}
            </button>
          )}
          {estado === "conectado" &&
            (confirmar ? (
              <>
                <span className="text-sm text-texto">¿Desvincular? Mula deja de cuidar sus mensajes.</span>
                <button
                  type="button"
                  onClick={() => void accion("DELETE")}
                  disabled={ocupado}
                  className={`${boton} bg-alerta text-white`}
                >
                  Sí, desvincular
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmar(false)}
                  className={`${boton} border border-linea text-tinta hover:bg-panel`}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmar(true)}
                className={`${boton} border border-linea text-tinta hover:bg-panel`}
              >
                Desvincular
              </button>
            ))}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-alerta">
            {error}
          </p>
        )}
      </div>

      <div
        aria-live="polite"
        className="flex aspect-square w-full max-w-[280px] items-center justify-center rounded-lg border border-linea bg-fondo p-4"
      >
        {estado === "qr" && sesion?.qr_svg ? (
          <div
            role="img"
            aria-label="Código QR para vincular WhatsApp"
            className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: sesion.qr_svg }}
          />
        ) : estado === "conectado" ? (
          <p className="text-center text-base font-medium text-seguro">✓ Protección activa</p>
        ) : (
          <p className="text-center text-sm text-suave">
            {estado === "desconectado" || ocupado ? "Preparando el código…" : "El código aparece acá."}
          </p>
        )}
      </div>
    </section>
  );
}
