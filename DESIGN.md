# DESIGN.md — sistema de diseño de Mula AI

Fuente de verdad del diseño. Partió del prototipo de Damian (`docs/design/tokens.css`) y se adaptó a la web real (`web/`). El bloque `tokens` de abajo y el `@theme` de `web/app/globals.css` tienen que ser **idénticos** (mismos nombres y valores): `web/lib/tokens.test.ts` falla si se desincronizan y corre en `npm run check web`. Para cambiar un token, cambialo en los dos lados.

Referencias: prototipo `docs/design/`, skills de Emil Kowalski (animación) y de Jakub Krehel (better-ui, better-layout, better-colors).

## Principios
- **Una acción principal por pantalla**, con el único relleno de color fuerte. El resto, neutro.
- **Color con un solo significado**: verde = protegido / seguro, rojo = riesgo / peligro, neutro = información. Nunca solo color: siempre ícono + texto.
- **Menos texto**: títulos cortos, íconos y números grandes en lugar de párrafos.
- **Ejemplos de un clic** en todo lo que pide un dato (chips que completan y ejecutan la acción).
- **Estados completos**: vacío, cargando, error y listo en cada bloque que trae datos.
- **Accesible**: contraste AA, foco visible, objetivos táctiles ≥ 44 px, `prefers-reduced-motion`.

## Tokens

```css tokens
--color-tinta: #111418;
--color-texto: #3d434b;
--color-suave: #6b7280;
--color-linea: #e3e5e8;
--color-fondo: #ffffff;
--color-panel: #f6f7f8;
--color-alerta: #c1121f;
--color-alerta-fondo: #fdf0f1;
--color-alerta-linea: #f3c4c8;
--color-riesgo-1: #8fbf9a;
--color-riesgo-2: #f0b429;
--color-riesgo-3: #f07a1a;
--color-riesgo-4: #d9381e;
--color-riesgo-5: #9e0f1d;
--color-seguro: #187647;
--color-seguro-fondo: #e6f3e8;
--color-seguro-linea: #b9dcc1;
--color-bosque: #164d32;
--color-bosque-tinta: #f0f7e7;
--color-lima: #d9ed87;
--color-papel: #fbfcf8;
--ease-salida: cubic-bezier(0.23, 1, 0.32, 1);
--radius-control: 12px;
--radius-tarjeta: 20px;
--radius-pastilla: 9999px;
--shadow-flotante: 0 12px 32px rgb(23 59 40 / 0.12);
--color-wa-barra: #075e54;
--color-wa-fondo: #efeae2;
--color-wa-propio: #d9fdd3;
--color-wa-composer: #f0f2f5;
--font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
--font-mono: var(--font-geist-mono), ui-monospace, monospace;
--animate-entrada: entrada 280ms cubic-bezier(0.23, 1, 0.32, 1);
```

### Color: semántica
| Rol | Tokens | Uso |
|---|---|---|
| Neutro | `tinta` (títulos), `texto` (cuerpo), `suave` (secundario), `linea` (bordes), `fondo`, `panel`, `papel` | Información, superficies |
| Protegido / seguro | `seguro`, `seguro-fondo`, `seguro-linea`; `bosque` + `bosque-tinta` (banda y botón principal); `lima` (acento: estado "Protegida", números destacados sobre `bosque`) | Todo lo que dice "está bien" o "estás cuidado" |
| Riesgo | `alerta`, `alerta-fondo`, `alerta-linea` | Estafa detectada, cuenta con reportes, errores de validación |
| Escala de riesgo | `riesgo-1` verde suave → `riesgo-2` ámbar → `riesgo-3` naranja → `riesgo-4` rojo anaranjado → `riesgo-5` rojo intenso | Grafo de la red: color de nodos, líneas y leyenda según reportes (1, 3, 6, 10, 20+), interpolado en OKLab (`web/lib/riesgo.ts`). Nunca como color de texto: el texto va en `tinta` o `alerta` |
| WhatsApp | `wa-barra`, `wa-fondo`, `wa-propio`, `wa-composer` | Solo para conversaciones que imitan WhatsApp |

Contraste medido (AA texto normal ≥ 4.5): `alerta` sobre `fondo` 5.9, `seguro` sobre `seguro-fondo` 5.0, `suave` sobre `papel` 4.6, `bosque-tinta` sobre `bosque` 9.9, `tinta` sobre `lima` 14.

### Tipografía
- Familia: `--font-sans` (Geist) para todo; `--font-mono` (Geist Mono) para valores (alias, CBU, teléfonos).
- Escala (Tailwind): display `text-5xl`/`text-4xl` bold tracking-tight (título del panel); número grande `text-6xl`–`text-7xl` extrabold `tabular-nums` (reportes, riesgo); título de bloque `text-lg`/`text-xl` semibold; cuerpo `text-base`; secundario `text-sm`; etiqueta `text-xs` semibold.

### Espaciado y layout
- Escala de Tailwind (4 px). Dentro de un grupo `gap-2`/`gap-3`; entre grupos el doble (`gap-6`). Contenedor `max-w-6xl`, gutter `px-4` (mobile) / `px-6`.
- Grids con `minmax(0,1fr)`; nada de anchos fijos en texto.

### Radios y sombras
- `rounded-control` (12 px): inputs y botones chicos. `rounded-tarjeta` (20 px): cards y paneles. `rounded-pastilla`: chips y badges.
- `shadow-flotante`: solo elementos que flotan (resultado destacado, toasts, drawers).

### Motion
- Solo `transform` y `opacity`. Entradas con `--animate-entrada` (280 ms, `--ease-salida`). Presionar: clase `.presionable` (`scale(0.96)`, 150 ms).
- Cambiar de pestaña es instantáneo (se usa decenas de veces). Nada de `transition: all`. Con `prefers-reduced-motion: reduce` se apagan las entradas y el scale.

### Íconos
- `web/components/iconos.tsx`: SVG inline, trazo 2, `currentColor`, 24×24. Tamaños `h-4` (en chips), `h-5` (botones, pestañas), `h-6`–`h-10` (estados).

## shadcn / Efferd
- El panel usa el app shell **Efferd app-shell-4** (sidebar flotante colapsable a íconos, contenido inset; en mobile la sidebar es un drawer) sobre componentes de shadcn (`web/components/ui/*`, `components.json` con el registry `@efferd`).
- Las variables semánticas de shadcn (`--background`, `--primary`, `--sidebar-*`, `--destructive`, …) viven en `:root` de `globals.css` y **apuntan a los tokens de arriba** (primario = `bosque`, acento = `seguro-fondo`, destructive = `alerta`, bordes = `linea`). No hay grises genéricos de shadcn ni modo oscuro.

## Componentes

| Componente | Archivo | Variantes / estados |
|---|---|---|
| Botón principal | clase `bg-bosque text-bosque-tinta rounded-2xl h-14 presionable` | normal, deshabilitado (`opacity-40`), cargando (`IconoGiro`) |
| Chip de ejemplo | `VerificarPanel`, `AppProbarMensaje` | riesgo (rojo), seguro (verde) |
| Input con validación | `VerificarPanel` (`lib/verificar.ts`) | vacío (sin mensaje), válido (badge del tipo), inválido (borde `alerta` + error inline) |
| Resultado de cuenta | `ResumenCard` | con reportes (rojo, número gigante, chips de provincias/modalidades), sin reportes (verde), `compacto` |
| Alerta | `AppAlertas`, `AdminFeed` | nueva (resaltada), normal; badge de riesgo |
| App shell | `app-shell.tsx`, `app-sidebar.tsx` | sección activa (`seguro-fondo`), "Me estafaron" en `alerta`, badge de alertas (`alerta`), protegido con estado; colapsada a íconos; drawer en mobile (ítems de 44 px) |
| Stat | `Panel` (`Stat`) | neutro (ícono `seguro`), alerta (ícono `alerta`) |
| Conversación WhatsApp | `AppProbarMensaje` | vacío, analizando, resultado riesgo / sin señales, error |
| Grafo | `Graph`, `AdminRed`, `colores.ts` | nodo por tipo, destacado (pulso), seleccionado |
| Navbar pública | `PublicNav`, `PublicNav.css` | marca, enlaces a secciones, entrar/registro; menú mobile con cierre por enlace o Escape |
| Landing pública | `LandingDemo`, `LandingChat`, `Landing.css` | hero lima, tres guiones precalculados, aviso a persona/familia, conversación normal sin alerta; estilos locales |

Todos los componentes y tokens se ven juntos en **`/styleguide`** (fuera de la navegación, sin datos reales).
