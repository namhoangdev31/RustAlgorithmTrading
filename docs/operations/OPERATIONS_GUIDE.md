# Operations Guide

## Overview

This guide defines the procedures for daily operations, incident response, and disaster recovery for the RustAlgorithmTrading platform (Phase 3.5 Tri-Runtime).

## 1. Daily Operations

### 1.1 Pre-Market Checklist

Run this 30 minutes before market open:

```bash
# 1. Verify environment health
bash ops/scripts/health_check.sh

# 2. Check Go Control Plane connectivity
curl http://localhost:8081/health

# 3. Verify Alpaca connectivity
# (Handled automatically by market-data startup logs)
```

### 1.2 Monitoring Strategy

The **Go Control Plane (Port 8081)** is the primary monitoring interface.

- **Metrics**: Available via `GET /api/v1/metrics`.
- **WebSocket**: Stream 10Hz updates via `ws://localhost:8081/ws/metrics`.
- **Storage**: DuckDB (`data/observability.duckdb`) stores time-series data.

## 2. Service Management

The system uses a strict startup/shutdown order to ensure state consistency.

| Service | Port | Dependency |
|:---|:---|:---|
| **Go Control Plane** | 8081 | None |
| **Market Data** | ZMQ | Go CP |
| **Signal Bridge** | ZMQ | Market Data |
| **Risk Manager** | ZMQ | Signal Bridge |
| **Execution Engine** | ZMQ | Risk Manager |

### Start All Services

```bash
bash ops/scripts/start_trading.sh
```

### Stop All Services

```bash
bash ops/scripts/stop_trading.sh
```

## 3. Incident Response

### 3.1 Severity Levels

- **P0 (Critical)**: Circuit breaker tripped, API down, or financial loss > $1,000.
- **P1 (High)**: Latency > 1ms, partial data gaps.
- **P2 (Medium)**: Dashboard/Observability API issues.

### 3.2 Emergency Kill Switch

If the system is acting erratically and fails to auto-trip:

```bash
# Force stop all trading components
bash ops/scripts/stop_trading.sh
```

### 3.3 Manual Liquidation

To close all positions via Alpaca immediately:

```bash
uv run python ops/scripts/liquidate_positions.py --confirm
```

## 4. Disaster Recovery

### 4.1 Backup Schedule

- **Metrics (DuckDB)**: Daily snapshot to `backups/`.
- **Trades (PostgreSQL)**: Real-time sync + daily snapshot to `backups/`.
- **Logs**: Archived daily to `logs/archive/`.

### 4.2 Database Restoration

To restore a corrupted DuckDB or PostgreSQL database:

1. Stop all services.
2. Replace `data/observability.duckdb` or `data/postgresql://localhost:5432/trading` with the latest file from `backups/`.
3. Restart the Go Control Plane.
4. Verify integrity via `ops/scripts/health_check.sh`.

### 4.3 Position Reconciliation

After a crash, always reconcile local state with Alpaca:

```bash
uv run python ops/scripts/reconcile_positions.py
```

---
**Maintained By**: Trading Operations
**Status**: Authoritative Standard (Phase 3.5)
