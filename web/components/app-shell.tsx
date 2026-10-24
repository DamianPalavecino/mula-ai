"use client";

// Adaptado de Efferd app-shell-4: sidebar flotante + contenido inset con barra (trigger + título).
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { UserButton } from "@clerk/nextjs";
import type { Alerta } from "@/lib/tipos";
import { AppSidebar, SECCIONES, type Seccion } from "@/components/app-sidebar";
import AlertasCampana from "@/components/AlertasCampana";

export function AppShell({
  activa,
  onIr,
  protegido,
  alertas,
  conUsuario,
  children,
}: {
  activa: Seccion;
  onIr: (s: Seccion) => void;
  protegido: { nombre: string; ubicacion: string } | null;
  alertas: Alerta[];
  conUsuario: boolean;
  children: React.ReactNode;
}) {
  const titulo = SECCIONES.find((s) => s.id === activa)?.titulo ?? "Asistente";
  return (
    <SidebarProvider>
      {/* El panel trae su propia navegación: el header global sobra mientras está montado. */}
      <style>{"[data-header-global]{display:none}"}</style>
      <AppSidebar activa={activa} onIr={onIr} protegido={protegido} />
      <SidebarInset className="min-w-0 bg-papel p-4 md:p-6">
        <header className="mb-5 flex items-center gap-3">
          <SidebarTrigger className="size-11 md:size-8" />
          <Separator orientation="vertical" className="h-4 data-[orientation=vertical]:self-center" />
          <h1 className="min-w-0 flex-1 truncate text-xl font-bold tracking-tight text-tinta">{titulo}</h1>
          {/* Arriba a la derecha: alertas en vivo + perfil. */}
          <AlertasCampana iniciales={alertas} nombre={protegido?.nombre ?? null} />
          {conUsuario && <UserButton />}
        </header>
        <div className="flex min-w-0 flex-1 flex-col gap-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
