"use client";

// Lugar del chat con IA en Inicio (contrato en docs/agentes/estado/chat.md). Cuando chat-ia
// pushee components/chat/Chat.tsx, se reemplaza este placeholder por <Chat {...props} />.
import { MessageCircleIcon, NetworkIcon, SearchIcon, SettingsIcon, SparklesIcon, TriangleAlertIcon, type LucideIcon } from "lucide-react";
import type { Tab } from "@/lib/panel";

const SUGERENCIAS: { texto: string; seccion: Exclude<Tab, "inicio">; Icono: LucideIcon; riesgo?: boolean }[] = [
  { texto: "Verificar una cuenta", seccion: "verificar", Icono: SearchIcon },
  { texto: "Probar un mensaje", seccion: "probar", Icono: MessageCircleIcon },
  { texto: "Más denunciados", seccion: "red", Icono: NetworkIcon },
  { texto: "Me estafaron", seccion: "me-estafaron", Icono: TriangleAlertIcon, riesgo: true },
  { texto: "Configurar", seccion: "ajustes", Icono: SettingsIcon },
];

export default function InicioChat({
  protegido,
  onIr,
}: {
  protegido: string | null;
  onIr: (seccion: Exclude<Tab, "inicio">) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-6 rounded-tarjeta border border-linea bg-fondo p-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-pastilla bg-seguro-fondo text-seguro">
        <SparklesIcon className="size-6" />
      </span>
      <p className="text-2xl font-bold tracking-tight text-tinta">
        {protegido ? `¿Qué hacemos por ${protegido}?` : "¿Qué querés hacer?"}
      </p>
      <ul className="flex max-w-xl flex-wrap justify-center gap-2">
        {SUGERENCIAS.map(({ texto, seccion, Icono, riesgo }) => (
          <li key={seccion}>
            <button
              type="button"
              onClick={() => onIr(seccion)}
              className={`presionable flex min-h-11 cursor-pointer items-center gap-2 rounded-pastilla border px-4 text-sm font-semibold ${
                riesgo
                  ? "border-alerta-linea bg-alerta-fondo text-alerta"
                  : "border-seguro-linea bg-seguro-fondo text-bosque"
              }`}
            >
              <Icono className="size-4" />
              {texto}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
