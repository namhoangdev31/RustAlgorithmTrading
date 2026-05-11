# Metrics Catalog

## Overview

This document defines the metrics collected by the **Go Control-Plane** and stored in **DuckDB**. Metrics are categorized by their functional domain: Latency, Throughput, Health, and Business Performance.

## 1. Latency Metrics (Microseconds)

| Metric Name | Component | Target | Description |
|:---|:---|:---|:---|
| `market_data_ws_latency_us` | Market Data | < 100μs | WebSocket message parse to ZMQ publish |
| `order_routing_latency_us` | Execution | < 50μs | Signal receipt to API call submission |
| `risk_check_latency_us` | Risk | < 250μs | Pre-trade risk validation time |
| `signal_bridge_latency_us` | Signal Bridge | < 1ms | Python model inference + feature computation |
| `api_roundtrip_ms` | Execution | < 500ms | External broker API response time (ms) |

## 2. Throughput & Volume

| Metric Name | Type | Description |
|:---|:---|:---|
| `messages_processed_total` | Counter | Total market data ticks processed |
| `orders_submitted_total` | Counter | Total orders sent to broker |
| `signals_generated_total` | Counter | Total strategy signals generated |
| `zmq_backlog_count` | Gauge | Number of messages waiting in ZMQ queues |

## 3. Business & Performance

| Metric Name | Type | Description |
|:---|:---|:---|
| `unrealized_pnl_usd` | Gauge | Current open position profit/loss |
| `realized_pnl_usd` | Counter | Total profit/loss from closed trades |
| `drawdown_percent` | Gauge | Percentage drop from equity peak |
| `order_fill_rate` | Gauge | Ratio of filled orders to submitted orders |
| `slippage_bps` | Histogram | Difference between target and fill price in basis points |

## 4. System Health

| Metric Name | Type | Description |
|:---|:---|:---|
| `cpu_usage_percent` | Gauge | Component-level CPU utilization |
| `memory_usage_mb` | Gauge | Component-level memory footprint |
| `db_disk_usage_mb` | Gauge | DuckDB + SQLite filesystem footprint |
| `active_websockets` | Gauge | Number of connected dashboard clients |

## Data Retention Policy

- **High-Resolution (1Hz)**: Retained for 7 days in DuckDB.
- **Aggregated (1m)**: Retained for 90 days in DuckDB.
- **Trade Records**: Retained indefinitely in SQLite.

---
**Maintained By**: Trading Infrastructure Team
**Status**: Authoritative Reference
