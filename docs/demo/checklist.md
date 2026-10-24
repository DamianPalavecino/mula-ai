# Checklist de entrega

**Submit 15:45, no 15:59.** Una sola entrega, irreversible. Marcá `[x]` con hora y quién. Los ítems de prueba también están en `PROGRESS.md`.

## 14:30 — freeze

- [ ] Nada nuevo en `main` salvo arreglos de la demo. — todos
- [ ] Worker en el VPS conectado (`[wa] conectado como ...` en `worker/scripts/vps.sh logs`) y web en Vercel con el último `main`. — Damian

## 14:30–15:00 — ensayo y grabación

- [ ] `npm run reset-demo` → `juli.martinez.mp: 23 reportes · 5 provincias`. — Damian
- [ ] Toma de respaldo completa grabada y subida a YouTube como "no listada" ([`guion.md`](guion.md#toma-de-respaldo)). — Damian
- [ ] `npm run reset-demo` otra vez y toma buena. — Damian

## 15:00–15:30 — edición y subida

- [ ] Video editado, **≤ 2:00** con la historia completa, subtítulos, sin pantallas de configuración, código ni logs. — Damian
- [ ] Subido a YouTube como **Público**, con el título y la descripción de abajo. — Damian
- [ ] El link abre en una ventana de incógnito, sin sesión de Google. — Damian

## 15:30–15:45 — verificación final

**Web** (en incógnito y desde otro celular con datos móviles, no el wifi del lugar):
- [ ] `/` carga. — amigo
- [ ] `/verificar` con `juli.martinez.mp` da rojo con reportes; con `maria.gomez.gym` da "sin reportes". — amigo
- [ ] `/red` muestra el grafo y el feed de alertas. — amigo
- [ ] `/simulador` manda el mensaje 1 y muestra la alerta. — amigo

**Repo** (`github.com/damianpalavecino/mula-ai`, sin sesión):
- [ ] Es público y abre en incógnito. — Damian
- [ ] Sin secretos en la historia. Tiene que salir vacío:
  ```bash
  git log -p --all | grep -iE "sk-ant|sk-or-|service_role\"?\s*[:=]|eyJhbGci"
  ```
  (los nombres de variables en `.env.example` y los docs no cuentan; lo que no puede aparecer es un valor). — Damian
- [ ] Sin sesión de WhatsApp ni `.env` trackeados. Los dos tienen que salir vacíos:
  ```bash
  git ls-files | grep -E "auth_info|(^|/)\.env($|\.)" | grep -v "\.env\.example$"
  git log --all --name-only --format= | grep -E "auth_info/" | sort -u
  ```
  — Damian
- [ ] README con la URL de la web y el link al video en lugar de `TODO_URL` y `TODO_VIDEO`. — Damian
- [ ] Si `/simulador` o `/me-estafaron` se cortaron, sacarlos de la sección Demo del README. — Damian

**Credenciales:** la web es pública y sin login, no hacen falta. Si el jurado quiere probar el WhatsApp, se ofrece el número secundario de la demo, nunca uno personal.

## 15:45 — submit

- [ ] Formulario con los tres links: URL HTTPS de Vercel, repo de GitHub, video de YouTube. Abrir cada uno desde el formulario antes de mandar. — Damian
- [ ] Submit hecho. Hora: ____ — Damian
- [ ] Worker y web quedan prendidos (el jurado puede probar después). — todos

## YouTube

Título:

```
Mula AI — guardián de WhatsApp contra estafas y cuentas mula (shippe.ar 2026)
```

Descripción:

```
Las estafas funcionan porque cada víctima está sola. Mula AI vigila el WhatsApp de una persona, reconoce el guion de estafa y la cuenta mula en el momento en que llegan, avisa a la persona y a su familia, y suma cada caso a una red compartida que cualquiera puede consultar antes de pagar.

Web: TODO_URL
Código: https://github.com/damianpalavecino/mula-ai

Los reportes previos de la red son sintéticos y están marcados como tales. La detección y las alertas del video son en vivo. El worker usa Baileys como prototipo; en producción el mismo motor va en una app Android y en APIs de riesgo para bancos y billeteras.

Hackatón shippe.ar · Track Social & Sector Público.
```
