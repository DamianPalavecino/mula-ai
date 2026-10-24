"use client";

// Lugar del chat con IA en Inicio (contrato en docs/agentes/estado/chat.md).
import Chat from "@/components/chat/Chat";
import type { Tab } from "@/lib/panel";

export default function InicioChat({
  protegido,
  onIr,
}: {
  protegido: string | null;
  onIr: (seccion: Exclude<Tab, "inicio">) => void;
}) {
  return <Chat protegido={protegido} onIr={onIr} />;
}
