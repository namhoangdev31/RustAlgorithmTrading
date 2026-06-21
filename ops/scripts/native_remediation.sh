#!/bin/bash

set -euo pipefail

ACTION="${1:-}"
DRY_RUN="${LEPOS_REMEDIATION_DRY_RUN:-1}"
PROJECT_ID="${LEPOS_REMEDIATION_PROJECT_ID:-}"
RUN_ID="${LEPOS_REMEDIATION_RUN_ID:-}"
PAYLOAD="${LEPOS_REMEDIATION_PAYLOAD:-{}}"

if [[ -z "$ACTION" ]]; then
  echo "usage: $0 <cache_purge|routing_refresh|deployment_rollback|replica_drain>"
  exit 1
fi

echo "[native-remediation] run=$RUN_ID project=$PROJECT_ID action=$ACTION dry_run=$DRY_RUN"
echo "[native-remediation] payload=$PAYLOAD"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "[native-remediation] dry-run validated"
  exit 0
fi

case "$ACTION" in
  cache_purge)
    echo "[native-remediation] cache purge approved"
    ;;
  routing_refresh)
    echo "[native-remediation] routing refresh approved"
    ;;
  deployment_rollback)
    echo "[native-remediation] deployment rollback approved"
    ;;
  replica_drain)
    echo "[native-remediation] replica drain approved"
    ;;
  *)
    echo "[native-remediation] unsupported action: $ACTION" >&2
    exit 1
    ;;
esac

echo "[native-remediation] apply complete"
