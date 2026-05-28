# Ops Scripts

This folder is intentionally small. It keeps only local runtime helpers and data/backtest utilities that are still useful before everything is wrapped by Docker images and web-managed configuration.

## Runtime

- `check_dependencies.sh` - Validate local toolchain, manifests, config files, and writable runtime folders.
- `health_check.sh` - Print local process/config/log health without exposing secrets.
- `start_services.sh` - Build and start the Rust services locally.
- `stop_services.sh` - Stop local Rust services by process name.

## Data And Backtesting

- `download_market_data.py` - Market data ingestion helper.
- `download_historical_data.py` - Historical Alpaca data downloader.
- `run_router_backtest.py` - Strategy router backtest entry point.
- `run_ml_backtest.py` - ML backtest entry point.
- `run_optimized_backtest.py` - Optimized backtest entry point.
- `run_data_tests.sh` - Data-focused Python test runner.
- `run_go_soak_test.py` - Go API soak helper.
- `run_soak_fault_tests.py` - Rust soak/fault gate helper.
- `generate_golden_risk_baseline.py` - Generate the compact risk baseline fixture.

## Removed From Ops

The old staging Compose stack, Grafana, Prometheus, Alertmanager, load-test containers, autonomous launcher, and one-off development/bootstrap scripts were removed. Monitoring and user-facing configuration should live in the dedicated Go/Next.js web surface instead of `ops/`.
