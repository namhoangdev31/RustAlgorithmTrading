# Production Deployment Guide

## Rust Algorithmic Trading System

**Version**: 2.0.0 (Phase 3.5 Hardened)
**Last Updated**: May 11, 2026
**System Status**: ✅ **OPERATIONAL (Tri-Runtime)**
**Target Environment**: Linux (Ubuntu 22.04+ / RHEL 9+), Docker-native deployment

---

## 1. Prerequisites

### System Requirements

#### Hardware Requirements

- **CPU**: 8+ cores (High clock speed preferred for Rust kernel)
- **RAM**: 16GB minimum (32GB+ recommended for large-scale backtesting)
- **Storage**: 100GB+ NVMe SSD (High IOPS for DuckDB/PostgreSQL)
- **Network**: Low-latency connection (<5ms to Alpaca exchange endpoints)

#### Software Requirements (Tri-Runtime Stack)

- **Rust Kernel**: Rust 1.75+ (Stable)
- **Python Research**: Python 3.11+ (Managed via `uv`)
- **Go Control Plane**: Go 1.22+
- **Persistence**:
  - **DuckDB**: Analytical time-series metrics (`data/observability.duckdb`)
  - **PostgreSQL**: Transactional trade logs (`data/postgresql://localhost:5432/trading`)
- **Messaging**: ZeroMQ 4.3+
- **Containerization**: Docker 25.0+ & Docker Compose 2.24+

### Network Requirements

- **Outbound**:
  - Alpaca API/WSS (443)
- **Internal**:
  - ZMQ Ports: 5555 (Market Data), 5556 (Signals)
  - Go Control Plane: 8081 (REST/WebSocket)
  - Rust Metrics: 9091 (Market Data), 9092 (Execution), 9093 (Risk)

---

## 2. Environment Setup

### 2.1 Unified Installation

The project provides a hardened installation script that handles all three runtimes:

```bash
# 1. Clone & Enter
git clone [REPO_URL] && cd RustAlgorithmTrading

# 2. Run Hardened Installer
# This installs Rust, Go, Python/uv, and ZMQ dependencies
./install_all_dependencies_fast.sh
```

### 2.2 Production Configuration (`.env`)

Create a `.env` file in the root directory:

```bash
# === ALPACA CREDENTIALS ===
ALPACA_API_KEY=your_live_key
ALPACA_API_SECRET=your_live_secret
ALPACA_API_URL=https://api.alpaca.markets
PAPER_TRADING=false

# === STORAGE PATHS ===
DUCKDB_PATH=data/observability.duckdb
PostgreSQL_PATH=data/postgresql://localhost:5432/trading

# === CONTROL PLANE ===
LISTEN_ADDR=0.0.0.0:8081
LOG_LEVEL=info

# === TRADING KERNEL ===
RUST_LOG=info,market_data=debug,execution_engine=debug
```

---

## 3. Deployment Methods

### Method 1: Docker Deployment (Recommended Production Path)

The Phase 3.5 architecture uses a streamlined Docker-native approach.

#### Step 1: Start the Trading Network

```bash
docker network create trading_network
```

#### Step 2: Deploy Go Control Plane & Observability

```bash
# This starts the Go-native metrics scraper and WebSocket hub
docker compose -f deployment/docker-compose.observability.yml up -d
```

#### Step 3: Deploy Rust Trading Kernel

```bash
# Builds and starts Market Data, Execution, and Risk services
docker compose -f deployment/docker-compose.yml up -d
```

### Method 2: Native Binary Deployment (Ultra-Low Latency)

For environments where <100μs latency is required.

```bash
# 1. Build Rust Optimized
cd rust && cargo build --release --workspace

# 2. Build Go Control Plane
cd go && go build -o ../bin/observability-api ./cmd/server/main.go

# 3. Start Control Plane First
./bin/observability-api &

# 4. Start Trading Kernel
./scripts/start_rust_services.sh --release
```

### Method 3: Systemd Service Deployment (Robust Native)

For native Linux deployments requiring automatic restart and system-level logging.

#### 1. Create Service Files
Create `/etc/systemd/system/trading-market-data.service`:
```ini
[Unit]
Description=Rust Trading Kernel - Market Data
After=network.target

[Service]
Type=simple
User=trading
WorkingDirectory=/opt/RustAlgorithmTrading
EnvironmentFile=/opt/RustAlgorithmTrading/.env
ExecStart=/opt/RustAlgorithmTrading/rust/target/release/market-data
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
*Note: Create similar files for `execution-engine`, `risk-manager`, and the Go `observability-api`.*

#### 2. Enable and Start
```bash
sudo systemctl daemon-reload
sudo systemctl enable trading-market-data execution-engine risk-manager observability-api
sudo systemctl start observability-api
sleep 2
sudo systemctl start trading-market-data execution-engine risk-manager
```

---

## 4. Monitoring & Health

### 4.1 Go Control Plane (Port 8081)

- **Health**: `curl http://localhost:8081/health`
- **Metrics Stream**: `wscat -c ws://localhost:8081/ws/metrics`
- **History**: `POST /api/metrics/history` (JSON query for DuckDB)

### 4.2 Rust Metrics (Prometheus Format)

- Market Data: `http://localhost:9091/metrics`
- Execution: `http://localhost:9092/metrics`
- Risk: `http://localhost:9093/metrics`

---

## 5. Security & Hardening

1. **Firewall**: Only Port 8081 should be exposed externally (with Auth).
2. **Secrets**: Use Docker Secrets or environment-level masking.
3. **Isolation**: The Go Control Plane is decoupled; its failure will NOT stop the Rust trading kernel.

---

## 6. Rollback Procedures

### Quick Rollback (Docker)

```bash
# Revert to last stable tag
docker compose down
git checkout [LAST_STABLE_TAG]
docker compose up -d
```

### Data Recovery

If DuckDB file corruption occurs (rare with single-writer):

```bash
rm data/observability.duckdb
# The Go service will automatically recreate the schema on restart
docker restart tr_observability_go
```

---

**Architect**: Antigravity AI
**Documentation Version**: 2.0.0
