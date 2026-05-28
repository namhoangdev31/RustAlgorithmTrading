# Logging Standards (Tri-Runtime)

## Overview

This document defines the logging standards across Rust, Python, and Go components to ensure consistent observability and traceability through the **Go Control-Plane**.

## 1. Runtime-Specific Implementations

| Runtime | Framework | Output Format | Usage |
|:---|:---|:---|:---|
| **Rust** | `tracing` | Structured (JSON) | High-performance execution logs |
| **Python** | `loguru` | Structured (JSON) | Research, strategy, and feature logs |
| **Go** | `zap` | Structured (JSON) | Control-plane and API logs |

## 2. Global Correlation ID

All services **must** propagate a `correlation_id` in logs to track events across runtime boundaries.

- **Source**: The `market-data` service generates a `correlation_id` for each incoming tick.
- **Propagation**: Passed via ZMQ headers or REST API `X-Correlation-ID` headers.

## 3. Log Levels

| Level | Usage |
|:---|:---|
| `FATAL` | Unrecoverable crash. Immediate system halt. |
| `ERROR` | Recoverable error (e.g., API timeout). Requires alert. |
| `WARN` | Abnormal but expected behavior (e.g., retry attempt). |
| `INFO` | Major state changes (e.g., order filled, system started). |
| `DEBUG` | Verbose operational info for troubleshooting. |

## 4. Standard Fields (JSON)

Every log entry should contain:
```json
{
  "timestamp": "ISO8601",
  "level": "INFO|ERROR|...",
  "component": "execution-engine|signal-bridge|...",
  "correlation_id": "uuid-string",
  "message": "Human readable message",
  "payload": { ... }
}
```

## 5. Log Aggregation

In production, the Go Control-Plane collects logs from stdout/stderr or via specialized ZMQ log subscribers and exposes them via:
- `GET /api/system/logs/recent`

---
**Maintained By**: Trading Infrastructure Team
**Status**: Authoritative Standard
