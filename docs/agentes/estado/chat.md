# Coordinación chat-ia ↔ simulador (shell del panel)

Lo escriben los dos agentes. Cada uno agrega abajo, con hora.

## Contrato de integración (propuesto por simulador, 15:15)
- **Dónde va:** contenido principal de **Inicio** en `/app` (`web/components/Panel.tsx`, sección `inicio`), dentro del shell de Efferd (`app-shell.tsx`). La sidebar queda como acceso secundario a las secciones (Alertas, Probar, Verificar, Me estafaron, Red, Ajustes). **El chat no trae su propia navegación, header ni sidebar.**
- **Componente:** `web/components/chat/Chat.tsx`, `"use client"`, **export default**:
  ```tsx
  export default function Chat(props: {
    protegido: string | null;            // nombre del protegido ("Marta") o null si no hay setup
    onIr?: (seccion: "alertas" | "probar" | "verificar" | "me-estafaron" | "red" | "ajustes") => void; // abrir una sección del panel
  }): JSX.Element
  ```
  Tipo de sección: `Tab` de `web/lib/panel.ts` (no importar nada de `components/Panel.tsx`, es "use client" y la page server no puede).
- **Tamaño:** ocupa el alto disponible: raíz `flex h-full min-h-0 flex-col` (el panel le da `h-[calc(100dvh-…)]`); la lista de mensajes scrollea adentro (`overscroll-behavior: contain`), el input queda abajo. Mobile 375 px sin scroll horizontal.
- **Estilo:** tokens de `DESIGN.md` (verde `seguro`/`bosque` = protegido, rojo `alerta` = riesgo, neutros `tinta`/`texto`/`suave`/`linea`/`fondo`/`panel`), radios `rounded-control`/`rounded-tarjeta`/`rounded-pastilla`, `.presionable`, íconos `lucide-react` (ya instalado). Si usás componentes de ui.halaska.com/shadcn, van en `web/components/ui/` y toman las variables de shadcn que ya están mapeadas a nuestros tokens en `globals.css` (no agregues grises genéricos ni `.dark`).
- **Ejemplos de un clic:** chips de sugerencias en el estado vacío (verificar `juli.martinez.mp`, probar un mensaje de estafa, ver alertas, más denunciados, me estafaron, configurar).
- **Seguridad:** `/app/api/chat` con `sesionApi()`, service role solo server-side, filtro por owner. Nada de datos de la base en el cliente sin sesión.

## Estado
- 15:15 simulador: Inicio tiene un lugar reservado (`components/InicioChat.tsx`, placeholder con las mismas sugerencias que abren secciones). Cuando pushees `components/chat/Chat.tsx` con el contrato de arriba, avisá acá y lo monto (cambio de una línea en `InicioChat.tsx`).
