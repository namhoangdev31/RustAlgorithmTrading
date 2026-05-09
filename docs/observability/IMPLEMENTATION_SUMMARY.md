# Observability Control-Plane Implementation Summary

## Overview

Phase 3 introduced a Go-based control-plane (`go/`) for observability serving. Go control-plane under `go/` is the primary and only runtime path.

This summary reflects the current architecture after Phase 3 migration work.

## Current Runtime Ownership

- Primary control-plane serving target: Go (`chi` + `gorilla/websocket`)
- Compatibility serving path: Python Go control-plane (feature-flag controlled)
- Trading decision path: unchanged (Rust/Python strategy orchestration), outside control-plane scope

## Go Control-Plane Components

- `go/cmd/server/main.go`
  - Bootstraps HTTP server and wiring for storage, auth, rate limit, health, and WS.
- `go/internal/http`
  - REST routes and middleware chain.
- `go/internal/ws`
  - WebSocket manager for metrics fanout, connection lifecycle, ping/pong, and fanout pacing.
- `go/internal/storage`
  - DuckDB/SQLite read adapters for metrics/trades/system views.
- `go/internal/health`
  - Liveness/readiness aggregation.
- `go/internal/auth`
  - Internal API-key validation.
- `go/internal/ratelimit`
  - Per-key/per-IP rate control.

## Data Persistence and Paths

Current operational paths (override via env):

- `DUCKDB_PATH` default in Go: `data/observability.duckdb`
- `SQLITE_PATH` default in Go: `data/trades.db`

Deployment profiles may override to alternatives like:

- `data/observability.duckdb`
- `data/trades.db`

Use explicit absolute env values in production-like gates to avoid ambiguity.

## API/WS Contract Status

- Endpoint parity target is tracked in:
  - `docs/observability/PHASE3_API_PARITY_MATRIX.md`
- Cutover and rollback procedure is tracked in:
  - `docs/observability/PHASE3_CUTOVER_RUNBOOK.md`
- GO/NO-GO evidence is tracked in:
  - `docs/roadmap/PHASE3_GO_NO_GO_EVIDENCE.md`

## Go control-plane Compatibility Layer


- `GO_CONTROL_PLANE_ENABLED`

When Go cutover is finalized, Go control-plane is expected to stay rollback-ready for at least one release cycle.

## Validation and Gate Ownership

Primary validation suites:

- `tests/observability/test_go_parity.py`
- `tests/observability/`
- `tests/integration/test_observability_integration.py`

Go module tests:

- `cd go && go test ./...`

## Notes

- This document is an implementation status summary, not a historical Go control-plane build log.
- Historical Go control-plane-centric implementation details should be treated as legacy context.
