# ML Trading Strategy - Quick Start
## Get started in 5 minutes (Phase 3.5)

### 1. Environment Setup
We recommend using `uv` for fast dependency management.

```bash
# Sync dependencies
uv sync

# Verify ML components
pytest tests/ml/ -v
```

### 2. Run the Reference Strategy
The project includes a complete end-to-end example that generates synthetic data, trains a model, and performs a backtest.

```bash
python src/strategies/ml/examples/ml_strategy_example.py
```

### 3. Core Implementation Pattern
To build your own strategy, follow the `FeatureEngineer` -> `Model` -> `SignalFrame` pattern.

```python
import pandas as pd
from src.strategies.ml.features.feature_engineering import FeatureEngineer
from src.strategies.ml.models.trend_classifier import TrendClassifier

# 1. Prepare Data
df = pd.read_csv("your_data.csv")
fe = FeatureEngineer()
features = fe.engineer_features(df)
X, y = fe.prepare_ml_dataset(features)

# 2. Train
model = TrendClassifier(model_type="random_forest")
model.train(X, y)

# 3. Generate Signal Frame
# This frame is compatible with the Rust Simulation Kernel
signals = model.generate_signal_frame(df)
```

### 4. Integration with Rust Kernel
To use your ML model in production:
1. Save the model to `src/models/my_model.joblib`.
2. Configure your strategy in `config/strategies.yaml` to point to this model.
3. The **Rust Signal Bridge** will automatically load the model for inference.

---
**Architect**: Antigravity AI
**Updated**: May 11, 2026