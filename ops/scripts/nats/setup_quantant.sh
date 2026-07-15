#!/usr/bin/env bash
set -euo pipefail

: "${NATS_URL:?NATS_URL must point to the target NATS cluster}"

stream="QUANTANT_COMMANDS"
consumer="QUANTANT_EXECUTION_ENGINE"
delivery_subject="quantant.execution.engine"

if ! nats --server "${NATS_URL}" stream info "${stream}" >/dev/null 2>&1; then
  nats --server "${NATS_URL}" stream add "${stream}" \
    --subjects "quantant.>" \
    --storage file \
    --retention limits \
    --discard old \
    --dupe-window 24h \
    --max-age 168h \
    --defaults
fi

if ! nats --server "${NATS_URL}" consumer info "${stream}" "${consumer}" >/dev/null 2>&1; then
  nats --server "${NATS_URL}" consumer add "${stream}" "${consumer}" \
    --filter "quantant.execution.commands" \
    --deliver "${delivery_subject}" \
    --ack explicit \
    --max-deliver 20 \
    --replay instant \
    --defaults
fi

nats --server "${NATS_URL}" stream info "${stream}"
nats --server "${NATS_URL}" consumer info "${stream}" "${consumer}"
