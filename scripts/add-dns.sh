#!/usr/bin/env bash
# ============================================================
#  add-dns.sh — Add/update Hostinger DNS A record for a subdomain
#  Usage: ./scripts/add-dns.sh <subdomain> [ip]
#  Example: ./scripts/add-dns.sh rawai
#           ./scripts/add-dns.sh rawai 85.190.246.180
#
#  Requires: HOSTINGER_API_TOKEN in env or ~/.wf-config
# ============================================================
set -euo pipefail

CONFIG_FILE="${HOME}/.wf-config"
if [[ -f "$CONFIG_FILE" ]]; then
  source "$CONFIG_FILE"
fi

SUBDOMAIN="${1:-}"
[[ -z "$SUBDOMAIN" ]] && { echo "Usage: $0 <subdomain> [ip]"; exit 1; }

VPS_IP="${2:-${VPS_IP:-}}"
[[ -z "$VPS_IP" ]] && { echo "VPS_IP not set. Pass as arg 2 or set in ~/.wf-config"; exit 1; }

DOMAIN_BASE="${DOMAIN_BASE:-wokeflow.net}"
HOSTINGER_API_TOKEN="${HOSTINGER_API_TOKEN:-}"
[[ -z "$HOSTINGER_API_TOKEN" ]] && { echo "HOSTINGER_API_TOKEN not set"; exit 1; }

echo "Adding DNS: ${SUBDOMAIN}.${DOMAIN_BASE} → ${VPS_IP}"

curl -sf -X POST \
  "https://api.hostinger.com/v1/dns/${DOMAIN_BASE}/records" \
  -H "Authorization: Bearer ${HOSTINGER_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"A\",
    \"name\": \"${SUBDOMAIN}\",
    \"content\": \"${VPS_IP}\",
    \"ttl\": 300
  }" | jq .

echo "✔ DNS record queued (propagation: 1–15 min)"
