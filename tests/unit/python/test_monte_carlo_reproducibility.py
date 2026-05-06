import numpy as np
import pytest

from simulations.monte_carlo import MonteCarloSimulator


def _require_signal_bridge():
    try:
        from signal_bridge import FeatureComputer

        computer = FeatureComputer()
        if not hasattr(computer, "simulate_price_paths"):
            pytest.skip("Rust signal_bridge is installed but lacks Phase 1 simulate_price_paths")
    except Exception as exc:
        pytest.skip(f"Rust signal_bridge not available: {exc}")


def test_python_monte_carlo_reproducibility():
    sim1 = MonteCarloSimulator(num_simulations=100, random_seed=42, numeric_backend="numpy")
    paths1 = sim1.simulate_price_paths(100.0, 50, 0.05, 0.2)

    sim2 = MonteCarloSimulator(num_simulations=100, random_seed=42, numeric_backend="numpy")
    paths2 = sim2.simulate_price_paths(100.0, 50, 0.05, 0.2)

    np.testing.assert_array_equal(paths1, paths2)


def test_rust_monte_carlo_reproducibility():
    _require_signal_bridge()

    sim1 = MonteCarloSimulator(
        num_simulations=100,
        random_seed=42,
        numeric_backend="rust",
        rust_fallback_to_numpy=False,
    )
    paths1 = sim1.simulate_price_paths(100.0, 50, 0.05, 0.2)

    sim2 = MonteCarloSimulator(
        num_simulations=100,
        random_seed=42,
        numeric_backend="rust",
        rust_fallback_to_numpy=False,
    )
    paths2 = sim2.simulate_price_paths(100.0, 50, 0.05, 0.2)

    np.testing.assert_array_equal(paths1, paths2)


def test_rust_numpy_statistical_parity():
    _require_signal_bridge()

    sim_np = MonteCarloSimulator(num_simulations=20_000, random_seed=42, numeric_backend="numpy")
    paths_np = sim_np.simulate_price_paths(100.0, 252, 0.05, 0.2)

    sim_rust = MonteCarloSimulator(
        num_simulations=20_000,
        random_seed=42,
        numeric_backend="rust",
        rust_fallback_to_numpy=False,
    )
    paths_rust = sim_rust.simulate_price_paths(100.0, 252, 0.05, 0.2)

    terminal_np = paths_np[:, -1]
    terminal_rust = paths_rust[:, -1]

    np.testing.assert_allclose(np.mean(terminal_rust), np.mean(terminal_np), rtol=0.03)
    np.testing.assert_allclose(np.std(terminal_rust), np.std(terminal_np), rtol=0.05)
    np.testing.assert_allclose(
        np.percentile(terminal_rust, [5, 50, 95]),
        np.percentile(terminal_np, [5, 50, 95]),
        rtol=0.05,
    )


def test_monte_carlo_rejects_seed_outside_u64():
    with pytest.raises(ValueError, match="u64"):
        MonteCarloSimulator(random_seed=-1)
