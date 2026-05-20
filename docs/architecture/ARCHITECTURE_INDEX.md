# Architecture Documentation Index

## Tri-Runtime Algorithmic Trading System (Rust/Python/Go)

**Last Updated:** 2026-05-10
**Status:** ✅ Phase 3.5 Production Hardened

---

## Overview

This index tracks the architectural evolution of the system from a Python-Rust hybrid to a **Tri-Runtime Architecture** (Rust-Kernel, Python-Research, Go-Control-Plane).

---

## Core Architecture Documents

### 1. [System Architecture](SYSTEM_ARCHITECTURE.md) ⭐ **PRIMARY**

- High-level tri-runtime diagram.
- Component specifications for Rust (Kernel), Python (ML), and Go (Observability).
- End-to-end data flow and port allocations.

### 2. [Observability Architecture](OBSERVABILITY_ARCHITECTURE_SUMMARY.md) ⭐ **CRITICAL**

- Go-native scraper and WebSocket fanout architecture.
- DuckDB time-series storage design.
- Hardened metrics pipeline from Rust services.

### 3. [Python-Rust Separation](python-rust-separation.md)

- Domain boundaries between the low-latency Rust kernel and the high-flexibility Python research layer.

---

## Architectural Decision Records (ADRs)

### ADR-002: Hybrid Persistence (DuckDB + PostgreSQL)

**Decision**: Use DuckDB for analytical time-series metrics and PostgreSQL for transactional trade logs.
**Rationale**:

- DuckDB provides 100x faster analytical queries than traditional RDBMS.
- PostgreSQL ensures ACID compliance for trade records without the overhead of a separate DB server.
- **Note**: PostgreSQL remains a supported secondary sink but is not on the hot observability path.

### ADR-005: Go-Native Control-Plane

**Decision**: Replace legacy Python observability APIs with a high-concurrency Go control-plane.
**Rationale**:

- Go's concurrency model (goroutines) enables 10Hz WebSocket fanout with <20ms latency.
- Independent control-plane ensures monitoring stays alive even if trading services restart.
- Significant reduction in RAM footprint (from ~500MB to <100MB).

---

## Implementation Status (Phase 3.5)

| Priority | Feature | Runtime | Status |
|----------|---------|---------|--------|
| **CRITICAL** | Rust-to-Go Metrics Pipeline | Rust/Go | ✅ COMPLETE |
| **CRITICAL** | DuckDB Hardened Ingestion | Go | ✅ COMPLETE |
| **HIGH** | WebSocket 10Hz Fanout | Go | ✅ COMPLETE |
| **MEDIUM** | Python Research Parity | Python | ✅ COMPLETE |

---

**Maintained By**: Trading Architecture Team
