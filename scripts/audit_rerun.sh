#!/bin/bash
# Week-1 Closeout Audit Script
# Automates environment verification, testing, and service health checks.

set -e

# Configuration
LOG_DIR="$(pwd)/logs"
LOG_FILE="$LOG_DIR/audit_$(date +%Y%m%d_%H%M%S).log"
mkdir -p "$LOG_DIR"
touch "$LOG_FILE"

log_info() {
    echo -e "\033[0;34m[INFO] $(date +%H:%M:%S) - $1\033[0m" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "\033[0;32m[✓] $(date +%H:%M:%S) - $1\033[0m" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "\033[0;31m[✗] $(date +%H:%M:%S) - $1\033[0m" | tee -a "$LOG_FILE"
}

# 1. Environment Setup
log_info "Phase 1: Environment Reproducibility"
export PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1

if [ -d ".venv" ]; then
    log_info "Using virtual environment (.venv)"
    PYTHON_EXE="./.venv/bin/python"
else
    log_error ".venv not found. Please create it first."
    exit 1
fi

log_info "Ensuring Python dependencies are present..."
uv pip install pandas numpy scipy matplotlib scikit-learn loguru pydantic sqlalchemy plotly websockets ccxt alpaca-trade-api fastapi uvicorn duckdb aiohttp pyarrow fastparquet tables > /dev/null 2>&1
log_success "Dependencies verified"

# 2. Python Testing
log_info "Phase 2: Python Unit Tests"
if $PYTHON_EXE -m pytest tests/unit/python/test_strategy_base.py -q; then
    log_success "Python unit tests passed"
else
    log_error "Python unit tests failed"
    exit 1
fi

# 3. Rust Testing
log_info "Phase 3: Rust Workspace Verification"
cd rust
if cargo check --workspace; then
    log_success "Rust workspace check passed"
else
    log_error "Rust workspace check failed"
    exit 1
fi

if cargo test -p database; then
    log_success "Rust database tests passed"
else
    log_error "Rust database tests failed"
    exit 1
fi
cd ..

# 4. Service Startup & Health Check
log_info "Phase 4: Service Orchestration & Health"
log_info "Stopping existing services..."
bash scripts/stop_services.sh || true
sleep 2

log_info "Starting core services..."
# Clean start (ensuring logs and configs are ready)
mkdir -p logs
ln -sf ../config rust/config || true

bash scripts/start_services.sh > logs/startup_audit.log 2>&1 &
STARTUP_PID=$!
log_info "Waiting for initialization (20s)..."
sleep 20

if bash scripts/health_check.sh; then
    log_success "System health check PASSED - All core services are UP"
else
    log_error "System health check FAILED"
    cat logs/startup_audit.log
    exit 1
fi

# Final Cleanup (optional, keep services running for inspection if needed)
# log_info "Stopping services after audit..."
# bash scripts/stop_services.sh

log_success "Week-1 Closeout Audit COMPLETED SUCCESSFULLY"
echo "Full audit log saved to: $LOG_FILE"
