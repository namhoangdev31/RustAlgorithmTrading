# Deployment Guide: Tri-Runtime Architecture
## Phase 3.5 Production Standard

**Document Version:** 1.6.0 (Phase 3.5 Hardened)
**Updated:** 2026-05-10
**Status:** Production Ready

---

## 1. Overview

The system uses a **Tri-Runtime Architecture** optimized for specific workloads:
1.  **Rust (Execution Kernel)**: Low-latency market data ingestion, risk management, and order execution.
2.  **Go (Control Plane)**: High-performance observability, metrics aggregation, and real-time dashboard streaming.
3.  **Python (Research/ML)**: Strategy development, backtesting, and machine learning feature engineering.

## 2. Infrastructure Requirements

| Resource | Recommendation | Rationale |
| :--- | :--- | :--- |
| **CPU** | 4+ Cores (High single-thread performance) | Rust execution threads are CPU-bound |
| **RAM** | 8GB+ | In-memory order books and DuckDB buffers |
| **Storage** | 50GB+ NVMe SSD | High-throughput logging and metrics storage |
| **Network** | < 10ms to Exchange (Alpaca) | Latency-sensitive execution |

## 3. Component Port Mapping

| Service | Port | Protocol | Runtime |
| :--- | :--- | :--- | :--- |
| **Market Data Feed** | 5555 | ZMQ (PUB) | Rust |
| **Risk Manager** | 5556 | ZMQ (REQ/REP) | Rust |
| **Execution Engine** | 5557 | ZMQ (REQ/REP) | Rust |
| **Signal Bridge** | 5558 | ZMQ (PUSH/PULL) | Rust/Python |
| **Observability API** | **8081** | HTTP / WebSocket | **Go** |

## 4. Database Strategy

-   **`data/trades.db` (SQLite)**: Primary transactional store for orders, fills, and positions. Managed by Rust.
-   **`data/observability.duckdb` (DuckDB)**: Analytical store for high-frequency metrics and logs. Managed by Go.
-   **`data/cache/`**: Temporary storage for historical bar data (Parquet format).

## 5. Deployment Options

### 5.1 Docker Compose (Recommended)

The system is orchestrated using Docker Compose to ensure isolation and consistent networking.

```bash
# Start the core trading stack (Rust + Python Bridge)
docker-compose -f deployment/docker-compose.yml up -d

# Start the observability control plane (Go)
docker-compose -f deployment/docker-compose.observability.yml up -d
```

### 5.2 Systemd (Native Linux)

For bare-metal or VPS deployments, use systemd units for auto-restart and logging.

#### Example: `tr-execution.service`
```ini
[Unit]
Description=Trading System Execution Engine
After=network.target

[Service]
Type=simple
User=trading
WorkingDirectory=/opt/trading
ExecStart=/opt/trading/bin/execution-engine --config config/production.json
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## 6. Environment Configuration

Required environment variables in `.env`:

```bash
# Alpaca API Credentials
ALPACA_API_KEY=your_key
ALPACA_SECRET_KEY=your_secret
PAPER_TRADING=true

# Go Observability Settings
DUCKDB_PATH=/data/observability.duckdb
LISTEN_ADDR=0.0.0.0:8081
```

## 7. Verification Checklist

1.  [ ] **Connectivity**: `curl http://localhost:8081/health` returns 200.
2.  [ ] **ZMQ Connectivity**: Check Rust logs for successful ZMQ binding on ports 5555-5558.
3.  [ ] **Database Access**: Ensure the `data/` directory is writable by both the Rust binary and Go container.
4.  [ ] **Latency**: Run `tests/integration/test_end_to_end.rs` to verify sub-millisecond internal latency.