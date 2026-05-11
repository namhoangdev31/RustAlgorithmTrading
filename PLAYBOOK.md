# PLAYBOOK.md — Canonical Doc -> Code -> Test Map

Updated: 2026-05-11 (Phase 3.5 Hardened - FULL SYSTEM RESTORE)
Scope: Production maintenance for Tri-Runtime (Rust/Python/Go) stack

This playbook is the **code-grounded routing map** for maintainers. It exists to answer, quickly and deterministically:

1. Which file owns this behavior?
2. Which test proves it?
3. Which docs are authoritative before patching?

---

## 1) Canonical Reading Order (AGENTS-aligned)

For any non-trivial change, read in this order:

1. `docs/DOCS_CANONICAL_MAP.md`
2. `README_VI.md`
3. `PLAYBOOK.md`
4. `docs/roadmap/COMPLETION_REPORT.md`

---

## 2) System Status: Production Ready (Phase 3.5)

The platform is fully migrated.

- **Rust Kernel**: Live execution, risk, and signal generation.
- **Go Control Plane**: Observability, monitoring (Port 8081), and alerting.
- **Python Research**: Strategy development, backtesting, and ML modeling.

---

## 3) Python Ownership Map (`src/`)

### 3.1 API Layer (`src/api`)

| File | Ownership | Key classes/functions | Primary tests |
|---|---|---|---|
| `src/api/alpaca_client.py` | Alpaca REST/WebSocket client behavior | `AlpacaClient` | `tests/unit/python/test_alpaca_client_go_runtime.py`, `tests/test_alpaca_quick.py` |
| `src/api/alpaca_paper_trading.py` | Paper trading account/order lifecycle | `AlpacaPaperTrading`, `OrderType`, `PortfolioMetrics` | `tests/integration/test_alpaca_api.rs`, `tests/integration/test_end_to_end.rs` |

### 3.2 Data Layer (`src/data`)

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/data/fetcher.py` | Market data acquisition abstraction | `DataFetcher` | `tests/unit/test_download_data.py` |
| `src/data/loader.py` | Data loading/parquet-csv bridge | `DataLoader` | `tests/unit/python/test_backtesting.py` |
| `src/data/preprocessor.py` | Cleaning/transforms | `DataPreprocessor` | `tests/unit/python/test_features.py` |
| `src/data/indicators.py` | Technical indicator calculations | `TechnicalIndicators` | `tests/unit/test_strategy_signals.py` |
| `src/data/features.py` | Feature engineering pipeline | `FeatureEngine` | `tests/unit/python/test_features.py`, `tests/unit/python/test_rust_feature_parity.py` |

### 3.3 Backtesting Layer (`src/backtesting`)

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/backtesting/engine.py` | Rust-only batch simulation engine | `BacktestEngine`, `StrategyBatchInterfaceRequired` | `tests/unit/python/test_backtest_engine.py`, `tests/test_backtest_integration.py` |
| `src/backtesting/portfolio_handler.py` | Passive state container for portfolio (synced from Rust) | `PortfolioHandler` | `tests/unit/test_portfolio_handler_shorts.py` |
| `src/backtesting/risk_integrity.py` | Golden risk decision comparator | `RiskIntegrityComparison` | `tests/unit/python/test_risk_integrity_comparator.py` |
| `src/backtesting/performance.py` | Performance analytics | `PerformanceAnalyzer` | `tests/unit/python/test_backtesting.py` |
| `src/backtesting/transaction_costs.py` | Cost/slippage models | `TransactionCostModel`, `OrderBookSlippageModel` | `tests/unit/test_slippage.rs` |

### 3.4 Bridge Layer (`src/bridge`)

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/bridge/zmq_bridge.py` | Envelope serialization + ZMQ handoff | `ZMQPublisher`, `ZMQSubscriber`, `Signal`, `Position` | `tests/integration/test_backtest_signal_flow.py` |
| `src/bridge/rust_bridge.py` | Python -> Rust feature bridge wrapper | `RustFeatureComputer` | `tests/unit/python/test_rust_feature_parity.py` |
| `src/bridge/backtest_bridge.py` | Bridge to Rust authoritative runtime | `RustBacktestBridge` | `tests/test_backtest_integration.py` |

### 3.5 Strategy Layer (`src/strategies`)

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/strategies/base.py` | Strategy contract + signal type | `SignalType`, `Signal`, `Strategy` | `tests/unit/test_strategy_signals.py` |
| `src/strategies/strategy_router.py` | Multi-strategy orchestration | `StrategyRouter` | `tests/integration/test_backtest_signal_flow.py` |
| `src/strategies/momentum.py` | Momentum Strategy implementation | `MomentumStrategy` | `tests/unit/test_momentum_strategy.py` |
| `src/strategies/ml_ensemble_strategy.py` | ML Ensemble Strategy | `MLEnsembleStrategy` | `tests/ml/test_models.py` |

---

## 4) Rust Ownership Map (`rust/*/src`)

### 4.1 `rust/common`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/common/src/types.rs` | Shared domain primitives | `Order`, `Position`, `Signal`, `RiskReport` | `tests/unit/test_common_types.rs` |
| `rust/common/src/messaging.rs` | Cross-runtime envelope/messages | `Envelope`, `Message` | integration contract tests |
| `rust/common/src/errors.rs` | Shared error surface | `TradingError` | `tests/unit/test_errors.rs` |
| `rust/common/src/health.rs` | Health status contract | `HealthCheck`, `SystemHealth` | `tests/unit/test_common_health.rs` |
| `rust/common/src/http.rs` | Health/ready http helpers | `create_health_router` | service integration tests |

### 4.2 `rust/market-data`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/market-data/src/websocket.rs` | Alpaca stream ingestion | `WebSocketClient`, `AlpacaMessage` | `tests/integration/test_websocket.rs` |
| `rust/market-data/src/orderbook.rs` | Orderbook core | `FastOrderBook`, `OrderBookManager` | `tests/unit/test_orderbook.rs` |
| `rust/market-data/src/aggregation.rs` | Bar/VWAP aggregation | `BarAggregator`, `VwapCalculator` | integration data flow tests |
| `rust/market-data/src/publisher.rs` | Event publish layer | `MarketDataPublisher` | integration stream tests |

### 4.3 `rust/signal-bridge`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/signal-bridge/src/indicators.rs` | Low-latency indicators (RSI, MACD, etc) | `SMA`, `EMA`, `RSI`, `MACD`, `batch_log_returns` | `cargo test -p signal-bridge` |
| `rust/signal-bridge/src/backtest_runtime.rs` | Rust-owned backtest kernel | `BacktestRuntime`, `SignalRow` | `cargo test -p signal-bridge` |
| `rust/signal-bridge/src/bridge.rs` | PyO3 batch/Monte Carlo/Backtest bridge | `FeatureComputer`, `BacktestRuntime` | `tests/test_backtest_integration.py` |

### 4.4 `rust/risk-manager`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/risk-manager/src/limits.rs` | Position/daily loss limits | `LimitChecker`, `check_with_report` | `tests/unit/test_risk_manager.rs` |
| `rust/risk-manager/src/stops.rs` | Stop loss policies | `StopManager`, `StopLossTrigger` | `tests/integration/test_stop_loss_integration.rs` |
| `rust/risk-manager/src/pnl.rs` | PnL accounting | `PnLTracker`, `PositionState` | risk integration tests |
| `rust/risk-manager/src/circuit_breaker.rs` | Circuit state machine | `CircuitBreaker` | risk-manager unit tests |

### 4.5 `rust/execution-engine`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/execution-engine/src/router.rs` | Order routing to broker | `OrderRouter`, `AlpacaOrderRequest` | `tests/unit/test_execution_router.rs` |
| `rust/execution-engine/src/retry.rs` | Retry policy | `RetryPolicy` | `tests/unit/test_retry.rs` |
| `rust/execution-engine/src/slippage.rs` | Slippage estimation | `SlippageEstimator` | `tests/unit/test_slippage.rs` |
| `rust/execution-engine/src/stop_loss_executor.rs` | Stop-loss order emission | `StopLossExecutor` | stop-loss integration tests |

### 4.6 `rust/database`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/database/src/connection.rs` | DB connection manager | `ConnectionManager` | `rust/database/src/tests.rs` |
| `rust/database/src/schema.rs` | Schema lifecycle | `Schema::create_all` | storage integration tests |
| `rust/database/src/models.rs` | Metric/trade records | `MetricRecord`, `TradeRecord` | `tests/integration/test_duckdb_storage.rs` |

---

## 5) Go Ownership Map (`go/`)

| Module | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `go/cmd/server/main.go` | Entrypoint for Phase 3 API | `main` | `tests/observability/test_go_parity.py` |
| `go/internal/http/routes.go` | HTTP Route definitions | `SetupRoutes` | `go/internal/http/routes_test.go` |
| `go/internal/ws/manager.go` | WebSocket fanout logic | `Manager`, `ServeWS` | `go/internal/ws/manager_test.go` |
| `go/internal/storage/duckdb.go` | DuckDB read adapter | `DuckDBReader` | `tests/observability/test_go_parity.py` |
| `go/internal/storage/sqlite.go` | SQLite read adapter | `SQLiteReader` | `tests/observability/test_go_parity.py` |
| `go/internal/health/aggregator.go` | Health aggregation logic | `Aggregator` | `tests/observability/test_go_parity.py` |
| `go/internal/worker/collector.go` | Metrics broadcast worker | `MetricsCollector` | `tests/observability/test_go_parity.py` |
| `go/internal/alpaca/client.go` | Go-native Alpaca adapter | `Client`, `PlaceMarketOrder` | `go/internal/alpaca/client_test.go` |
| `go/internal/integrity/integrity.go` | Go integrity gate evaluator | `ValidateRunIntegrity` | `go/internal/integrity/integrity_test.go` |

---

## 6) Deployment & Infrastructure (`deployment/`)

| Path | Responsibility | Key components |
|---|---|---|
| `deployment/docker-compose.yml` | Primary runtime orchestration | Rust services (Market, Execution, Risk) |
| `deployment/docker-compose.observability.yml` | Control plane orchestration | Go Observability API (Port 8081), Dashboard |
| `deployment/monitoring/` | Monitoring stack configs | Prometheus, Alertmanager, Grafana assets |
| `docs/deployment/PRODUCTION_DEPLOYMENT.md` | Authoritative deployment guide | Lifecycle, security, rollback instructions |
| `docs/deployment/DEPENDENCY_INSTALLATION.md` | Unified runtime sync guide | `rustup`, `uv`, `go` environment synchronization |

---

## 7) Documentation Index (`docs/`)

| Folder | Focus | Key Authority |
|---|---|---|
| `docs/architecture/` | System Design | `SYSTEM_ARCHITECTURE.md`, `python-rust-separation.md` |
| `docs/api/` | Contracts | `ZMQ_PROTOCOL.md`, `ALPACA_API.md` |
| `docs/observability/` | Monitoring | `OBSERVABILITY_OVERVIEW.md`, `METRICS_CATALOG.md` |
| `docs/operations/` | Day-to-Day | `OPERATIONS_GUIDE.md` |
| `docs/optimization/` | Performance | `PERFORMANCE_GUIDE.md` |
| `docs/security/` | Hardening | `SECURITY_STANDARDS.md` |
| `docs/setup/` | Provisioning | `DEVELOPMENT.md` |
| `docs/roadmap/` | Lifecycle | `COMPLETION_REPORT.md` |

---

## 8) Fast Routing Matrix (Doc -> Code -> Test)

| Symptom | Read first | Inspect first | Validate first |
|---|---|---|---|
| Alpaca Auth/API | `docs/api/ALPACA_API.md` | `src/api/alpaca_client.py` | `tests/test_alpaca_quick.py` |
| Signal Mismatch | `docs/api/ZMQ_PROTOCOL.md` | `rust/signal-bridge/src/indicators.rs` | `tests/unit/test_strategy_signals.py` |
| Risk Reject | `docs/guides/RISK_MANAGEMENT_GUIDE.md` | `rust/risk-manager/src/limits.rs` | `tests/unit/test_risk_manager.rs` |
| Execution Retry | `docs/architecture/component-interfaces.md` | `rust/execution-engine/src/retry.rs` | `tests/unit/test_retry.rs` |
| DB Persistence | `docs/observability/STORAGE_OPERATIONS.md` | `go/internal/storage/duckdb.go` | `tests/integration/test_duckdb_storage.rs` |
| Observability/Go | `docs/observability/OBSERVABILITY_OVERVIEW.md` | `go/cmd/server/main.go` | `tests/observability/test_go_parity.py` |

---

## 9) Path-Triggered Minimum Tests

- `src/api/**` -> `python -m pytest tests/test_alpaca_*.py -q`
- `src/data/**` -> `python -m pytest tests/unit/python/test_features.py -q`
- `src/strategies/**` -> `python -m pytest tests/unit/test_strategy_signals.py -q`
- `src/backtesting/**` -> `python -m pytest tests/test_backtest_integration.py -q`
- `rust/market-data/**` -> `cd rust && cargo test -p market-data`
- `rust/signal-bridge/**` -> `cd rust && cargo test -p signal-bridge`
- `rust/risk-manager/**` -> `cd rust && cargo test -p risk-manager`
- `rust/execution-engine/**` -> `cd rust && cargo test -p execution-engine`
- `go/**` -> `cd go && go test ./...`

---

## 10) Maintenance Contract

1. Any new project file must be added to this playbook in the same change.
2. Keep edit scope minimal and owner-centered.
3. If docs conflict with code, follow runtime code and patch docs.
4. **Never delete routing tables or ownership maps; they are the platform's brain.**

---

## 11) Test Ownership Map (`tests/`)

| Folder | Ownership | Primary Language | Key Files |
|---|---|---|---|
| `tests/unit/python/` | Python Unit Tests | Python | `test_backtest_engine.py`, `test_rust_feature_parity.py` |
| `tests/unit/` | Rust Unit Tests | Rust | `test_common_types.rs`, `test_risk_manager.rs` |
| `tests/integration/` | Cross-runtime Integration | Mixed | `test_backtest_signal_flow.py`, `test_websocket.rs` |
| `tests/e2e/` | Full System Flows | Python | `test_full_system.py` |
| `tests/observability/` | Go API & Metrics Parity | Python/Go | `test_go_parity.py`, `test_api.py` |
| `tests/benchmarks/` | Performance Gates | Python/Rust | `backtest_engine_production_benchmark.py` |
| `tests/ml/` | ML Strategy Validation | Python | `test_feature_engineering.py`, `test_models.py` |
| `tests/fixtures/` | Test Data & Golden Artifacts | JSON/Parquet | `risk_decision_golden.json` |

---
**Architect**: Antigravity AI
**Status**: Authoritative Playbook (PHASE 3.5 FULL SYSTEM & TESTS RESTORED)
