# Observability Backend API Documentation

## Overview

The observability control-plane is served by **Go** as of Phase 3.5. The legacy Python-based metrics collection has been fully decommissioned and purged.

Phase 3.5 Status:
- **Verdict**: **GO (FINALIZED)**
- **Runtime**: Go (port 8081)
- **Storage**: DuckDB (Primary metrics), SQLite (Trades/Metadata)
- **Scraping**: High-performance Go-native concurrent collector.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│               Go Observability Control-Plane             │
├─────────────────────────────────────────────────────────┤
│  REST API Endpoints          WebSocket Streaming        │
│  ├─ GET /api/metrics        ws://localhost:8081/ws      │
│  ├─ GET /api/trades         - Real-time updates         │
│  ├─ GET /api/system         - 10Hz streaming            │
│  └─ GET /health             - < 20ms latency (p99)      │
├─────────────────────────────────────────────────────────┤
│           Go-Native Metric Collectors                   │
│  ├─ MarketDataCollector    (Prices, Websocket Health)   │
│  ├─ StrategyCollector      (P&L, Performance History)   │
│  ├─ ExecutionCollector     (Orders, Fills, Latency)     │
│  └─ SystemCollector        (CPU, Memory, Health)        │
├─────────────────────────────────────────────────────────┤
│           Storage Engine (DuckDB + SQLite)              │
│  ├─ Automated Schema Initialization                     │
│  ├─ High-Speed Batch Ingestion                          │
│  └─ Columnar Analytics for Performance History          │
└─────────────────────────────────────────────────────────┘
```

## REST API Endpoints (Port 8081)

### 1. Health & Status

- `GET /health` - Basic health check.
- `GET /health/ready` - Readiness check (Storage & Collectors connected).

### 2. Metrics API

#### `GET /api/metrics/current`
Returns a live snapshot of the most recent metrics for all symbols.

**Response Example**:
```json
{
  "market_data": {
    "AAPL": {
      "price": 150.25,
      "volume": 1200,
      "last_tick_ms": 1625097600000,
      "status": "connected"
    }
  },
  "strategy": {
    "momentum": {
      "unrealized_pnl": 450.50,
      "daily_return": 0.015,
      "signals_total": 42
    }
  },
  "system": {
    "cpu_usage": 12.5,
    "memory_mb": 85,
    "db_health": "ok"
  }
}
```

#### `POST /api/metrics/history`
Query historical metrics from DuckDB.

**Request Body**:
```json
{
  "metric_name": "market_data_price",
  "symbol": "AAPL",
  "start_time": "2026-05-01T00:00:00Z",
  "end_time": "2026-05-10T23:59:59Z",
  "interval": "1m"
}
```

### 3. Trades API

#### `GET /api/trades`
Fetch trade history with filtering support.

**Response Example**:
```json
[
  {
    "trade_id": "T12345",
    "symbol": "AAPL",
    "side": "buy",
    "quantity": 100,
    "price": 150.10,
    "pnl": null,
    "timestamp": "2026-05-09T10:30:00Z"
  },
  {
    "trade_id": "T12346",
    "symbol": "AAPL",
    "side": "sell",
    "quantity": 100,
    "price": 155.50,
    "pnl": 540.00,
    "timestamp": "2026-05-09T14:20:00Z"
  }
]
```

## WebSocket Streaming

### Endpoint: `ws://localhost:8081/ws/metrics`

The Go WebSocket server broadcasts updates at **10Hz** (100ms intervals) using a thread-safe Hub.

### Message Format
Each message is a JSON object containing the full system state snapshot:

```json
{
  "type": "metrics_update",
  "timestamp": 1625097600500,
  "data": {
    "market": { ... },
    "execution": { ... },
    "risk": { ... }
  }
}
```

### Connection Management
- **Ping/Pong**: Required every 20s to prevent stale connections.
- **Latency**: Sub-20ms (p99) fanout from ingestion to client.

## Performance Characteristics

| Metric | Target | Verified (Phase 3.5) |
|---|---|---|
| WS Fanout Latency | < 50ms | < 20ms |
| REST Latency (current) | < 100ms | < 30ms |
| Memory Usage | < 500MB | < 100MB |
| DuckDB Batch Ingest | < 1s | < 200ms |

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | API Listening Port | `8081` |
| `DUCKDB_PATH` | Metrics Database | `data/observability.duckdb` |
| `SQLITE_PATH` | Trades Database | `data/trades.db` |

## Support & Logs

- **Service Logs**: `logs/go_api.log`
- **Error Tracking**: All nil-pointer panics are handled and logged without crashing.
- **Evidence Audit**: `docs/roadmap/COMPLETION_REPORT.md`
