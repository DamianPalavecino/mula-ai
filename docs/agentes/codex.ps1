# Relanza los 5 agentes con Codex en sus mismos worktrees (conserva el trabajo sin commitear).
#   pwsh docs/agentes/codex.ps1                  → los 5
#   pwsh docs/agentes/codex.ps1 simulador demo   → solo esos
$repo = '93434532-72b0-464c-a48c-b83211d7840b'
$briefs = @{ 'deploy' = '01-deploy'; 'worker-http' = '02-worker-http'; 'simulador' = '03-web-simulador'; 'me-estafaron' = '04-web-me-estafaron'; 'demo' = '05-demo' }
$names = if ($args.Count) { $args } else { $briefs.Keys }
$main = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

foreach ($n in $names) {
  $brief = Get-Content -Raw "$main\docs\agentes\$($briefs[$n]).md"
  $prompt = @"
Retomás el trabajo de otro agente que se cortó. Antes de nada:
1. git pull --rebase origin main
2. Leé CLAUDE.md (reglas + contrato; AGENTS.md apunta ahí), PROGRESS.md (sección Traspaso) y docs/agentes/estado/$n.md (dónde quedó tu área).
3. Mirá git status: puede haber trabajo sin commitear del agente anterior en este worktree; seguilo, no lo tires.
Después de cada paso actualizá docs/agentes/estado/$n.md (Hecho / En curso / Próximo paso / Bloqueos), corré npm run check y pusheá a main (git pull --rebase origin main && git push origin HEAD:main).

Brief original de tu área:

$brief
"@
  $r = orca agent launch --agent codex --worktree "id:${repo}::C:/Users/dami_/orca/workspaces/mula-ai/$n" --prompt $prompt --json | ConvertFrom-Json
  '{0}: ok={1} {2} {3}' -f $n, $r.ok, $r.result.outcome.kind, $r.error.message
}
