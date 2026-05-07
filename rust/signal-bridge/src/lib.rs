pub mod bridge;
pub mod backtest_runtime;
/// Signal Bridge Component
///
/// Bridges Python ML models with Rust for feature engineering.
/// Provides PyO3 bindings for Python to call Rust feature computation.
pub mod features;
pub mod indicators;

pub use features::FeatureEngine;
pub use indicators::*;

use common::Result;

/// Main signal bridge service
pub struct SignalBridgeService {
    #[allow(dead_code)]
    feature_engine: FeatureEngine,
}

impl SignalBridgeService {
    pub fn new(_config: common::config::SignalConfig) -> Result<Self> {
        let feature_engine = FeatureEngine::new();

        Ok(Self { feature_engine })
    }
}

// PyO3 module is defined in bridge.rs to avoid duplicate symbols
