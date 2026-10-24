"use client";

// Adaptado de Efferd app-shell-4 (sidebar flotante, colapsable a íconos; drawer en mobile).
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  BellIcon,
  HouseIcon,
  MessageCircleIcon,
  NetworkIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Tab } from "@/lib/panel";

export const SECCIONES: { id: Tab; titulo: string; Icono: LucideIcon }[] = [
  { id: "inicio", titulo: "Inicio", Icono: HouseIcon },
  { id: "alertas", titulo: "Alertas", Icono: BellIcon },
  { id: "probar", titulo: "Probar", Icono: MessageCircleIcon },
  { id: "verificar", titulo: "Verificar", Icono: SearchIcon },
  { id: "me-estafaron", titulo: "Me estafaron", Icono: TriangleAlertIcon },
  { id: "red", titulo: "Red", Icono: NetworkIcon },
  { id: "ajustes", titulo: "Ajustes", Icono: SettingsIcon },
];
export type Seccion = Tab;

export function AppSidebar({
  activa,
  onIr,
  protegido,
  alertas,
  conUsuario,
}: {
  activa: Seccion;
  onIr: (s: Seccion) => void;
  protegido: { nombre: string; ubicacion: string } | null;
  alertas: number;
  conUsuario: boolean;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const ir = (s: Seccion) => {
    onIr(s);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader className="gap-3">
        <SidebarMenuButton asChild size="lg" className="hover:bg-transparent">
          <Link href="/app">
            <ShieldCheckIcon className="text-seguro" />
            <span className="text-base font-bold tracking-tight text-bosque">Mula AI</span>
          </Link>
        </SidebarMenuButton>
        {/* El protegido: encabezado chico con estado */}
        <SidebarMenuButton
          size="lg"
          onClick={() => ir("ajustes")}
          tooltip={protegido ? `Cuidás a ${protegido.nombre}` : "Cargá a quién cuidás"}
          className="bg-seguro-fondo hover:bg-seguro-fondo/80"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bosque text-sm font-bold text-bosque-tinta">
            {protegido ? protegido.nombre.charAt(0).toUpperCase() : "+"}
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-semibold text-bosque">
              {protegido ? protegido.nombre : "Cargá a quién cuidás"}
            </span>
            {protegido && (
              <span className="flex items-center gap-1 truncate text-xs text-seguro">
                <span className="size-1.5 rounded-full bg-seguro" aria-hidden /> protegida
              </span>
            )}
          </span>
        </SidebarMenuButton>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Panel</SidebarGroupLabel>
          <SidebarMenu>
            {SECCIONES.map(({ id, titulo, Icono }) => (
              <SidebarMenuItem key={id}>
                <SidebarMenuButton
                  isActive={activa === id}
                  tooltip={titulo}
                  onClick={() => ir(id)}
                  className={
                    id === "me-estafaron"
                      ? "max-md:h-11 text-alerta hover:bg-alerta-fondo hover:text-alerta data-[active=true]:bg-alerta-fondo data-[active=true]:text-alerta"
                      : "max-md:h-11 data-[active=true]:font-semibold"
                  }
                >
                  <Icono />
                  <span>{titulo}</span>
                </SidebarMenuButton>
                {id === "inicio" && alertas > 0 && (
                  <SidebarMenuBadge className="rounded-full bg-alerta text-white peer-hover/menu-button:text-white">
                    {alertas}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm" tooltip="Vincular WhatsApp" className="text-muted-foreground">
              <Link href="/app/vincular">
                <SmartphoneIcon />
                <span>Vincular WhatsApp</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {conUsuario && (
            <SidebarMenuItem className="flex items-center px-1.5 py-1">
              <UserButton />
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
