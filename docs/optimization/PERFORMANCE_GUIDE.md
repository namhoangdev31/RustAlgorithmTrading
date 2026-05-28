# Performance Optimization Guide

## Overview

The RustAlgorithmTrading platform is designed for sub-millisecond execution. This guide covers the technical optimizations used in the Rust kernel and system-level tuning for production.

## 1. Rust Kernel Optimizations

### 1.1 Memory Management

- **Zero-Copy**: All ZMQ message passing uses zero-copy serialization (Bincode) to minimize allocations.
- **Arena Allocation**: Large data structures (e.g., Order Books) use pre-allocated buffers to avoid fragmentation.
- **No-Panic Policy**: Production code avoids `.unwrap()` and `.expect()`, preferring explicit error propagation to prevent runtime overhead from unwinding.

### 1.2 Concurrency

- **Lock-Free Structures**: High-frequency paths (Risk checks, Market Data updates) use lock-free queues and atomic primitives.
- **Crate Choices**: `parking_lot` is preferred over `std::sync` for faster mutexes in non-critical paths.

### 1.3 SIMD Vectorization

- **Technical Indicators**: The `signal-bridge` uses AVX2/AVX512 instructions (via PyO3/NumPy) for high-speed feature calculation across symbols.

## 2. System Level Tuning

### 2.1 CPU Affinity (Pinning)

For maximum consistency, pin services to dedicated physical cores:

```bash
# Pin market-data to core 0
taskset -cp 0 $(pgrep market-data)
```

### 2.2 Network Stack (Linux)

Optimize the kernel buffer for high-frequency WebSocket data:

```bash
sudo sysctl -w net.core.rmem_max=26214400
sudo sysctl -w net.core.wmem_max=26214400
```

### 2.3 Cargo Configuration

The production build uses specialized profile settings in `rust/Cargo.toml`:

```toml
[profile.release]
lto = "fat"
codegen-units = 1
panic = "abort"
opt-level = 3
```

## 3. Benchmarking Strategy

### 3.1 Criterion Benchmarks

Run micro-benchmarks for individual indicators:

```bash
cd rust
cargo bench -p signal-bridge
```

### 3.2 Soak Testing

Verify long-term stability and memory safety:

```bash
python ops/scripts/run_go_soak_test.py
```

---
**Maintained By**: Engineering Team
**Status**: Authoritative Reference
