#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

check_process() {
    local name="$1"
    if pgrep -f "$name" >/dev/null 2>&1; then
        echo "[OK] $name running: $(pgrep -f "$name" | tr '\n' ' ')"
    else
        echo "[--] $name not running"
    fi
}

echo "=== Trading Runtime Health ==="
echo ""

echo "Processes:"
check_process "market-data"
check_process "risk-manager"
check_process "execution-engine"
check_process "signal-bridge"
check_process "edge-gateway"

echo ""
echo "Config:"
if [ -f "$PROJECT_ROOT/ops/config/system.json" ]; then
    if command -v jq >/dev/null 2>&1; then
        echo "  environment: $(jq -r '.metadata.environment // "unknown"' "$PROJECT_ROOT/ops/config/system.json")"
        echo "  paper_trading: $(jq -r '.execution.paper_trading // "unknown"' "$PROJECT_ROOT/ops/config/system.json")"
    else
        echo "  ops/config/system.json exists (install jq for parsed output)"
    fi
else
    echo "  missing ops/config/system.json"
fi

if [ -f "$PROJECT_ROOT/ops/config/risk_limits.toml" ]; then
    echo "  risk_limits: present"
else
    echo "  risk_limits: missing"
fi

echo ""
echo "Secrets:"
if [ -f "$PROJECT_ROOT/.env" ]; then
    grep -q '^ALPACA_API_KEY=' "$PROJECT_ROOT/.env" && echo "  ALPACA_API_KEY: set" || echo "  ALPACA_API_KEY: missing"
    grep -q '^ALPACA_SECRET_KEY=' "$PROJECT_ROOT/.env" && echo "  ALPACA_SECRET_KEY: set" || echo "  ALPACA_SECRET_KEY: missing"
else
    echo "  .env not found"
fi

echo ""
echo "Recent logs:"
for service in market-data risk-manager execution-engine signal-bridge edge-gateway; do
    log_file="$PROJECT_ROOT/logs/${service}.log"
    if [ -f "$log_file" ]; then
        echo "  ${service}:"
        tail -3 "$log_file" | sed 's/^/    /'
    fi
done
