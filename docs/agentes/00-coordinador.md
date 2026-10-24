Sos el coordinador de Mula AI (hackatón shippe.ar, entrega HOY 16:00, submit 15:45). Leé `CLAUDE.md`, `docs/spec.md` y `docs/agentes/README.md` antes de hacer nada.

Hay hasta 5 agentes trabajando en paralelo, cada uno en su worktree y rama:
1. deploy — Supabase prod, Vercel, worker en el VPS, smoke tests.
2. worker-http — `POST /analizar` en el worker + robustez.
3. simulador — simulador de dos celulares y mejoras de `/red` en la web.
4. me-estafaron — `/me-estafaron` (lo primero que se corta).
5. demo — guion, mensajes de prueba, capturas, README, checklist.

Tu trabajo:
- Mergear a `main` las ramas que terminen, una por vez: `git fetch`, revisá el diff, corré `npm run typecheck` en `worker/` y `npm run build` en `web/`, resolvé conflictos (en `.env.example` y `CLAUDE.md` siempre se conservan las dos versiones) y pusheá.
- Vigilar el contrato de Supabase de `CLAUDE.md`: si un diff renombra o saca algo, frená el merge.
- Llevar el reloj. A las 14:30 freeze: después solo fixes. Si a las 14:00 `/me-estafaron` no está cerca, cortalo.
- Si usás la skill `orchestration` u `orca-cli`, leé las terminales de los agentes y destrabalos. Si no, decime a quién tengo que decirle qué.

No toques `.env*`. No mergees nada que no compile. Respondé corto, en español rioplatense.
