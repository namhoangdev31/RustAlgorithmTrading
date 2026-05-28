# Development Environment Setup

## Overview

The RustAlgorithmTrading platform is a tri-runtime system (Rust, Python, Go). This guide ensures your local environment is correctly configured for development across all three layers.

## 1. Prerequisites

### System Libraries

- **Linux (Ubuntu)**: `sudo apt install build-essential pkg-config libssl-dev libzmq3-dev`
- **macOS**: `brew install zeromq pkg-config openssl`

### Runtime Toolchains

- **Rust**: 1.75+ (Install via `rustup`)
- **Python**: 3.11+ (Manage via `uv`)
- **Go**: 1.22+

## 2. Project Initialization

### Clone & Build

```bash
git clone <repo_url>
cd RustAlgorithmTrading

# 1. Sync Python dependencies
uv sync

# 2. Build Rust kernel
cd rust && cargo build --workspace

# 3. Build Go services
cd ../go && go build ./...
```

### Configuration

Create a `.env` file in the root directory:

```bash
ALPACA_API_KEY=your_key
ALPACA_SECRET_KEY=your_secret
ALPACA_API_URL=https://paper-api.alpaca.markets
LOG_LEVEL=info
```

## 3. Local Development Workflow

### Starting the System

The local native fallback starts the Rust runtime services:

```bash
bash ops/scripts/start_services.sh
```

Container orchestration and user-facing telemetry/configuration are intentionally outside `ops/` after the cleanup.

### Verifying Health

Run the health check utility frequently during development:

```bash
bash ops/scripts/health_check.sh
```

### Database Access

- **Metrics**: Open `data/observability.duckdb` using the DuckDB CLI.
- **Trades**: Open `data/postgresql://localhost:5432/trading` using the PostgreSQL CLI.

## 4. Testing

### Run All Tests

```bash
# Python
pytest tests/

# Rust
cd rust && cargo test --workspace

# Go
cd go && go test ./...
```

---
**Maintained By**: Engineering Team
**Status**: Authoritative Guide (Phase 3.5)
