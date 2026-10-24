#!/usr/bin/env bash
# Worker en el VPS (Contabo, por Tailscale; alias ssh `contabo-vps`). Servicio systemd de usuario `mula-worker`.
#   worker/scripts/vps.sh qr       abre en el navegador el último QR (vence en ~20s; re-correr si venció)
#   worker/scripts/vps.sh logs     últimas 60 líneas (sin el QR en ASCII)
#   worker/scripts/vps.sh deploy   git pull + npm ci + restart
#   worker/scripts/vps.sh restart | status
#   worker/scripts/vps.sh set KEY VALOR   agrega/reemplaza una variable no secreta y reinicia (ej. ANALIZAR_SOLO, FAMILY_GROUP_JID)
#   worker/scripts/vps.sh vars            nombres de las variables cargadas (sin valores)
# Variables: ~/.config/mula-ai/worker.conf en el VPS (secretos: cargados una vez desde el archivo de entorno raíz; no secretos: `vps.sh set`).
# Sesión de WhatsApp: ~/mula-data/auth_info en el VPS (fuera del repo, sobrevive deploys).
set -euo pipefail
HOST=contabo-vps
REPO='~/Spaces/personal/mula-ai'
CONF='~/.config/mula-ai/worker.conf'
LOGS="journalctl --user -u mula-worker --no-pager -o cat"

case "${1:-status}" in
  qr)
    url=$(ssh "$HOST" "$LOGS -n 300 | grep -o 'https://api.qrserver[^ ]*' | tail -1")
    if [ -z "$url" ]; then echo "No hay QR en los logs (¿ya está conectado?)."; exit 1; fi
    open "$url" && echo "QR abierto. Si venció, volvé a correr: worker/scripts/vps.sh qr" ;;
  logs) ssh "$HOST" "$LOGS -n 60 | grep -v '^[█▀▄ ]*$' | cut -c1-300" ;;
  deploy) ssh "$HOST" "cd $REPO && git pull -q --ff-only && git log --oneline -1 && cd worker && npm ci --no-audit --no-fund --silent && systemctl --user restart mula-worker && echo reiniciado" ;;
  restart) ssh "$HOST" "systemctl --user restart mula-worker && echo reiniciado" ;;
  status) ssh "$HOST" "systemctl --user status mula-worker --no-pager | head -5" ;;
  set)
    k="${2:?falta KEY}"; v="${3?falta VALOR}"
    [[ "$k" =~ ^[A-Z_][A-Z0-9_]*$ ]] || { echo "KEY inválida: $k"; exit 1; }
    printf '%s="%s"\n' "$k" "$v" | ssh "$HOST" "sed -i '/^$k=/d' $CONF && cat >> $CONF && systemctl --user restart mula-worker && echo '$k cargada, reiniciado'" ;;
  vars) ssh "$HOST" "cut -d= -f1 $CONF" ;;
  *) echo "uso: $0 qr|logs|deploy|restart|status|set|vars"; exit 1 ;;
esac
