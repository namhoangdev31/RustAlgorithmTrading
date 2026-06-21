#!/bin/bash

set -euo pipefail

CONTROL_PLANE_URL="${LEPOS_CONTROL_PLANE_URL:-http://127.0.0.1:3000}"
PROJECT_ID="${1:-}"
DOMAIN="${2:-}"
TOKEN="${LEPOS_NATIVE_TOKEN:-}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "usage: $0 <project-id> [domain]"
  exit 1
fi

AUTH_HEADER=()
if [[ -n "$TOKEN" ]]; then
  AUTH_HEADER=(-H "Authorization: Bearer $TOKEN")
elif [[ -n "${LEPOS_INTERNAL_API_KEY:-}" ]]; then
  AUTH_HEADER=(-H "X-LepoS-Internal-Key: $LEPOS_INTERNAL_API_KEY")
fi

echo "[phase4-smoke] routing snapshot"
curl -fsS "${AUTH_HEADER[@]}" "$CONTROL_PLANE_URL/api/native/routing?projectId=$PROJECT_ID" >/dev/null

echo "[phase4-smoke] region replicas"
curl -fsS "${AUTH_HEADER[@]}" "$CONTROL_PLANE_URL/api/native/routing/replicas?projectId=$PROJECT_ID" >/dev/null

echo "[phase4-smoke] routing policy"
curl -fsS "${AUTH_HEADER[@]}" "$CONTROL_PLANE_URL/api/native/routing/policy?projectId=$PROJECT_ID" >/dev/null

echo "[phase4-smoke] security telemetry list"
curl -fsS "${AUTH_HEADER[@]}" "$CONTROL_PLANE_URL/api/native/security?projectId=$PROJECT_ID" >/dev/null

echo "[phase4-smoke] remediation dry-run create"
curl -fsS "${AUTH_HEADER[@]}" \
  -H "Content-Type: application/json" \
  -d "{\"projectId\":\"$PROJECT_ID\",\"actionType\":\"routing_refresh\",\"mode\":\"suggest\",\"summary\":\"smoke\",\"dryRun\":true}" \
  "$CONTROL_PLANE_URL/api/native/remediation/runs" >/dev/null

if [[ -n "$DOMAIN" ]]; then
  echo "[phase4-smoke] resolve domain"
  curl -fsS "${AUTH_HEADER[@]}" "$CONTROL_PLANE_URL/api/native/resolve?domain=$DOMAIN" >/dev/null
fi

echo "[phase4-smoke] ok"
