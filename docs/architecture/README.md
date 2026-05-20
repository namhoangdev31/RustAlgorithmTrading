# Architecture Documentation
## Tri-Runtime Algorithmic Trading System (Rust/Python/Go)

## Overview

This directory contains the complete system architecture documentation for the **Tri-Runtime Algorithm Trading System**, which optimizes for low-latency execution (Rust), high-velocity research (Python), and high-concurrency observability (Go).

## 📁 Document Index

### Core Architecture Documents

1. **[SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)** ⭐ **START HERE**
   - **Complete tri-runtime diagram** (Rust Kernel, Python ML, Go Control-Plane).
   - Component specifications and end-to-end data flow.
   - Port allocations and technology stack.

2. **[OBSERVABILITY_ARCHITECTURE_SUMMARY.md](OBSERVABILITY_ARCHITECTURE_SUMMARY.md)** ⭐
   - **Go-native observability** details.
   - DuckDB storage architecture and WebSocket fanout (10Hz).
   - Metrics scraping from Rust/Python producers.

3. **[python-rust-separation.md](python-rust-separation.md)**
   - Domain boundaries between research (Python) and execution (Rust).
   - Includes the Go control-plane decoupling logic.

4. **[ARCHITECTURE_INDEX.md](ARCHITECTURE_INDEX.md)**
   - Detailed list of all architecture records and ADRs.
   - Implementation roadmap and Phase 3.5 status.

---

## 📊 Architecture Summary (Phase 3.5)

### Design Philosophy (Tri-Runtime)

| Runtime | Domain | Key Principle |
|---------|--------|---------------|
| **Rust** | Execution (Online) | Performance & Memory Safety |
| **Python** | Research (Offline) | Productivity & Rapid Iteration |
| **Go** | Control-Plane (Observability) | High Concurrency & Decoupled Monitoring |

### Technology Stack

| Layer | Component | Technology |
|-------|-----------|-----------|
| **Execution Core** | Trading Kernel | Rust (Tokio, Axum) |
| **ML & Research** | Model Training | Python (PyTorch, Pandas) |
| **Observability** | Control Plane | Go (internal/collector, internal/ws) |
| **Persistence** | Analytics | DuckDB |
| **Persistence** | Operational | PostgreSQL |
| **Messaging** | IPC | ZeroMQ (ZMQ) |

### Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| **Trading Latency** | < 100 μs | ✅ Verified |
| **Metrics Fanout** | 10Hz (< 20ms p99) | ✅ Verified (Go Hub) |
| **Ingestion Rate** | 10k+ metrics/sec | ✅ Verified |
| **RAM Usage** | < 100MB (Go binary) | ✅ Verified |

---

## 🎯 Quick Navigation

### By Role

- **System Architects**: Start with [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md).
- **Go Developers**: Review [OBSERVABILITY_ARCHITECTURE_SUMMARY.md](OBSERVABILITY_ARCHITECTURE_SUMMARY.md).
- **Python ML Engineers**: See [python-rust-separation.md](python-rust-separation.md) Section 1.
- **Rust Engineers**: See [python-rust-separation.md](python-rust-separation.md) Section 2.

---

**Last Updated**: 2026-05-10
**Maintained By**: Trading Architecture Team