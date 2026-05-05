# Scripts Inventory (Production-Only)

Updated: 2026-05-05

This directory is organized for active runtime/operations tooling only.
Weekly verifier/audit lifecycle scripts are intentionally removed from active inventory.

## 1) Core Startup

- `scripts/start_trading_system.sh` — Start core services in dependency order
- `scripts/stop_trading_system.sh` — Graceful shutdown for core services
- `scripts/start_trading.sh` — Runtime bootstrap flow
- `scripts/start_services.sh` / `scripts/stop_services.sh` — Service orchestration helpers
- `scripts/autonomous_trading_system.sh` — Autonomous run profile

## 2) Observability

- `scripts/start_observability.sh` — Launch observability stack
- `scripts/start_observability_api.py` — Observability API runtime
- `scripts/start-with-observability.sh` — Combined startup path with monitoring
- `scripts/health_check.sh` — Health and status checks

## 3) Maintenance

- `scripts/setup.sh` — Environment setup
- `scripts/install_dependencies.sh` — Dependencies bootstrap
- `scripts/check_dependencies.sh` — Dependency validation
- `scripts/setup_python_deps.sh` — Python dependency helper
- `scripts/cleanup_venv.sh` — Virtual environment cleanup
- `scripts/migrate_to_native_filesystem.sh` — Environment migration helper

## 4) Data & Backtesting

- `scripts/download_market_data.py` — Market data ingestion
- `scripts/download_historical_data.py` — Historical data retrieval
- `scripts/run_router_backtest.py` — Router strategy backtest
- `scripts/run_ml_backtest.py` — ML backtest path
- `scripts/run_optimized_backtest.py` — Optimized backtest path
- `scripts/run_data_tests.sh` — Data-focused checks

## Usage Notes

- Run scripts from `[REPO_ROOT]`.
- Ensure `.env` and `config/` are set before startup.
- Use `scripts/health_check.sh` after any startup/change operation.

## Removed from Active Inventory

- Weekly verifier scripts (`verify_w*.py`)
- Governance verifier (`verify_governance_gate.py`)
- Audit helper scripts (`audit_*`, `compliance_audit.sh`, `contract_audit.sh`)
- Archived script bundles under `scripts/archived/`
