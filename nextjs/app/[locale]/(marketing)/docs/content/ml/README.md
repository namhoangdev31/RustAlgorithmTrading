# Machine Learning Trading Strategies
## Phase 3.5 Tri-Runtime Standard

The machine learning layer provides advanced feature engineering and predictive models, tightly integrated with the Rust Trading Kernel for high-performance execution.

---

## 📁 ML Architecture

```
RustAlgorithmTrading/
├── python/src/strategies/ml/              # Strategy Logic (Python)
├── python/src/models/                     # Persisted Model Artifacts
├── python/src/data/features.py            # Feature Engineering Core
├── python/tests/ml/                       # Validation Suites
└── ops/config/ml/                      # Hyperparameters & Config
```

---

## ✨ Key Capabilities

### 1. Feature Engineering (`python/src/data/features.py`)
- **Technical Indicators**: 50+ indicators including momentum, volatility, and trend.
- **FFI-Optimized**: Features are prepared in Python and passed to Rust via the columnar FFI bridge.
- **Statistical Descriptors**: Moving averages, standard deviation, and volume-weighted metrics.

### 2. Predictive Models
- **Trend Classification**: Predicting market direction (Up/Down/Neutral) with confidence scoring.
- **Price Regression**: Predicting specific price targets for limit-order placement.
- **Ensemble Methods**: Utilizing Random Forest and Gradient Boosting for robust signal generation.

### 3. Validation Framework
- **Walk-Forward Validation**: Simulating production retraining cycles.
- **Monte Carlo Stress Testing**: Evaluating strategy robustness against randomized market noise.

---

## 🚀 Quick Start (Research Environment)

```python
from src.strategies.ml.trend_classifier import TrendClassifier
from src.data.fetcher import DataFetcher

# 1. Fetch Data
fetcher = DataFetcher()
data = fetcher.get_bars("AAPL", days=365)

# 2. Train Model
model = TrendClassifier(type="gradient_boosting")
model.fit(data)

# 3. Generate Signal Frame for Backtest
signals = model.generate_signal_frame(data)
```

---

## 🛠️ Production Deployment

ML signals are serialized to the **Signal Frame** format and pushed to the Rust Kernel:
1. **Model Loading**: Models are loaded from `python/src/models/`.
2. **Inference**: High-confidence signals are pushed via ZMQ to the Rust Signal Bridge.
3. **Execution**: Rust validates the signals against `RiskConfig` and executes via Alpaca.

---
**Architect**: Antigravity AI
**Updated**: May 11, 2026