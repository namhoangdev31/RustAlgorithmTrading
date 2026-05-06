use crate::features::FeatureEngine;
use crate::indicators::{calculate_momentum_simd, calculate_returns_simd, EMA, MACD, RSI, SMA};
use numpy::PyReadonlyArray1;
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::PyDict;

#[pyclass]
#[derive(Clone)]
pub struct Bar {
    #[pyo3(get, set)]
    pub symbol: String,
    #[pyo3(get, set)]
    pub open: f64,
    #[pyo3(get, set)]
    pub high: f64,
    #[pyo3(get, set)]
    pub low: f64,
    #[pyo3(get, set)]
    pub close: f64,
    #[pyo3(get, set)]
    pub volume: f64,
    #[pyo3(get, set)]
    pub timestamp: i64,
}

#[pymethods]
impl Bar {
    #[new]
    fn new(
        symbol: String,
        open: f64,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
        timestamp: i64,
    ) -> Self {
        Self {
            symbol,
            open,
            high,
            low,
            close,
            volume,
            timestamp,
        }
    }
}

#[pyclass]
pub struct FeatureComputer {
    _engine: FeatureEngine,
    rsi: RSI,
    macd: MACD,
    ema_fast: EMA,
    ema_slow: EMA,
    sma: SMA,
}

impl Default for FeatureComputer {
    fn default() -> Self {
        Self {
            _engine: FeatureEngine::new(),
            rsi: RSI::new(14),
            macd: MACD::new(12, 26, 9),
            ema_fast: EMA::new(12),
            ema_slow: EMA::new(26),
            sma: SMA::new(20),
        }
    }
}

#[pymethods]
impl FeatureComputer {
    #[new]
    pub fn new() -> Self {
        Self::default()
    }

    /// Compute features from a single bar (streaming mode)
    pub fn compute_streaming(&mut self, bar: &Bar) -> PyResult<Vec<f64>> {
        let close = bar.close;

        let mut features = Vec::with_capacity(10);

        // Price-based features
        features.push(close);

        // RSI
        if let Some(rsi_value) = self.rsi.update(close) {
            features.push(rsi_value);
        } else {
            features.push(50.0); // Neutral value when not enough data
        }

        // MACD
        let (macd_line, signal_line, histogram) = self.macd.update(close);
        features.push(macd_line);
        features.push(signal_line);
        features.push(histogram);

        // EMAs
        let ema_fast = self.ema_fast.update(close);
        let ema_slow = self.ema_slow.update(close);
        features.push(ema_fast);
        features.push(ema_slow);
        features.push(ema_fast - ema_slow); // EMA spread

        // SMA
        if let Some(sma_value) = self.sma.update(close) {
            features.push(sma_value);
            features.push((close - sma_value) / sma_value * 100.0); // Distance from SMA
        } else {
            features.push(close);
            features.push(0.0);
        }

        // Volume features
        features.push(bar.volume);
        features.push((bar.high - bar.low) / close * 100.0); // Range %

        Ok(features)
    }

    /// Compute features in batch using columnar NumPy arrays
    #[pyo3(signature = (open, high, low, close, volume))]
    pub fn compute_batch_columnar<'py>(
        &self,
        py: Python<'py>,
        open: PyReadonlyArray1<'_, f64>,
        high: PyReadonlyArray1<'_, f64>,
        low: PyReadonlyArray1<'_, f64>,
        close: PyReadonlyArray1<'_, f64>,
        volume: PyReadonlyArray1<'_, f64>,
    ) -> PyResult<Bound<'py, PyDict>> {
        use numpy::IntoPyArray;
        use pyo3::types::PyDict;

        let open_view = open.as_array();
        let high_view = high.as_array();
        let low_view = low.as_array();
        let close_view = close.as_array();
        let volume_view = volume.as_array();

        let n = close_view.len();
        if open_view.len() != n
            || high_view.len() != n
            || low_view.len() != n
            || volume_view.len() != n
        {
            return Err(PyValueError::new_err(
                "Input arrays must have the same length",
            ));
        }

        if n == 0 {
            let dict = PyDict::new_bound(py);
            return Ok(dict);
        }

        // Convert to Vec for SIMD kernels
        let close_vec = close_view.to_vec();
        let returns = calculate_returns_simd(&close_vec);
        let momentum_10 = calculate_momentum_simd(&close_vec, 10);

        let mut log_returns_vec = vec![0.0; n];
        let mut momentum_10_vec = vec![0.0; n];
        let mut range_pct_vec = vec![0.0; n];

        for i in 0..n {
            if i > 0 && i <= returns.len() {
                log_returns_vec[i] = returns[i - 1];
            }
            if i >= 10 && (i - 10) < momentum_10.len() {
                momentum_10_vec[i] = momentum_10[i - 10];
            }
            range_pct_vec[i] = (high_view[i] - low_view[i]) / close_view[i] * 100.0;
        }

        let dict = PyDict::new_bound(py);
        dict.set_item("close", close_view.to_owned().into_pyarray_bound(py))?;
        dict.set_item("log_returns", log_returns_vec.into_pyarray_bound(py))?;
        dict.set_item("momentum_10", momentum_10_vec.into_pyarray_bound(py))?;
        dict.set_item("volume", volume_view.to_owned().into_pyarray_bound(py))?;
        dict.set_item("range_pct", range_pct_vec.into_pyarray_bound(py))?;

        Ok(dict)
    }

    #[pyo3(signature = (initial_price, num_days, mu, sigma, num_paths, seed))]
    pub fn simulate_price_paths(
        &self,
        initial_price: f64,
        num_days: usize,
        mu: f64,
        sigma: f64,
        num_paths: usize,
        seed: u64,
    ) -> PyResult<Vec<Vec<f64>>> {
        use rand::SeedableRng;
        use rand_chacha::ChaCha8Rng;
        use rand_distr::{Distribution, Normal};

        if !initial_price.is_finite() || initial_price <= 0.0 {
            return Err(PyValueError::new_err(
                "initial_price must be finite and positive",
            ));
        }
        if !mu.is_finite() {
            return Err(PyValueError::new_err("mu must be finite"));
        }
        if !sigma.is_finite() || sigma < 0.0 {
            return Err(PyValueError::new_err(
                "sigma must be finite and non-negative",
            ));
        }
        if num_paths == 0 {
            return Err(PyValueError::new_err("num_paths must be positive"));
        }

        let mut rng = ChaCha8Rng::seed_from_u64(seed);
        let dt = 1.0 / 252.0;
        let drift = (mu - 0.5 * sigma * sigma) * dt;
        let diffusion = sigma * dt.sqrt();
        let normal = if diffusion > 0.0 {
            Some(Normal::new(drift, diffusion).map_err(|e| PyValueError::new_err(e.to_string()))?)
        } else {
            None
        };

        let mut all_paths = Vec::with_capacity(num_paths);

        for _ in 0..num_paths {
            let mut path = Vec::with_capacity(num_days + 1);
            path.push(initial_price);

            let mut current_price = initial_price;
            for _ in 0..num_days {
                let random_return: f64 = normal
                    .as_ref()
                    .map(|dist| dist.sample(&mut rng))
                    .unwrap_or(drift);
                current_price *= random_return.exp();
                path.push(current_price);
            }
            all_paths.push(path);
        }

        Ok(all_paths)
    }

    /// Compute market microstructure features
    pub fn compute_microstructure(
        &self,
        bid_price: f64,
        ask_price: f64,
        bid_depth: f64,
        ask_depth: f64,
    ) -> PyResult<Vec<f64>> {
        let mid_price = (bid_price + ask_price) / 2.0;
        let spread = ask_price - bid_price;
        let spread_bps = (spread / mid_price) * 10000.0;

        let total_depth = bid_depth + ask_depth;
        let depth_imbalance = if total_depth > 0.0 {
            (bid_depth - ask_depth) / total_depth
        } else {
            0.0
        };

        Ok(vec![
            spread,
            spread_bps,
            depth_imbalance,
            bid_depth,
            ask_depth,
            mid_price,
        ])
    }
}

/// Python module initialization
#[pymodule]
fn signal_bridge(_py: Python, m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_class::<FeatureComputer>()?;
    m.add_class::<Bar>()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::FeatureComputer;

    #[test]
    fn simulate_price_paths_is_deterministic_for_same_seed() {
        let computer = FeatureComputer::new();
        let first = computer
            .simulate_price_paths(100.0, 20, 0.05, 0.2, 50, 42)
            .unwrap();
        let second = computer
            .simulate_price_paths(100.0, 20, 0.05, 0.2, 50, 42)
            .unwrap();

        assert_eq!(first, second);
        assert_eq!(first.len(), 50);
        assert_eq!(first[0].len(), 21);
        assert_eq!(first[0][0], 100.0);
    }

    #[test]
    fn simulate_price_paths_rejects_invalid_numeric_parameters() {
        let computer = FeatureComputer::new();

        assert!(computer
            .simulate_price_paths(0.0, 20, 0.05, 0.2, 50, 42)
            .is_err());
        assert!(computer
            .simulate_price_paths(100.0, 20, 0.05, -0.2, 50, 42)
            .is_err());
        assert!(computer
            .simulate_price_paths(100.0, 20, 0.05, 0.2, 0, 42)
            .is_err());
    }
}
