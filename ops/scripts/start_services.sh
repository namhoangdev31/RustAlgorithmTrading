#!/bin/bash
# Start all trading system services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

mkdir -p "$LOG_DIR" "$PROJECT_ROOT/pids"

# Source environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Fix PyO3 compatibility for Python 3.14
export PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1

# Check environment
ENVIRONMENT=${TRADING_ENV:-development}
echo "Starting services in $ENVIRONMENT mode..."

# Select configuration
CONFIG_FILE="$PROJECT_ROOT/ops/config/system.development.json"
if [ "$ENVIRONMENT" = "staging" ]; then
    CONFIG_FILE="$PROJECT_ROOT/ops/config/system.staging.json"
elif [ "$ENVIRONMENT" = "production" ]; then
    CONFIG_FILE="$PROJECT_ROOT/ops/config/system.production.json"
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: Configuration file $CONFIG_FILE not found"
    exit 1
fi

echo "Using configuration: $CONFIG_FILE"

# Create symlink for active config
rm -f "$PROJECT_ROOT/ops/config/system.json"
ln -sf "$(basename "$CONFIG_FILE")" "$PROJECT_ROOT/ops/config/system.json"

# Build services
echo "Building services..."
cd "$PROJECT_ROOT/rust"
cargo build --release

# Start services in background
echo ""
echo "Starting Market Data Service..."
RUST_LOG=info ./target/release/market-data > "$LOG_DIR/market-data.log" 2>&1 &
MARKET_DATA_PID=$!
echo "  PID: $MARKET_DATA_PID"

sleep 2

echo "Starting Risk Manager..."
RUST_LOG=info ./target/release/risk-manager > "$LOG_DIR/risk-manager.log" 2>&1 &
RISK_MANAGER_PID=$!
echo "  PID: $RISK_MANAGER_PID"

sleep 2

echo "Starting Execution Engine..."
RUST_LOG=info ./target/release/execution-engine > "$LOG_DIR/execution-engine.log" 2>&1 &
EXECUTION_PID=$!
echo "  PID: $EXECUTION_PID"

sleep 2

echo "Starting Signal Bridge..."
RUST_LOG=info ./target/release/signal-bridge > "$LOG_DIR/signal-bridge.log" 2>&1 &
SIGNAL_BRIDGE_PID=$!
echo "  PID: $SIGNAL_BRIDGE_PID"

echo ""
echo "All services started."
echo ""
echo "PIDs:"
echo "  Market Data: $MARKET_DATA_PID"
echo "  Risk Manager: $RISK_MANAGER_PID"
echo "  Execution Engine: $EXECUTION_PID"
echo "  Signal Bridge: $SIGNAL_BRIDGE_PID"
echo ""
echo "Logs available in logs/"
echo ""
echo "To stop services, run: ./ops/scripts/stop_services.sh"
