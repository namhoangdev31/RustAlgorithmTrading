# Python-Rust Integration Layer: FFI & NumPy Contract
## Phase 3.5 Production Standard

**Document Version:** 1.6.0 (Phase 3.5 Hardened)
**Updated:** 2026-05-10
**Status:** Production Ready

---

## 1. Architectural Overview

The integration layer bridges the **Python Research/ML** runtime with the **Rust Execution Kernel**. It provides two primary communication channels:
1.  **FFI (PyO3 + NumPy)**: High-performance, zero-copy data transfer for feature engineering and indicator calculation.
2.  **Messaging (ZeroMQ)**: Asynchronous event flow for signals, orders, and market data.

## 2. FFI Columnar Redesign (NumPy Contract)

To eliminate serialization bottlenecks, the system uses a columnar FFI contract based on NumPy arrays.

### 2.1 Component: `signal-bridge`

The `signal-bridge` component in Rust provides the core FFI bindings.

**Rust Implementation (`rust/signal-bridge/src/features.rs`):**
```rust
#[pyfunction]
pub fn compute_features<'py>(
    py: Python<'py>,
    prices: PyReadonlyArray1<f64>,
    volumes: PyReadonlyArray1<f64>,
) -> PyResult<&'py PyArray2<f64>> {
    // Zero-copy access to NumPy memory
    let price_slice = prices.as_slice()?;

    // Feature computation logic...
    let results = vec![0.0; price_slice.len() * NUM_FEATURES];

    Ok(PyArray2::from_vec(py, (price_slice.len(), NUM_FEATURES), results))
}
```

### 2.2 Memory Safety & Performance
-   **Zero-Copy**: Data is read directly from Python's memory space using the NumPy C-API.
-   **Thread Safety**: Rust respects Python's Global Interpreter Lock (GIL) via PyO3 but offloads heavy computation to separate threads where possible.
-   **Columnar Layout**: Optimized for CPU cache locality and SIMD instructions.

## 3. ZeroMQ Message Protocol

For asynchronous communication, the system uses **JSON-over-ZMQ** with a consistent envelope pattern.

### 3.1 Topic Strategy
| Topic | Purpose | Flow |
| :--- | :--- | :--- |
| `market.data` | Real-time ticks and bars | Rust → Python |
| `signals` | Trading signals from ML models | Python → Rust |
| `fills` | Order execution reports | Rust → Python |
| `metrics` | Operational telemetry | All → Go |

### 3.2 Signal Schema (Python → Rust)
```json
{
  "strategy_id": "momentum_v1",
  "symbol": "AAPL",
  "action": "BUY",
  "quantity": 100,
  "confidence": 0.85,
  "metadata": {
    "model_version": "v1.2.0",
    "feature_set": "alpha_101"
  }
}
```

## 4. Operational Best Practices

1.  **Keep Logic in Rust**: Technical indicators and data normalization should reside in Rust to minimize GIL contention.
2.  **Batch FFI Calls**: Avoid frequent small FFI calls; instead, pass large NumPy arrays for batch processing.
3.  **Idempotent Signals**: Every signal must include a unique timestamp and strategy ID to prevent double-execution.
4.  **Schema Enforcement**: Use Type Stubs (`.pyi`) in Python to ensure type safety when calling Rust bindings.