#!/bin/bash
# Start the Go Observability API server

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

export PORT=${PORT:-8081}
export DUCKDB_PATH=${DUCKDB_PATH:-data/observability.duckdb}
export SQLITE_PATH=${SQLITE_PATH:-data/trades.db}
export OBSERVABILITY_API_KEY=${OBSERVABILITY_API_KEY:-""}

echo "Preparing Go Observability API..."

# Build binary if missing
if [ ! -f "./go/observability-api" ]; then
    echo "  Binary missing, building..."
    mkdir -p logs
    (cd go && go build -o observability-api cmd/server/main.go)
fi

if [ ! -f "./go/observability-api" ]; then
    echo "  ERROR: Failed to build Go binary!"
    exit 1
fi

echo "Stopping existing Go Observability API instances..."
pkill observability-api || true
sleep 1

echo "Starting Go Observability API..."
echo "  Port: $PORT"
echo "  DuckDB: $DUCKDB_PATH"
echo "  SQLite: $SQLITE_PATH"

mkdir -p logs
nohup ./go/observability-api > logs/go_api.log 2>&1 &
echo "  PID: $!"
echo "  Logs: logs/go_api.log"
