import time
import sys
from pathlib import Path

import pandas as pd
import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[2]
SRC_ROOT = REPO_ROOT / "src"
if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))

from data.features import FeatureEngine


RUST_MIN_BATCH_SIZE = 1_000


def generate_market_data(num_bars: int) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    dates = pd.date_range('2024-01-01', periods=num_bars, freq='min')
    close = rng.uniform(100, 200, num_bars)
    return pd.DataFrame({
        'open': close * rng.uniform(0.995, 1.005, num_bars),
        'high': close * rng.uniform(1.001, 1.025, num_bars),
        'low': close * rng.uniform(0.975, 0.999, num_bars),
        'close': close,
        'volume': rng.uniform(1000, 10000, num_bars),
    }, index=dates)


def rust_backend_available() -> bool:
    try:
        from bridge.rust_bridge import RustFeatureComputer

        computer = RustFeatureComputer()
        return hasattr(computer._computer, "compute_batch_named")
    except Exception:
        return False


def run_benchmark():
    print("=== Feature Backend Benchmark ===")
    
    sizes = [1_000, 10_000, 100_000]
    
    for size in sizes:
        print(f"\nDataset Size: {size:,} bars")
        data = generate_market_data(size)
        
        # Python Benchmark
        py_engine = FeatureEngine(feature_backend="python")
        start_time = time.perf_counter()
        _ = py_engine.create_features(data)
        py_time = (time.perf_counter() - start_time) * 1000
        print(f"  Python Baseline: {py_time:.2f} ms")
        
        # Rust Benchmark
        if not rust_backend_available():
            print("  Rust backend not available or missing Phase 1 methods.")
            continue

        rust_engine = FeatureEngine(feature_backend="rust", rust_fallback_to_python=False)
        start_time = time.perf_counter()
        _ = rust_engine.create_features(data)
        rust_time = (time.perf_counter() - start_time) * 1000
        wrapper_time = rust_engine.rust_feature_computer.last_batch_wrapper_time_ms
        compute_boundary_time = rust_engine.rust_feature_computer.last_batch_compute_time_ms
        boundary_overhead = max(wrapper_time - (compute_boundary_time or 0.0), 0.0)

        print(f"  Rust Pipeline (incl. FFI): {rust_time:.2f} ms")
        print(f"  Rust wrapper time: {wrapper_time:.2f} ms")
        print(f"  Rust compute boundary time: {compute_boundary_time:.2f} ms")
        print(f"  Estimated FFI/object overhead: {boundary_overhead:.2f} ms")
        print(f"  Speedup: {py_time / rust_time:.2f}x")
        if size < RUST_MIN_BATCH_SIZE and rust_time > py_time:
            print("  Recommendation: keep Python for sub-1k batches.")

if __name__ == "__main__":
    run_benchmark()
