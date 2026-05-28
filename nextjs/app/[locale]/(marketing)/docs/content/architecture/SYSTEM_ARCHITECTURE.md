# System Architecture Documentation
## Rust Algorithmic Trading System

**Version**: 1.5.0 (Phase 3.5 Hardened)
**Last Updated**: May 10, 2026
**Architecture Pattern**: Hybrid Multi-Runtime Microservices (Rust/Python/Go)

---

## 1. System Overview

### 1.1 High-Level Architecture

The system follows a **Tri-Runtime Architecture** optimized for specific performance and development goals:

- **Rust (Execution Core)**: Low-latency services for market data ingest, order-book management, risk validation, and execution routing.
- **Python (Intelligence & Research)**: ML/AI model training, feature engineering, strategy research, and backtesting orchestration.
- **Go (Control Plane & Observability)**: High-concurrency metrics collection, analytics persistence (DuckDB), and real-time dashboard fanout (WebSocket).

### 1.2 Tech Stack (Phase 3.5)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Execution** | Rust 1.75+ | High-speed trading kernel |
| **Research** | Python 3.11+ | ML & Backtesting |
| **Observability** | Go 1.22+ | Control plane & API serving |
| **Analytics DB** | DuckDB | Columnar storage for metrics (observability.duckdb) |
| **Operational DB** | PostgreSQL | Trade logs & metadata (postgresql://localhost:5432/trading) |
| **Messaging** | ZeroMQ | Inter-process communication |
| **Containerization**| Docker | Deployment |

---

## 2. Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SYSTEMS (Alpaca)                           │
└──────────────┬───────────────────────────────────────────────▲──────────────┘
               │ Market Data (WSS)                             │ Orders (REST)
               ▼                                               │
┌─────────────────────────────┐                 ┌─────────────────────────────┐
│    MARKET DATA (Rust)       │                 │    EXECUTION ENGINE (Rust)  │
│  - Orderbook Manager        │                 │  - Order Lifecycle          │
│  - ZMQ Publisher (5555)     │                 │  - Rate Limiting            │
└──────────────┬──────────────┘                 └──────────────▲──────────────┘
               │                                               │
               │ ZMQ (Prices)                                  │ ZMQ (Signals)
               ▼                                               │
┌─────────────────────────────┐                 ┌─────────────────────────────┐
│    SIGNAL BRIDGE (Python)   │                 │    RISK MANAGER (Rust)      │
│  - Feature Engine           │────────────────▶│  - Pre-trade Checks         │
│  - ML Model Inference       │                 │  - Circuit Breakers         │
└──────────────┬──────────────┘                 └──────────────┬──────────────┘
               │                                               │
               └───────────────────────┬───────────────────────┘
                                       │ Write Metrics (HTTP/Prom)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GO OBSERVABILITY CONTROL-PLANE (Port 8081)               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐  │
│  │  METRICS SCRAPER │─────▶│ DUCKDB STORAGE   │─────▶│ WEBSOCKET HUB    │  │
│  │  (Concurrent)    │      │ (Analytical)     │      │ (10Hz Stream)    │  │
│  └──────────────────┘      └──────────────────┘      └─────────┬────────┘  │
└────────────────────────────────────────────────────────────────│─────────────┘
                                                                 ▼
                                                       ┌──────────────────┐
                                                       │ REAL-TIME DASH   │
                                                       └──────────────────┘
```

---

## 3. Component Specifications

### 3.1 Market Data Service (Rust)
- **Responsibilities**: Maintains WSS connection to Alpaca, parses market data, updates BTreeMap orderbooks, and publishes via ZMQ (Port 5555).
- **Performance**: Target <10μs for orderbook updates.
- **Observability**: Exposes metrics at `:9091/metrics`.

### 3.2 Signal Bridge (Python)
- **Responsibilities**: Consumes market data, calculates features (RSI, etc.), runs ML inference, and generates ZMQ signals (Port 5556).
- **Domain**: ML/AI strategy logic and research parity.
- **Observability**: Exposes metrics at `:9092/metrics`.

### 3.3 Risk Manager (Rust)
- **Responsibilities**: Pre-trade risk checks, position tracking, and circuit breaker enforcement.
- **Logic**: Enforces daily loss limits and max position sizes.
- **Observability**: Exposes metrics at `:9093/metrics`.

### 3.4 Execution Engine (Rust)
- **Responsibilities**: Route approved orders to Alpaca REST API, manage order lifecycle, and handle retries.
- **Performance**: Sub-100μs order submission (excluding network).

### 3.5 Go Observability Control-Plane
- **Manager**: Orchestrates scraping loops and storage persistence.
- **Scraper**: Concurrent HTTP client fetching metrics from all endpoints above.
- **WebSocket Hub**: Broadcasts latest snapshots to UI clients at 10Hz.
- **DuckDB Storage**: Single-writer access to `data/observability.duckdb`.

---

## 4. Data Flow

### 4.1 End-to-End Order Flow (Typical Latency)

| Step | Component | Latency |
|------|-----------|---------|
| 1 | Alpaca WSS → Market Data | 10μs |
| 2 | Market Data → Signal Bridge (ZMQ) | 5μs |
| 3 | Signal Bridge Processing (ML) | 20-200ms |
| 4 | Signal Bridge → Risk Manager (ZMQ) | 5μs |
| 5 | Risk Manager Checks | 5μs |
| 6 | Execution Engine → Alpaca API | 50ms (Network) |

### 4.2 Metrics Flow
1. **Emission**: All services export Prometheus metrics.
2. **Collection**: Go Scraper polls endpoints every 1s.
3. **Persistence**: Metrics are batched and written to DuckDB.
4. **Broadcasting**: WS Hub sends 10Hz snapshots to dashboard clients.

---

## 5. Integration Points

### 5.1 Messaging (ZeroMQ)
- **Port 5555**: Market Data Publication.
- **Port 5556**: Trading Signals Publication.

### 5.2 Observability API (Go)
- **Port 8081**: Primary REST/WS endpoint.

---

## 6. Failure Scenarios

### 6.1 WebSocket Disconnection
- **Detection**: Ping/pong timeout.
- **Recovery**: Market Data service performs auto-reconnection and re-subscription.

### 6.2 Circuit Breaker Trip
- **Trigger**: Daily loss exceeds threshold.
- **Effect**: Risk Manager rejects all new signals until manual reset.

### 6.3 Database Connection Failure
- **DuckDB Lock**: Go service handles retries; trading remains unaffected due to decoupling.
- **Operational Data**: PostgreSQL ensures trade logging integrity.

### 6.4 Observability Outage
- **Impact**: Dashboard is blank; trading engine continues operating normally (Control-plane separation).

---

## 7. Scalability & Performance

### 7.1 Horizontal Scaling
- **Signal Bridge**: Can be scaled by symbol group.
- **Go Hub**: Can handle 100+ concurrent WS connections.

### 7.2 Optimization Targets
- **End-to-End**: Maintain <100μs for the core Rust-only segments.
- **Observability**: Maintain <20ms p99 latency for WS broadcasting.

---

**Maintained By**: Trading Architecture Team