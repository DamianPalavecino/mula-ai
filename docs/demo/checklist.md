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

**Web** (https://mula-ai.vercel.app, en incógnito y desde otro celular con datos móviles, no el wifi del lugar; **no** la URL `mula-ai-damianpalavecinos-projects.vercel.app`, que pide login de Vercel):
- [ ] `/` (landing) carga sin login, y sin requests a Supabase ni al worker. — amigo
- [ ] `/entrar` loguea con la cuenta de familiar y con la de gobierno (Clerk). — amigo
- [ ] `/app` (familiar): muestra a "Abuela Marta" y sus alertas; `/admin` lo rebota. — amigo
- [ ] `/admin` (gobierno): grafo con `juli.martinez.mp`, feed de alertas y stats. — amigo
- [ ] Sin sesión, `/app` y `/admin` mandan a `/entrar`. — amigo

**Repo** (`github.com/DamianPalavecino/mula-ai`, sin sesión):
- [ ] Es público y abre en incógnito. — Damian
- [ ] Sin secretos en la historia. Tiene que salir vacío:
  ```bash
  rtk proxy git log -p --all | grep -iE "sk-ant|sk-or-|service_role\"?\s*[:=]|eyJhbGci" | grep -v "grep -iE"
  ```
  (`rtk proxy` porque el hook de rtk resume `git log -p` y el grep da vacío aunque haya algo; sin rtk, sacalo. El `grep -v` saca los docs que citan este mismo comando. Los nombres de variables no cuentan; lo que no puede aparecer es un valor). — Damian
- [ ] Sin sesión de WhatsApp ni `.env` trackeados. Los dos tienen que salir vacíos:
  ```bash
  git ls-files | grep -E "auth_info|(^|/)\.env($|\.)" | grep -v "\.env\.example$"
  git log --all --name-only --format= | grep -E "auth_info/" | sort -u
  ```
  — Damian
- [ ] README con la URL de la web y el link al video en lugar de `TODO_URL` y `TODO_VIDEO`. — Damian
- [ ] Las rutas de la sección Demo del README existen en Vercel (si `/app/me-estafaron` o `/app/verificar` no llegaron, sacarlas). — Damian

**Credenciales:** `/app` y `/admin` piden login. Las cuentas de demo (familiar y gobierno) van **en el formulario del submit**, nunca en el repo (es público). Si el jurado quiere probar el WhatsApp, se ofrece el número secundario de la demo, nunca uno personal.

## 15:45 — submit

- [ ] Formulario con los tres links: https://mula-ai.vercel.app, repo de GitHub, video de YouTube, y las dos cuentas de demo (familiar y gobierno). Abrir cada link desde el formulario antes de mandar. — Damian
- [ ] Submit hecho. Hora: ____ — Damian
- [ ] Worker y web quedan prendidos (el jurado puede probar después). — todos

## YouTube

Título:

```
Mula AI — guardián de WhatsApp contra estafas y cuentas mula (shippe.ar 2026)
```

Descripción:

```
Las estafas funcionan porque cada víctima está sola. Mula AI vigila el WhatsApp de una persona, reconoce el guion de estafa y la cuenta mula en el momento en que llegan, avisa a la persona y a su familia, y suma cada caso a una red compartida donde fiscalías y organismos ven la banda completa: la misma cuenta en muchas provincias.

Web: https://mula-ai.vercel.app
Código: https://github.com/DamianPalavecino/mula-ai

Los reportes previos de la red son sintéticos y están marcados como tales. La detección y las alertas del video son en vivo. El worker usa Baileys como prototipo; en producción el mismo motor va en una app Android y en APIs de riesgo para bancos y billeteras.

Hackatón shippe.ar · Track Social & Sector Público.
```
