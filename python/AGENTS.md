# Python Agent

Owns `python/src`, `python/tests`, `python/pyproject.toml`, and Python dependency files.

Use this agent for Alpaca API adapters, data loading, indicators, strategy logic, backtesting, Python observability, and Python-Rust bridge wrappers.

Validate with:

```bash
cd python && python -m pytest tests -q
```

For targeted work, prefer the nearest test under `python/tests`.
