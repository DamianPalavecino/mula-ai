"use client";

import { useEffect, useRef, useState } from "react";
import { BellIcon } from "lucide-react";
import type { Alerta } from "@/lib/tipos";
import { marcarVistas, noVistas } from "@/lib/alertasVistas";
import AppAlertas from "@/components/AppAlertas";

const CLAVE = "mula:alertas-vistas";

function leerVisto(): number {
  try {
    return Number(localStorage.getItem(CLAVE)) || 0;
  } catch {
    return 0;
  }
}

// Campana del top bar: badge rojo con las no vistas y panel con las alertas en vivo.
// AppAlertas queda montado siempre (su polling autenticado sigue con el panel cerrado).
export default function AlertasCampana({ iniciales, nombre }: { iniciales: Alerta[]; nombre: string | null }) {
  const [abierto, setAbierto] = useState(false);
  const [alertas, setAlertas] = useState<Alerta[]>(iniciales);
  const [visto, setVisto] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const pendientes = noVistas(alertas, visto);

  useEffect(() => setVisto(leerVisto()), []);

  // Abierto = vistas.
  useEffect(() => {
    if (!abierto) return;
    const nuevo = marcarVistas(alertas, visto);
    if (nuevo !== visto) {
      setVisto(nuevo);
      try {
        localStorage.setItem(CLAVE, String(nuevo));
      } catch {}
    }
  }, [abierto, alertas, visto]);

  // Cerrar con Esc o clic afuera.
  useEffect(() => {
    if (!abierto) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    const clic = (e: PointerEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("keydown", tecla);
    document.addEventListener("pointerdown", clic);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.removeEventListener("pointerdown", clic);
    };
  }, [abierto]);

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        aria-label={pendientes ? `Alertas: ${pendientes} sin ver` : "Alertas"}
        aria-expanded={abierto}
        onClick={() => setAbierto((x) => !x)}
        className={`presionable relative flex size-11 cursor-pointer items-center justify-center rounded-control md:size-9 ${
          abierto ? "bg-seguro-fondo text-bosque" : "text-texto hover:bg-panel"
        }`}
      >
        <BellIcon className="size-5" />
        {pendientes > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-pastilla bg-alerta px-1 text-xs font-bold tabular-nums text-white ring-2 ring-papel">
            {pendientes > 9 ? "9+" : pendientes}
          </span>
        )}
      </button>

      <div
        hidden={!abierto}
        role="dialog"
        aria-label="Alertas en vivo"
        className="fixed inset-x-3 top-16 z-50 max-h-[75dvh] animate-entrada overflow-y-auto overscroll-contain rounded-tarjeta shadow-flotante md:absolute md:inset-x-auto md:top-11 md:right-0 md:w-[420px]"
      >
        {nombre ? (
          <AppAlertas iniciales={iniciales} nombre={nombre} onCambio={setAlertas} />
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-tarjeta border border-linea bg-fondo p-8 text-center">
            <BellIcon className="size-8 text-seguro" />
            <p className="font-semibold text-tinta">Cargá a quién cuidás para recibir alertas</p>
          </div>
        )}
      </div>
    </div>
  );
}
