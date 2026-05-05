# PLAYBOOK.md — Production Maintenance Map (Doc -> Code -> Test)

Updated: 2026-05-05  
Scope: Active runtime maintenance and feature-safe changes

This playbook is intentionally trimmed for production operation.
Weekly gate lifecycle references and legacy verifier/audit routes are removed.

## 1) Working Model

Use this order for non-trivial work:

1. `docs/DOCS_CANONICAL_MAP.md`
2. `README_VI.md` or `README.md`
3. This playbook
4. Owner module docs for the affected domain

Principles:

- Diagnose before edit.
- Patch minimal owner files first.
- Validate nearest tests first (unit -> integration -> e2e).
- Keep Python/Rust contract symmetry for cross-runtime changes.

## 2) Project Compass: What Owns What

### Python ownership (`src/`)

- `src/api/`: Alpaca client adapters, auth/rate-limit handling, paper trading glue
- `src/data/`: market data loader, preprocessing, features, indicators
- `src/strategies/`: signal logic and strategy router
- `src/backtesting/`: engine, execution simulation, portfolio/performance/metrics
- `src/bridge/`: Python side of bridge and messaging handoff
- `src/observability/`: API, logging, storage, metrics collectors
- `src/models/`, `src/utils/`: shared domain objects/utilities

### Rust ownership (`rust/*/src`)

- `rust/market-data`: websocket ingest, orderbook, aggregation, publish
- `rust/signal-bridge`: feature/indicator runtime and bridge transforms
- `rust/risk-manager`: limits, stops, pnl, circuit breaker
- `rust/execution-engine`: routing, retry, slippage, stop-loss execution
- `rust/database`: schema, migrations, models, query, connection
- `rust/common`: shared types, config, messaging, errors, health, metrics

### Test ownership (`tests/`)

- `tests/unit/`: component-level behavior
- `tests/integration/`: cross-module/cross-runtime flows
- `tests/e2e/`: full stack behavior
- `tests/observability/`: telemetry, API, storage behavior
- `tests/docs/`: testing strategy references

## 3) Documentation Ownership (Active)

### Canonical docs

- `docs/DOCS_CANONICAL_MAP.md` — canonical read map
- `docs/DOCUMENTATION_INDEX.md` — operational docs index
- `docs/index.md` — docs entrypoint
- `README.md`, `README_VI.md` — production overview and quick start

### Roadmap consolidation

- `docs/roadmap/FINAL_ROADMAP_SUMMARY.md` — static verdict matrix W01-W24 and post-roadmap model

### Runtime/ops docs

- `docs/operations/OPERATIONS_RUNBOOK.md`
- `docs/operations/DISASTER_RECOVERY.md`
- `docs/deployment/PRODUCTION_DEPLOYMENT.md`
- `docs/observability/BACKEND_API.md`
- `docs/API_DOCUMENTATION.md`
- `docs/api/ALPACA_API.md`
- `docs/api/ZMQ_PROTOCOL.md`

## 4) Scripts Ownership (Active Inventory)

### Core startup/control

- `scripts/start_trading_system.sh`
- `scripts/stop_trading_system.sh`
- `scripts/start_trading.sh`
- `scripts/start_services.sh`
- `scripts/stop_services.sh`
- `scripts/autonomous_trading_system.sh`

### Observability

- `scripts/start_observability.sh`
- `scripts/start_observability_api.py`
- `scripts/start-with-observability.sh`
- `scripts/health_check.sh`

### Maintenance

- `scripts/setup.sh`
- `scripts/install_dependencies.sh`
- `scripts/check_dependencies.sh`
- `scripts/setup_python_deps.sh`
- `scripts/cleanup_venv.sh`
- `scripts/migrate_to_native_filesystem.sh`

### Data/backtesting helpers

- `scripts/download_market_data.py`
- `scripts/download_historical_data.py`
- `scripts/run_router_backtest.py`
- `scripts/run_ml_backtest.py`
- `scripts/run_optimized_backtest.py`
- `scripts/run_data_tests.sh`

## 5) Fast Routing: Doc -> Code -> Test

| Task type | Read first | Inspect first | Validate first |
|---|---|---|---|
| Alpaca API/auth/rate-limit | `docs/api/ALPACA_API.md` | `src/api/alpaca_client.py`, `src/api/alpaca_paper_trading.py` | `tests/test_alpaca_*.py`, `tests/integration/test_alpaca_api.rs` |
| Python-Rust signal handoff | `docs/api/ZMQ_PROTOCOL.md`, `docs/architecture/python-rust-separation.md` | `src/bridge/`, `rust/signal-bridge/src/`, `rust/common/src/messaging.rs` | `tests/integration/test_backtest_signal_flow.py`, `tests/integration/test_end_to_end.rs` |
| Strategy signal correctness | `docs/guides/strategy-development.md` | `src/strategies/`, `src/data/`, `rust/signal-bridge/src/` | `tests/unit/test_strategy_signals.py`, integration signal tests |
| Risk and stop logic | `docs/guides/RISK_MANAGEMENT_GUIDE.md` | `rust/risk-manager/src/`, `src/strategies/strategy_router.py` | risk unit tests + stop-loss integration |
| Execution and routing | `docs/architecture/component-interfaces.md` | `rust/execution-engine/src/`, `src/backtesting/execution_handler.py` | execution unit tests + integration flow |
| Observability API/storage | `docs/observability/BACKEND_API.md` | `src/observability/` | `tests/observability/`, `tests/integration/test_observability_integration.py` |
| Backtesting regression | `docs/python-backtesting-guide.md` | `src/backtesting/` | `tests/test_backtest_integration.py`, related unit tests |

## 6) Minimum Path-Triggered Test Matrix

When touching these paths, run at least:

- `src/api/**` -> `python -m pytest tests/test_alpaca_*.py -q`
- `src/data/**` -> `python -m pytest tests/unit/python/test_features.py -q`
- `src/strategies/**` -> `python -m pytest tests/unit/test_strategy_signals.py -q`
- `src/backtesting/**` -> `python -m pytest tests/test_backtest_integration.py -q`
- `src/bridge/**` -> `python -m pytest tests/integration/test_backtest_signal_flow.py -q`
- `src/observability/**` -> `python -m pytest tests/observability -q`
- `rust/market-data/**` -> `cd rust && cargo test -p market-data`
- `rust/signal-bridge/**` -> `cd rust && cargo test -p signal-bridge`
- `rust/risk-manager/**` -> `cd rust && cargo test -p risk-manager`
- `rust/execution-engine/**` -> `cd rust && cargo test -p execution-engine`
- `rust/database/**` -> `cd rust && cargo test -p database`
- `rust/common/**` -> `cd rust && cargo test -p common`

For cross-runtime edits, run both Python integration and Rust crate tests.

## 7) Diagnostic Workflow

1. Classify symptom: `api | signal | risk | execution | backtest | observability | database | contract`.
2. Read canonical doc for that domain.
3. Shortlist owner modules (max 3).
4. Search inside shortlist only:

```bash
rg "keyword" src rust tests docs
rg --files src rust tests docs | rg "module_name"
```

5. Reproduce with narrowest failing test.
6. Patch smallest edit set.
7. Re-run nearest unit tests.
8. Re-run required integration tests.
9. Summarize evidence: doc -> code -> test.

## 8) Active Constraints

- Do not change public envelope contract:
  - `schema_version`
  - `correlation_id`
  - `event_type`
  - `timestamp`
  - `payload`
- Do not introduce weekly gate artifacts back into active docs.
- Prefer repo-relative paths or `[REPO_ROOT]/...` in docs.
- Keep provider posture as Alpaca-only (active).
- Keep observability/persistence posture as DuckDB-first (active).

## 9) Explicitly Removed From Active Flow

- Weekly roadmap lifecycle packs and week-gated operation plans
- Legacy documentation bundle under `docs/legacy/`
- Week-based verifier/audit script families retired from active inventory

## 10) Quick Command Pack (Maintenance)

```bash
python -m pytest tests/unit -q
python -m pytest tests/integration -q
python -m pytest tests/observability -q
cd rust && cargo check --workspace
cd rust && cargo test --workspace
bash scripts/health_check.sh
```

Use this pack as baseline after operational or runtime-facing changes.
