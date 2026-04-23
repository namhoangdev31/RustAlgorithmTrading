#!/bin/bash
# Week-2 Contract Audit Harness
# Automates verification of Python-Rust communication boundaries.

set -e

# Configuration
LOG_DIR="$(pwd)/logs"
LOG_FILE="$LOG_DIR/contract_audit_$(date +%Y%m%d_%H%M%S).log"
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

# 1. Environment Setup (BND-006)
log_info "Audit Step 1: Runtime Compatibility Policy (BND-006)"
export PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1

if [ -d ".venv" ]; then
    PYTHON_EXE="./.venv/bin/python"
    log_success "Using .venv environment"
else
    log_error ".venv not found"
    exit 1
fi

# 2. Messaging & Signals (BND-001, BND-002)
log_info "Audit Step 2: Messaging & Signal Contracts (BND-001, BND-002)"
if $PYTHON_EXE src/bridge/zmq_bridge.py; then
    log_success "ZMQ bridge self-test PASSED (BND-001)"
else
    log_error "ZMQ bridge self-test FAILED"
fi

cd rust
if cargo check -p common && cargo check -p signal-bridge; then
    log_success "Rust messaging crates check PASSED (BND-002)"
else
    log_error "Rust messaging crates check FAILED"
fi
cd ..

# 3. Risk Decision (BND-003)
log_info "Audit Step 3: Risk Decision Contract (BND-003)"
cd rust
if cargo test -p risk-manager; then
    log_success "Risk manager tests PASSED (BND-003)"
else
    log_error "Risk manager tests FAILED"
fi
cd ..

# 4. Execution Ack (BND-004)
log_info "Audit Step 4: Execution Acknowledgement (BND-004)"
cd rust
if cargo test -p execution-engine; then
    log_success "Execution engine tests PASSED (BND-004)"
else
    log_error "Execution engine tests FAILED"
fi
cd ..

# 5. Observability (BND-005)
log_info "Audit Step 5: Observability Envelope (BND-005)"
if $PYTHON_EXE -m pytest tests/integration/test_observability_integration.py -q; then
    log_success "Observability integration tests PASSED (BND-005)"
else
    log_error "Observability integration tests FAILED"
fi

# 6. Overall Workspace Stability
log_info "Audit Step 6: Full Workspace Integrity"
cd rust
if cargo check --workspace; then
    log_success "Full Rust workspace check PASSED"
else
    log_error "Full Rust workspace check FAILED"
fi
cd ..

log_success "Week-2 Contract Audit Baseline Rerun COMPLETED"
echo "Evidence log saved to: $LOG_FILE"
