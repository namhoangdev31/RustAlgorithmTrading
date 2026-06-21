#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CERT_ROOT="${LEPOS_CERT_ROOT:-$PROJECT_ROOT/ops/certs/local}"
CA_NAME="${LEPOS_CERT_CA_NAME:-lepos-local-ca}"
VALID_DAYS="${LEPOS_CERT_VALID_DAYS:-30}"

mkdir -p "$CERT_ROOT"

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required" >&2
  exit 1
fi

CA_KEY="$CERT_ROOT/$CA_NAME.key"
CA_CERT="$CERT_ROOT/$CA_NAME.crt"
CONTROL_KEY="$CERT_ROOT/control-plane.key"
CONTROL_CSR="$CERT_ROOT/control-plane.csr"
CONTROL_CERT="$CERT_ROOT/control-plane.crt"
GATEWAY_KEY="$CERT_ROOT/edge-gateway.key"
GATEWAY_CSR="$CERT_ROOT/edge-gateway.csr"
GATEWAY_CERT="$CERT_ROOT/edge-gateway.crt"

if [[ ! -f "$CA_KEY" || ! -f "$CA_CERT" ]]; then
  openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "$CA_KEY" \
    -out "$CA_CERT" \
    -days "$VALID_DAYS" \
    -subj "/CN=$CA_NAME"
fi

openssl req -nodes -newkey rsa:2048 \
  -keyout "$CONTROL_KEY" \
  -out "$CONTROL_CSR" \
  -subj "/CN=nextjs-control-plane"
openssl x509 -req -in "$CONTROL_CSR" -CA "$CA_CERT" -CAkey "$CA_KEY" -CAcreateserial \
  -out "$CONTROL_CERT" -days "$VALID_DAYS"

openssl req -nodes -newkey rsa:2048 \
  -keyout "$GATEWAY_KEY" \
  -out "$GATEWAY_CSR" \
  -subj "/CN=edge-gateway"
openssl x509 -req -in "$GATEWAY_CSR" -CA "$CA_CERT" -CAkey "$CA_KEY" -CAcreateserial \
  -out "$GATEWAY_CERT" -days "$VALID_DAYS"

cat <<EOF
LEPOS_CONTROL_PLANE_TLS_CERT=$GATEWAY_CERT
LEPOS_CONTROL_PLANE_TLS_KEY=$GATEWAY_KEY
LEPOS_CONTROL_PLANE_TLS_CA=$CA_CERT
EOF
