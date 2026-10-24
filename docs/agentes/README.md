# Agentes en paralelo — Mula AI (entrega hoy 16:00, submit 15:45)

Cada archivo `0X-*.md` es un prompt **autocontenido**: se pega entero en un chat nuevo o se pasa a `orca worktree create --prompt`. Cada agente trabaja en su worktree/rama y toca solo sus archivos.

| # | Agente | Toca | Prioridad | Dónde |
|---|---|---|---|---|
| 1 | Deploy e integración | nada de código (guía + smoke tests) | crítica | local (necesita tus credenciales y el navegador) |
| 2 | Worker: endpoint HTTP + robustez | `worker/` | crítica | local o VPS |
| 3 | Web: simulador + `/red` | `web/` (menos `/me-estafaron`) | alta | local |
| 4 | Web: `/me-estafaron` | `web/app/me-estafaron/`, `web/app/api/extraer/` | baja (lo primero que se corta) | local o VPS |
| 5 | Demo y entrega | `docs/demo/`, `README.md` | alta | local |

El coordinador sos vos, o este chat con `00-coordinador.md`.

## Dependencias
- **2 → 3**: el simulador consume `POST /analizar` del worker. El contrato está escrito igual en los dos prompts, así 3 arranca con un mock y después apunta a la URL real.
- **1 → todos**: hasta que Supabase prod, Vercel y el worker en el VPS estén arriba, cada uno prueba en local.
- **5** necesita a 2 y 3 andando para grabar, pero arranca ya con guion, mensajes y capturas.

## Lanzar con Orca (PowerShell, desde la raíz del repo)
```powershell
$repo = "id:93434532-72b0-464c-a48c-b83211d7840b"
orca worktree create --repo $repo --name deploy      --agent claude --prompt (Get-Content -Raw docs\agentes\01-deploy.md) --json
orca worktree create --repo $repo --name worker-http --agent claude --prompt (Get-Content -Raw docs\agentes\02-worker-http.md) --json
orca worktree create --repo $repo --name simulador   --agent claude --prompt (Get-Content -Raw docs\agentes\03-web-simulador.md) --json
orca worktree create --repo $repo --name me-estafaron --agent claude --prompt (Get-Content -Raw docs\agentes\04-web-me-estafaron.md) --json
orca worktree create --repo $repo --name demo        --agent claude --prompt (Get-Content -Raw docs\agentes\05-demo.md) --json
```
Sin Orca: abrí un chat de Claude Code por agente (idealmente cada uno en su worktree: `git worktree add ../mula-<nombre> -b <nombre>`) y pegá el archivo.

## Reglas de merge
- Cada agente pushea su rama y avisa. El coordinador mergea a `main` después de `npm run typecheck` (worker) o `npm run build` (web).
- `main` es lo que deploya Vercel. Nada roto en `main` después de las 14:30.
- `.env.example` y `CLAUDE.md`: solo **agregar** líneas, nunca renombrar ni sacar.

## Horarios
- **13:15** — `POST /analizar` andando en local; simulador contra mock.
- **13:45** — Supabase prod sembrado, web en Vercel, worker en el VPS.
- **14:30** — recorrido completo (WhatsApp real + simulador + `/verificar` + `/red`). Freeze de features.
- **14:30–15:30** — grabar video. **15:45** submit.
