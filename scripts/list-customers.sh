#!/usr/bin/env bash
# ============================================================
#  list-customers.sh — Show all running customer instances + status
#  Usage: ./scripts/list-customers.sh
# ============================================================
set -euo pipefail

CONFIG_FILE="${HOME}/.wf-config"
if [[ -f "$CONFIG_FILE" ]]; then
  source "$CONFIG_FILE"
fi

VPS_IP="${VPS_IP:-}"
VPS_USER="${VPS_USER:-root}"
[[ -z "$VPS_IP" ]] && { echo "VPS_IP not set in ~/.wf-config"; exit 1; }

DOMAIN_BASE="${DOMAIN_BASE:-wokeflow.net}"

echo "━━━ Wokeflow Instances on ${VPS_IP} ━━━"
echo

ssh -o StrictHostKeyChecking=accept-new "${VPS_USER}@${VPS_IP}" '
BOLD="\033[1m"; GREEN="\033[0;32m"; RED="\033[0;31m"; YELLOW="\033[1;33m"; NC="\033[0m"
printf "%-20s %-10s %-12s %-12s\n" "CUSTOMER" "WEB" "MYSQL" "IMAGE"
printf "%-20s %-10s %-12s %-12s\n" "────────────────────" "──────────" "────────────" "────────────"
for dir in /opt/wokeflow/wf-*/; do
  sub=$(basename "$dir" | sed "s/^wf-//")
  web_status=$(docker compose -f "${dir}docker-compose.yml" ps --format json 2>/dev/null | jq -r ".[] | select(.Service==\"web\") | .State" 2>/dev/null || echo "unknown")
  mysql_status=$(docker compose -f "${dir}docker-compose.yml" ps --format json 2>/dev/null | jq -r ".[] | select(.Service==\"mysql\") | .State" 2>/dev/null || echo "unknown")
  image_tag=$(docker compose -f "${dir}docker-compose.yml" images 2>/dev/null | grep "chatrium-ai" | awk "{print \$3}" | head -1 || echo "?")

  if [[ "$web_status" == "running" ]]; then
    web_disp="${GREEN}${web_status}${NC}"
  else
    web_disp="${RED}${web_status}${NC}"
  fi
  printf "%-20s %-20b %-12s %-12s\n" "$sub" "$web_disp" "$mysql_status" "$image_tag"
done
'

echo
# Show VPS memory overview
echo "── VPS Memory ──────────────────────────────────────────"
ssh -o StrictHostKeyChecking=accept-new "${VPS_USER}@${VPS_IP}" 'free -h | grep -E "^(Mem|Swap)"'
echo
echo "── Disk ────────────────────────────────────────────────"
ssh -o StrictHostKeyChecking=accept-new "${VPS_USER}@${VPS_IP}" 'df -h / | tail -1'
