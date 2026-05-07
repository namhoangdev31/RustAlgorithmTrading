use crate::backtest_runtime::BacktestRuntime as RustBacktestRuntime;
use crate::features::FeatureEngine;
use crate::indicators::{calculate_momentum_simd, calculate_returns_simd, EMA, MACD, RSI, SMA};
use numpy::{IntoPyArray, PyReadonlyArray1};
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::PyDict;
use std::time::Instant;

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
    #[pyo3(signature = (open, high, low, close, volume, timestamp=None))]
    pub fn compute_batch_named<'py>(
        &self,
        py: Python<'py>,
        open: PyReadonlyArray1<'_, f64>,
        high: PyReadonlyArray1<'_, f64>,
        low: PyReadonlyArray1<'_, f64>,
        close: PyReadonlyArray1<'_, f64>,
        volume: PyReadonlyArray1<'_, f64>,
        timestamp: Option<PyReadonlyArray1<'_, i64>>,
    ) -> PyResult<(Bound<'py, PyDict>, f64)> {
        let open = open
            .as_slice()
            .map_err(|_| PyValueError::new_err("open must be contiguous float64"))?;
        let high = high
            .as_slice()
            .map_err(|_| PyValueError::new_err("high must be contiguous float64"))?;
        let low = low
            .as_slice()
            .map_err(|_| PyValueError::new_err("low must be contiguous float64"))?;
        let close = close
            .as_slice()
            .map_err(|_| PyValueError::new_err("close must be contiguous float64"))?;
        let volume = volume
            .as_slice()
            .map_err(|_| PyValueError::new_err("volume must be contiguous float64"))?;

        let n = close.len();
        if open.len() != n || high.len() != n || low.len() != n || volume.len() != n {
            return Err(PyValueError::new_err(
                "open/high/low/close/volume must have the same length",
            ));
        }
        if n == 0 {
            return Err(PyValueError::new_err("input arrays cannot be empty"));
        }

        if let Some(ts) = timestamp {
            let ts = ts
                .as_slice()
                .map_err(|_| PyValueError::new_err("timestamp must be contiguous int64"))?;
            if ts.len() != n {
                return Err(PyValueError::new_err(
                    "timestamp must have same length as price arrays",
                ));
            }
        }

        for i in 0..n {
            if !open[i].is_finite()
                || !high[i].is_finite()
                || !low[i].is_finite()
                || !close[i].is_finite()
                || !volume[i].is_finite()
            {
                return Err(PyValueError::new_err(format!(
                    "non-finite OHLCV value at index {}",
                    i
                )));
            }
            if close[i] <= 0.0 {
                return Err(PyValueError::new_err(format!(
                    "close must be positive at index {}",
                    i
                )));
            }
        }

        let compute_start = Instant::now();
        let returns = calculate_returns_simd(close);
        let momentum_10 = calculate_momentum_simd(close, 10);

        let mut log_returns = vec![0.0; n];
        let mut momentum = vec![0.0; n];
        let mut range_pct = vec![0.0; n];

        for i in 0..n {
            if i > 0 && i <= returns.len() {
                log_returns[i] = returns[i - 1];
            }
            if i >= 10 && (i - 10) < momentum_10.len() {
                momentum[i] = momentum_10[i - 10];
            }
            range_pct[i] = (high[i] - low[i]) / close[i] * 100.0;
        }

        let compute_time_ms = compute_start.elapsed().as_secs_f64() * 1000.0;

        let dict = PyDict::new_bound(py);
        dict.set_item("close", close.to_vec().into_pyarray_bound(py))?;
        dict.set_item("log_returns", log_returns.into_pyarray_bound(py))?;
        dict.set_item("momentum_10", momentum.into_pyarray_bound(py))?;
        dict.set_item("volume", volume.to_vec().into_pyarray_bound(py))?;
        dict.set_item("range_pct", range_pct.into_pyarray_bound(py))?;

        Ok((dict, compute_time_ms))
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


#[pyclass]
pub struct BacktestRuntime {
    inner: RustBacktestRuntime,
}

#[pymethods]
impl BacktestRuntime {
    #[new]
    #[pyo3(signature = (initial_capital, symbols, max_position_size=10000.0, max_notional_exposure=50000.0, max_open_positions=5, stop_loss_percent=2.0, max_loss_threshold=500.0, seed=42))]
    pub fn new(
        initial_capital: f64,
        symbols: Vec<String>,
        max_position_size: f64,
        max_notional_exposure: f64,
        max_open_positions: usize,
        stop_loss_percent: f64,
        max_loss_threshold: f64,
        seed: u64,
    ) -> Self {
        let risk_config = common::config::RiskConfig {
            max_position_size,
            max_notional_exposure,
            max_open_positions,
            stop_loss_percent,
            trailing_stop_percent: 1.0,
            enable_circuit_breaker: true,
            max_loss_threshold,
        };

        Self {
            inner: RustBacktestRuntime::new(initial_capital, symbols, risk_config, seed),
        }
    }

    pub fn ingest_bar(
        &mut self,
        symbol: String,
        timestamp: i64,
        open: f64,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
    ) {
        self.inner
            .ingest_bar(symbol, timestamp, open, high, low, close, volume);
    }

    #[pyo3(signature = (initial_capital, symbols, max_position_size=10000.0, max_notional_exposure=50000.0, max_open_positions=5, stop_loss_percent=2.0, max_loss_threshold=500.0, seed=42))]
    pub fn init_state(
        &mut self,
        initial_capital: f64,
        symbols: Vec<String>,
        max_position_size: f64,
        max_notional_exposure: f64,
        max_open_positions: usize,
        stop_loss_percent: f64,
        max_loss_threshold: f64,
        seed: u64,
    ) {
        let risk_config = common::config::RiskConfig {
            max_position_size,
            max_notional_exposure,
            max_open_positions,
            stop_loss_percent,
            trailing_stop_percent: 1.0,
            enable_circuit_breaker: true,
            max_loss_threshold,
        };

        self.inner
            .init_state(initial_capital, symbols, risk_config, seed);
    }

    pub fn process_signal(
        &mut self,
        symbol: String,
        signal_type: String,
        strength: f64,
        strategy_id: String,
    ) {
        self.inner
            .process_signal(symbol, signal_type, strength, strategy_id);
    }

    pub fn dispatch_until_idle(&mut self) {
        self.inner.dispatch_until_idle();
    }

    pub fn get_new_fills(&mut self, py: Python) -> PyResult<PyObject> {
        let fills = self.inner.get_new_fills();
        let json_str = serde_json::to_string(&fills).map_err(|e| PyValueError::new_err(e.to_string()))?;
        
        let json_mod = py.import_bound("json")?;
        let dict = json_mod.call_method1("loads", (json_str,))?;
        Ok(dict.to_object(py))
    }

    pub fn get_new_risk_decisions(&mut self, py: Python) -> PyResult<PyObject> {
        let decisions = self.inner.get_new_risk_decisions();
        let json_str =
            serde_json::to_string(&decisions).map_err(|e| PyValueError::new_err(e.to_string()))?;

        let json_mod = py.import_bound("json")?;
        let parsed = json_mod.call_method1("loads", (json_str,))?;
        Ok(parsed.to_object(py))
    }

    pub fn state_snapshot(&self, py: Python) -> PyResult<PyObject> {
        let snapshot = self.inner.state_snapshot();
        let json_str = snapshot.to_string();
        
        // Convert JSON string to Python dict via json.loads
        let json_mod = py.import_bound("json")?;
        let dict = json_mod.call_method1("loads", (json_str,))?;
        Ok(dict.to_object(py))
    }

    pub fn execution_stats_snapshot(&self, py: Python) -> PyResult<PyObject> {
        let snapshot = self.inner.execution_stats_snapshot();
        let json_str = snapshot.to_string();

        let json_mod = py.import_bound("json")?;
        let dict = json_mod.call_method1("loads", (json_str,))?;
        Ok(dict.to_object(py))
    }

    pub fn reset(&mut self, seed: u64) {
        self.inner.reset(seed);
    }

    pub fn get_equity(&self) -> f64 {
        self.inner.get_equity()
    }
}

/// Python module initialization
#[pymodule]
fn signal_bridge(_py: Python, m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_class::<FeatureComputer>()?;
    m.add_class::<Bar>()?;
    m.add_class::<BacktestRuntime>()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::FeatureComputer;
    use numpy::{PyArray1, PyArrayMethods};
    use pyo3::exceptions::PyModuleNotFoundError;
    use pyo3::prelude::{PyAnyMethods, PyDictMethods, PyStringMethods};
    use pyo3::types::PyModule;
    use pyo3::{PyErr, Python};
    use std::sync::Once;

    fn ensure_python_initialized() {
        static INIT: Once = Once::new();
        INIT.call_once(pyo3::prepare_freethreaded_python);
    }

    fn skip_if_numpy_unavailable(py: Python<'_>) -> bool {
        match PyModule::import_bound(py, "numpy") {
            Ok(_) => false,
            Err(err) => {
                if err.is_instance_of::<PyModuleNotFoundError>(py) {
                    eprintln!(
                        "skipping numpy-dependent test: NumPy is unavailable in current Python runtime ({})",
                        format_pyerr(py, err)
                    );
                    true
                } else {
                    panic!("unexpected Python import error while checking numpy: {}", format_pyerr(py, err));
                }
            }
        }
    }

    fn format_pyerr(py: Python<'_>, err: PyErr) -> String {
        match err.value_bound(py).str() {
            Ok(s) => s.to_string_lossy().to_string(),
            Err(_) => "unprintable python error".to_string(),
        }
    }

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

    #[test]
    fn compute_batch_named_rejects_mismatch_lengths() {
        let computer = FeatureComputer::new();
        ensure_python_initialized();
        Python::with_gil(|py| {
            if skip_if_numpy_unavailable(py) {
                return;
            }
            let open = PyArray1::from_vec_bound(py, vec![1.0, 2.0]);
            let high = PyArray1::from_vec_bound(py, vec![1.1, 2.1]);
            let low = PyArray1::from_vec_bound(py, vec![0.9, 1.9]);
            let close = PyArray1::from_vec_bound(py, vec![1.0]);
            let volume = PyArray1::from_vec_bound(py, vec![10.0, 20.0]);
            let result = computer.compute_batch_named(
                py,
                open.readonly(),
                high.readonly(),
                low.readonly(),
                close.readonly(),
                volume.readonly(),
                None,
            );
            assert!(result.is_err());
        });
    }

    #[test]
    fn compute_batch_named_rejects_non_positive_close() {
        let computer = FeatureComputer::new();
        ensure_python_initialized();
        Python::with_gil(|py| {
            if skip_if_numpy_unavailable(py) {
                return;
            }
            let open = PyArray1::from_vec_bound(py, vec![1.0, 2.0]);
            let high = PyArray1::from_vec_bound(py, vec![1.1, 2.1]);
            let low = PyArray1::from_vec_bound(py, vec![0.9, 1.9]);
            let close = PyArray1::from_vec_bound(py, vec![1.0, 0.0]);
            let volume = PyArray1::from_vec_bound(py, vec![10.0, 20.0]);
            let result = computer.compute_batch_named(
                py,
                open.readonly(),
                high.readonly(),
                low.readonly(),
                close.readonly(),
                volume.readonly(),
                None,
            );
            assert!(result.is_err());
        });
    }

    #[test]
    fn compute_batch_named_returns_expected_columns() {
        let computer = FeatureComputer::new();
        ensure_python_initialized();
        Python::with_gil(|py| {
            if skip_if_numpy_unavailable(py) {
                return;
            }
            let open = PyArray1::from_vec_bound(py, vec![100.0, 101.0, 102.0, 103.0, 104.0, 105.0]);
            let high = PyArray1::from_vec_bound(py, vec![101.0, 102.0, 103.0, 104.0, 105.0, 106.0]);
            let low = PyArray1::from_vec_bound(py, vec![99.0, 100.0, 101.0, 102.0, 103.0, 104.0]);
            let close = PyArray1::from_vec_bound(py, vec![100.0, 101.0, 102.0, 103.0, 104.0, 105.0]);
            let volume = PyArray1::from_vec_bound(py, vec![10.0, 11.0, 12.0, 13.0, 14.0, 15.0]);

            let (out, compute_ms) = computer
                .compute_batch_named(
                    py,
                    open.readonly(),
                    high.readonly(),
                    low.readonly(),
                    close.readonly(),
                    volume.readonly(),
                    None,
                )
                .unwrap();

            assert!(out.contains("close").unwrap());
            assert!(out.contains("log_returns").unwrap());
            assert!(out.contains("momentum_10").unwrap());
            assert!(out.contains("volume").unwrap());
            assert!(out.contains("range_pct").unwrap());
            assert!(compute_ms >= 0.0);
        });
    }
}
