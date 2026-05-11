# Machine Learning Trading Strategy Implementation Guide
## Phase 3.5 Tri-Runtime Standard

This guide provides comprehensive documentation for implementing and deploying machine learning-based trading strategies within the Tri-Runtime (Rust/Python/Go) platform.

---

## 1. Architecture Overview

The ML module is designed for **Research in Python, Execution in Rust**.

```
src/strategies/ml/
├── features/                   # Feature Engineering (Vectorized)
│   └── feature_engineering.py  # Main pipeline
├── models/                     # Model Definitions
│   ├── base_model.py          # Abstract base
│   ├── price_predictor.py     # Regression
│   └── trend_classifier.py    # Classification
├── validation/                 # Quality Assurance
│   ├── model_validator.py     # Walk-forward validation
│   ├── drift_detector.py      # Feature/Prediction drift detection
│   └── live_monitor.py        # Real-time performance tracking
└── examples/                   # Reference Implementations
```

---

## 2. Feature Engineering Pipeline

The system uses a vectorized pipeline to transform OHLCV data into signals.

### Columnar FFI Optimization
Features prepared in Python are passed to the Rust kernel via the **Columnar FFI Bridge**. It is critical that feature names remain consistent between the model training phase and the live execution phase.

```python
from src.strategies.ml.features import FeatureEngineer, FeatureConfig

config = FeatureConfig(
    lookback_periods=[10, 20, 50],
    technical_indicators=['rsi', 'macd', 'bbands'],
    scaling_method='standard'
)

fe = FeatureEngineer(config)
features_df = fe.engineer_features(ohlcv_data)
```

---

## 3. Model Training & Persistence

### Training with Walk-Forward Validation
We strictly enforce **Walk-Forward Validation** to prevent lookahead bias and simulate real-world retraining cycles.

```python
from src.strategies.ml.models.trend_classifier import TrendClassifier
from src.strategies.ml.validation.model_validator import ModelValidator

model = TrendClassifier(model_type='gradient_boosting')
validator = ModelValidator()

# Perform time-series aware validation
results = validator.validate_model(model, X, y, method='walk_forward')
```

### Model Artifacts
Trained models are saved to `src/models/` using a combination of `joblib` for weights and `JSON` for metadata (features, parameters, version).

---

## 4. Operational Monitoring

Phase 3.5 introduces two critical operational components:

### A. Drift Detection (`drift_detector.py`)
Monitors the distribution of incoming market data against the training distribution (Kolmogorov-Smirnov test). If drift exceeds thresholds, an alert is pushed to the Go Control Plane.

### B. Live Performance Monitoring (`live_monitor.py`)
Tracks the real-time "Realized vs Predicted" accuracy. Significant degradation triggers an automatic circuit breaker halt in the Rust Execution Engine.

---

## 5. Deployment Checklist

1. **Feature Parity**: Ensure the same technical indicators are enabled in `config.yaml`.
2. **Model Versioning**: Match the model ID in the `Strategy` configuration.
3. **ZMQ Contract**: Verify that the signal frame schema matches the `ZMQ_PROTOCOL.md`.
4. **Risk Limits**: Ensure `RiskConfig` in Rust accounts for the ML model's expected volatility.

---
**Architect**: Antigravity AI
**Updated**: May 11, 2026