// Pestañas del panel /app. Vive fuera de components/Panel.tsx ("use client") porque la page server las usa.
export const TABS = ["inicio", "alertas", "probar", "verificar", "me-estafaron", "red", "ajustes"] as const;
export type Tab = (typeof TABS)[number];

export function tabInicial(pedida: string | undefined): Tab {
  return (TABS as readonly string[]).includes(pedida ?? "") ? (pedida as Tab) : "inicio";
}
