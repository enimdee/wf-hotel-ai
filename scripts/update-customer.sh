#!/usr/bin/env bash
# ============================================================
#  update-customer.sh — Pull latest image & restart a customer
#  Usage: ./scripts/update-customer.sh <subdomain>
#  Example: ./scripts/update-customer.sh rawai
#           ./scripts/update-customer.sh all        # updates everyone
# ============================================================
set -euo pipefail

CONFIG_FILE="${HOME}/.wf-config"
if [[ -f "$CONFIG_FILE" ]]; then
  source "$CONFIG_FILE"
fi

CYAN='\033[0;36m'; GREEN='\033[0;32m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${CYAN}▸${NC} $*"; }
success() { echo -e "${GREEN}✔${NC} $*"; }

TARGET="${1:-}"
[[ -z "$TARGET" ]] && { echo "Usage: $0 <subdomain|all>"; exit 1; }

VPS_IP="${VPS_IP:-}"
VPS_USER="${VPS_USER:-root}"
[[ -z "$VPS_IP" ]] && { echo "VPS_IP not set in ~/.wf-config"; exit 1; }

vps() { ssh -o StrictHostKeyChecking=accept-new "${VPS_USER}@${VPS_IP}" "$@"; }

update_one() {
  local sub="$1"
  local dir="/opt/wokeflow/wf-${sub}"
  info "Updating ${sub}…"
  vps "cd ${dir} && docker compose pull && docker compose up -d --remove-orphans"
  success "${sub} updated"
}

if [[ "$TARGET" == "all" ]]; then
  echo -e "${BOLD}Updating all customers…${NC}"
  # List all wf-* dirs on VPS
  DIRS=$(vps "ls /opt/wokeflow/" 2>/dev/null | grep "^wf-" || true)
  for d in $DIRS; do
    update_one "${d#wf-}"
  done
else
  update_one "$TARGET"
fi

success "Done!"
