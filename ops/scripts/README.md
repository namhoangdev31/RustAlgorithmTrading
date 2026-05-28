# Scripts Inventory (Production-Only)

Updated: 2026-05-05

This directory is organized for active runtime/operations tooling only.
Weekly verifier/audit lifecycle scripts are intentionally removed from active inventory.

## 1) Core Startup

- `ops/scripts/start_trading_system.sh` — Start core services in dependency order
- `ops/scripts/stop_trading_system.sh` — Graceful shutdown for core services
- `ops/scripts/start_trading.sh` — Runtime bootstrap flow
- `ops/scripts/start_services.sh` / `ops/scripts/stop_services.sh` — Service orchestration helpers
- `ops/scripts/autonomous_trading_system.sh` — Autonomous run profile

## 2) Observability

- `ops/scripts/start_observability.sh` — Launch observability stack
- `ops/scripts/start_go_observability.sh` — Observability API runtime
- `ops/scripts/start-with-observability.sh` — Combined startup path with monitoring
- `ops/scripts/health_check.sh` — Health and status checks

## 3) Maintenance

- `ops/scripts/setup.sh` — Environment setup
- `ops/scripts/install_dependencies.sh` — Dependencies bootstrap
- `ops/scripts/check_dependencies.sh` — Dependency validation
- `ops/scripts/setup_python_deps.sh` — Python dependency helper
- `ops/scripts/cleanup_venv.sh` — Virtual environment cleanup
- `ops/scripts/migrate_to_native_filesystem.sh` — Environment migration helper

## 4) Data & Backtesting

- `ops/scripts/download_market_data.py` — Market data ingestion
- `ops/scripts/download_historical_data.py` — Historical data retrieval
- `ops/scripts/run_router_backtest.py` — Router strategy backtest
- `ops/scripts/run_ml_backtest.py` — ML backtest path
- `ops/scripts/run_optimized_backtest.py` — Optimized backtest path
- `ops/scripts/run_soak_fault_tests.py` — Phase 2.2 Rust-only soak/stability gate harness (`S100K`)
- `ops/scripts/generate_golden_risk_baseline.py` — Generate the compact Phase 2.2 golden risk spec fixture
- `ops/scripts/run_data_tests.sh` — Data-focused checks

## 5) Phase 2 Promotion Gates

- `python/tests/benchmarks/backtest_engine_production_benchmark.py` — production-like Rust-only benchmark (`P10K`, `P100K`) against frozen Python baseline metrics
- `ops/scripts/run_soak_fault_tests.py` — long-run Rust-only stability gate with timeout/memory/fallback/reconciliation checks
- `tests/fixtures/phase2/python_baseline_metrics.json` — immutable benchmark baseline used for Rust speedup gates
- `tests/fixtures/phase2/risk_decision_golden.json` — immutable golden risk decision spec
- `docs/roadmap/PHASE2_GO_NO_GO_EVIDENCE.md` — canonical evidence checklist and verdict

## Usage Notes

- Run scripts from `[REPO_ROOT]`.
- Ensure `.env` and `ops/config/` are set before startup.
- Use `ops/scripts/health_check.sh` after any startup/change operation.

## Removed from Active Inventory

- Weekly verifier scripts (`verify_w*.py`)
- Governance verifier (`verify_governance_gate.py`)
- Audit helper scripts (`audit_*`, `compliance_audit.sh`, `contract_audit.sh`)
- Archived script bundles under `ops/scripts/archived/`
