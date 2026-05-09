# PLAYBOOK.md — Canonical Doc -> Code -> Test Map

Updated: 2026-05-08 (Postgres Integration Update)
Scope: Production maintenance for Python + Rust trading stack

This playbook is the **code-grounded routing map** for maintainers.  
It exists to answer, quickly and deterministically:

1. Which file owns this behavior?
2. Which test proves it?
3. Which docs are authoritative before patching?

---

## 1) Canonical Reading Order (AGENTS-aligned)

For any non-trivial change, read in this order:

1. `docs/DOCS_CANONICAL_MAP.md`
2. `README_VI.md`
3. `PLAYBOOK.md`
4. `docs/roadmap/PHASE1_GO_NO_GO_EVIDENCE.md`
5. `docs/roadmap/PHASE2_GO_NO_GO_EVIDENCE.md`
6. Domain docs in `docs/`, `rust/docs/`, `tests/docs/`

Execution rules:

- Diagnose before edit.
- Patch owner files first (minimal set).
- Run nearest tests first (unit -> integration -> e2e).
- Keep Python/Rust contract symmetry for cross-runtime changes.

---

## 2) Runtime Entry Points (What Actually Runs)

### 2.1 Core scripts

- `scripts/start_trading_system.sh`
- `scripts/stop_trading_system.sh`
- `scripts/start_trading.sh`
- `scripts/autonomous_trading_system.sh`
- `scripts/start_services.sh`
- `scripts/stop_services.sh`

### 2.2 Observability scripts

- `scripts/start_observability.sh`
- `scripts/start_observability_api.py`
- `scripts/start-with-observability.sh`
- `scripts/health_check.sh`

### 2.3 Data / backtest scripts

- `scripts/download_market_data.py`
- `scripts/download_historical_data.py`
- `scripts/run_router_backtest.py`
- `scripts/run_ml_backtest.py`
- `scripts/run_optimized_backtest.py`

### 2.4 Phase 1 Evidence Artifacts

- `docs/roadmap/PHASE1_GO_NO_GO_EVIDENCE.md`: Phase 1 parity, reproducibility, ZMQ hardening, benchmark threshold, and GO/NO-GO evidence chain.
- `src/typings/signal_bridge.pyi`: IDE type stubs for the PyO3 binary module.

### 2.5 Phase 2.2 Rust-Only Promotion Artifacts

- `tests/benchmarks/backtest_engine_production_benchmark.py`: Production-like Rust-only benchmark gate (`P10K`, `P100K`) against frozen Python baseline metrics.
- `scripts/run_soak_fault_tests.py`: Rust-only soak/stability harness with timeout/memory/fallback/reconciliation gates.
- `scripts/generate_golden_risk_baseline.py`: Generates the compact immutable Phase 2.2 golden risk spec fixture.
- `tests/fixtures/phase2/python_baseline_metrics.json`: Frozen Python runtime metrics for speedup comparison; the Python backend is not executed by the promotion benchmark.
- `tests/fixtures/phase2/risk_decision_golden.json`: Golden risk decision spec used by Rust-only integrity checks.
- `docs/roadmap/PHASE2_GO_NO_GO_EVIDENCE.md`: Phase 2.2 GO/NO-GO evidence, fail-closed rollback triggers, and sign-off checklist.

### 2.6 Phase 3 Go Control-Plane Artifacts

- `docs/observability/PHASE3_API_PARITY_MATRIX.md`: FastAPI-vs-Go endpoint and websocket parity contract for v1 cutover scope.
- `docs/observability/PHASE3_CUTOVER_RUNBOOK.md`: Big Bang switch runbook, hard-gate conditions, and rollback procedure.
- `docs/roadmap/PHASE3_GO_NO_GO_EVIDENCE.md`: Phase 3 GO/NO-GO execution evidence, blockers, and sign-off status.
- `data/benchmarks/phase3/`: Runtime artifacts for parity/observability/integration gates and health/lock snapshots.

### 2.7 Current Phase 3 Status

- Functional gates executed with real artifacts:
  - `go/tests/integration/duckdb_integration_test.go` (PASS)
  - `tests/observability/test_go_parity.py` (non-skip pass run)
  - `tests/observability`
  - `tests/integration/test_observability_integration.py`
- Current verdict: **GO (Ready for Soak)**
- Blocking items: None.
- Next: 6-hour soak test and final production cutover.

---

## 3) Python Ownership Map (`src/`)

## 3.1 API Layer (`src/api`)

| File | Ownership | Key classes/functions | Primary tests |
|---|---|---|---|
| `src/api/alpaca_client.py` | Alpaca REST/WebSocket client behavior | `AlpacaClient` | `tests/test_alpaca_quick.py`, `tests/unit/test_alpaca_client.rs`, `tests/unit/test_alpaca_auth.rs`, `tests/unit/test_alpaca_error_handling.rs` |
| `src/api/alpaca_paper_trading.py` | Paper trading account/order lifecycle | `AlpacaPaperTrading`, `OrderType`, `PortfolioMetrics`, `PositionInfo` | `tests/integration/test_alpaca_api.rs`, `tests/integration/test_end_to_end.rs` |

## 3.2 Data Layer (`src/data`)

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/data/fetcher.py` | Market data acquisition abstraction | `DataFetcher` | `tests/unit/test_download_data.py`, integration signal/backtest slices |
| `src/data/loader.py` | Data loading/parquet-csv bridge | `DataLoader` | `tests/unit/python/test_backtesting.py` |
| `src/data/preprocessor.py` | Cleaning/transforms | `DataPreprocessor` | `tests/unit/python/test_features.py` |
| `src/data/indicators.py` | Technical indicator calculations | `TechnicalIndicators` | `tests/unit/python/test_features.py`, `tests/unit/test_strategy_signals.py` |
| `src/data/features.py` | Feature engineering pipeline + Phase 1 Rust opt-in offload adapter | `FeatureEngine` | `tests/unit/python/test_features.py`, `tests/unit/python/test_rust_feature_parity.py`, `tests/ml/test_feature_engineering.py` |

## 3.3 Backtesting Layer (`src/backtesting`)

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/backtesting/engine.py` | [UPDATED] Rust-only batch simulation engine (Phase 2.2); no Python backend fallback | `BacktestEngine`, `StrategyBatchInterfaceRequired`, `_run_rust_batch_path` | `tests/unit/python/test_backtest_engine.py`, `tests/test_backtest_integration.py` |
| `src/backtesting/data_handler.py` | Historical stream feed in backtest | `HistoricalDataHandler` | `tests/unit/test_data_handler.py` |
| `src/backtesting/portfolio_handler.py` | [UPDATED] Passive state container for position/cash/portfolio (synced from Rust) | `PortfolioHandler` | `tests/unit/test_portfolio_handler_shorts.py` |
| `src/backtesting/risk_integrity.py` | Phase 2.2 golden risk decision comparator keyed by `{timestamp, symbol, strategy_id, signal_id}` | `RiskDecisionRecord`, `RiskIntegrityComparison`, `compare_risk_decision_traces` | `tests/unit/python/test_risk_integrity_comparator.py`, `tests/test_backtest_integration.py` |
| `src/backtesting/governance.py` | Reliability governance gates | `RollbackGateMetrics`, `SoakRunTelemetry`, `evaluate_rollback_triggers`, `evaluate_soak_stability` | `tests/unit/python/test_governance.py` |
| `src/backtesting/performance.py` | Performance analytics | `PerformanceAnalyzer` | `tests/unit/python/test_backtesting.py` |
| `src/backtesting/metrics.py` | Performance metric objects | `PerformanceMetrics` | `tests/unit/python/test_backtesting.py` |
| `src/backtesting/position_sizer.py` | Sizing policies | `PositionSizer`, `FixedAmountSizer`, `PercentageOfEquitySizer`, `KellyPositionSizer` | `tests/unit/test_position_sizing.py` |
| `src/backtesting/transaction_costs.py` | Cost/slippage models | `TransactionCostModel`, `OrderBookSlippageModel` | `tests/unit/test_slippage.rs`, integration backtest slices |
| `src/backtesting/walk_forward.py` | Walk-forward validation | `WalkForwardWindow`, `WalkForwardAnalyzer` | `tests/unit/python/test_backtesting.py`, `tests/integration/test_backtest_signal_validation.py` |

## 3.4 Bridge Layer (`src/bridge`)

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/bridge/zmq_bridge.py` | Envelope serialization + pub/sub handoff + Phase 1 centralized validation | `ZMQPublisher`, `ZMQSubscriber`, `Signal`, `Position` | `tests/integration/test_backtest_signal_flow.py`, `tests/integration/test_risk_execution_observability.rs` |
| `src/bridge/rust_bridge.py` | Python -> Rust feature bridge and batch FFI wrapper timing | `RustFeatureComputer`, `RUST_BATCH_FEATURE_COLUMNS`, `REQUIRED_OHLCV_COLUMNS` | `tests/unit/python/test_rust_feature_parity.py`, `tests/integration/test_backtest_signal_flow.py` |
| `src/bridge/backtest_bridge.py` | [UPDATED] Bridge to Rust authoritative runtime with batch loading support and signal-id propagation | `RustBacktestBridge`, `load_market_data_columnar`, `load_signals` | `tests/test_backtest_integration.py` |
| `src/typings/` | Python type stubs for binary modules | `signal_bridge.pyi` | N/A (IDE only) |

## 3.5 Strategy Layer (`src/strategies`)

### Core contracts and routing

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/strategies/base.py` | Strategy contract + signal type | `SignalType`, `Signal`, `Strategy` | `tests/unit/python/test_strategy_base.py`, `tests/unit/test_strategy_signals.py` |
| `src/strategies/strategy_router.py` | Multi-strategy orchestration | `StrategyRouter` | `tests/integration/test_backtest_signal_flow.py`, `tests/integration/test_momentum_signal_generation.py` |

### Strategy implementations

| File | Key class | Primary tests |
|---|---|---|
| `src/strategies/momentum.py` | `MomentumStrategy` | `tests/unit/test_momentum_strategy.py` |
| `src/strategies/momentum_simplified.py` | `SimplifiedMomentumStrategy` | `tests/unit/test_momentum_strategy_improved.py` |
| `src/strategies/momentum_optimized.py` | `MomentumOptimizedStrategy` | `tests/unit/test_momentum_strategy_improved.py` |
| `src/strategies/momentum_regime_aware.py` | `RegimeAwareMomentumStrategy` | `tests/unit/test_market_regime.py` |
| `src/strategies/enhanced_momentum.py` | `EnhancedMomentumStrategy` | `tests/unit/python/test_enhanced_momentum.py` |
| `src/strategies/mean_reversion.py` | `MeanReversionStrategy` | `tests/unit/test_signal_validation.py` |
| `src/strategies/trend_following.py` | `TrendFollowingStrategy` | `tests/unit/test_strategy_signals.py` |
| `src/strategies/trend_momentum_strategy.py` | `TrendMomentumStrategy` | `tests/integration/test_momentum_signal_generation.py` |
| `src/strategies/moving_average.py` | `MovingAverageCrossover` | `tests/unit/test_strategy_signals.py` |
| `src/strategies/order_book_imbalance.py` | `OrderBookImbalanceStrategy` | `tests/integration/test_websocket.rs`, `tests/unit/test_orderbook.rs` |
| `src/strategies/quantitative_strategy.py` | `QuantitativeStrategy` | integration backtest/signal slices |
| `src/strategies/statistical_arbitrage.py` | `StatisticalArbitrageStrategy` | integration strategy slices |
| `src/strategies/simple_momentum.py` | `SimpleMomentumStrategy` | `tests/unit/test_strategy_signals.py` |
| `src/strategies/ml_ensemble_strategy.py` | `MLEnsembleStrategy` | `tests/ml/test_models.py` |

### ML subpackage

| File | Ownership | Primary tests |
|---|---|---|
| `src/strategies/ml/features/feature_engineering.py` | ML feature transforms | `tests/ml/test_feature_engineering.py` |
| `src/strategies/ml/models/base_model.py` | Base ML model contract | `tests/ml/test_models.py` |
| `src/strategies/ml/models/price_predictor.py` | Price predictor | `tests/ml/test_models.py` |
| `src/strategies/ml/models/trend_classifier.py` | Trend classification | `tests/ml/test_models.py` |
| `src/strategies/ml/validation/model_validator.py` | Model validation orchestration | `tests/unit/test_signal_validation.py` |
| `src/strategies/ml/validation/cross_validator.py` | CV workflow | `tests/unit/test_signal_validation.py` |
| `src/strategies/ml/validation/drift_detector.py` | Drift analysis | `tests/unit/test_signal_diagnostics.py` |
| `src/strategies/ml/validation/governance.py` | Governance gate objects | `tests/unit/test_release_gate1.py`, `tests/unit/test_release_gate2.py` |
| `src/strategies/ml/validation/live_monitor.py` | Live governance checks | `tests/unit/test_staging_hardening.py` |



## 3.7 Observability (`src/observability`)

### API and transport

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/observability/api/main.py` | FastAPI surface | `ObservabilityAPI` | `tests/observability/test_api.py`, `tests/observability/test_integration.py` |
| `src/observability/api/websocket_manager.py` | WebSocket sessions and fanout | `WebSocketManager`, `WebSocketConnection` | `tests/observability/test_log_streams.py`, `tests/observability/test_startup.py` |
| `src/observability/api/routes/metrics.py` | Metrics endpoints | route handlers | `tests/observability/test_performance.py` |
| `src/observability/api/routes/system.py` | Health/system endpoints | route handlers | `tests/observability/test_startup.py` |
| `src/observability/api/routes/trades.py` | Trade endpoints | route handlers | `tests/observability/test_api.py` |

### Storage and database

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/observability/storage/duckdb_client.py` | DuckDB persistence client | `DuckDBClient` | `tests/observability/test_duckdb_client.py` |
| `src/observability/storage/sqlite_client.py` | SQLite fallback client | `SQLiteClient` | `tests/observability/test_sqlite_client.py` |
| `src/observability/storage/postgres_client.py` | PostgreSQL persistence client | `PostgresClient` | `tests/observability/test_databases.py` |
| `src/observability/storage/schemas.py` | Storage schema definitions | `SQL_SCHEMA`, `POSTGRES_SCHEMA` | integration storage tests |
| `src/observability/storage/integration.py` | Storage orchestration | `StorageManager` | `tests/observability/test_databases.py` |
| `src/observability/database/duckdb_manager.py` | DB manager singleton | `DuckDBManager` | `tests/observability/test_databases.py` |
| `src/observability/database.py` | Legacy db wrapper | `ObservabilityDatabase` | `tests/observability/test_databases.py` |

### Logging and correlation

| File | Ownership | Key classes/functions | Primary tests |
|---|---|---|---|
| `src/observability/logging/correlations.py` | Correlation context propagation | `CorrelationContext`, `generate_correlation_id`, `get_correlation_id` | `tests/observability/test_logging.py` |
| `src/observability/logging/structured_logger.py` | Structured logging + metrics | `StructuredLogger`, `LoggerMetrics` | `tests/observability/test_structured_logger.py` |
| `src/observability/logging/streams.py` | Domain loggers | `MarketDataLogger`, `StrategyLogger`, `RiskLogger`, `ExecutionLogger`, `SystemLogger` | `tests/observability/test_log_streams.py` |
| `src/observability/logging/formatters.py` | Log formatter implementations | `JSONFormatter`, `StructuredFormatter` | `tests/observability/test_logging.py` |
| `src/observability/logging/handlers.py` | Async/file/syslog handlers | `AsyncQueueHandler`, `RotatingFileHandlerAsync` | `tests/observability/test_logging.py` |
| `src/observability/logging/decorators.py` | Log decorators for runtime flows | `log_execution_time`, `log_trade_decision` | `tests/observability/test_logging.py` |

### Metrics collectors

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/observability/metrics/collectors.py` | Base collector abstraction | `BaseCollector` | `tests/observability/test_performance.py` |
| `src/observability/metrics/market_data_collector.py` | Market data metrics | `MarketDataCollector` | `tests/observability/test_performance.py` |
| `src/observability/metrics/strategy_collector.py` | Strategy metrics | `StrategyCollector` | `tests/observability/test_performance.py` |
| `src/observability/metrics/execution_collector.py` | Execution metrics | `ExecutionCollector` | `tests/observability/test_performance.py` |
| `src/observability/metrics/system_collector.py` | System metrics | `SystemCollector` | `tests/observability/test_performance.py` |

### Alerting

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/observability/alerts/escalation.py` | Incident/escalation contract | `EscalationManager`, `Incident`, `IncidentSeverity` | `tests/observability/test_incident_api.py` |

## 3.8 Domain Models (`src/models`)

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/models/events.py` | Event object hierarchy | `MarketEvent`, `SignalEvent`, `OrderEvent`, `FillEvent` | `tests/unit/test_types.rs`, integration signal flow |
| `src/models/market.py` | Market primitives | `Bar`, `Trade`, `Quote` | strategy and data unit tests |
| `src/models/portfolio.py` | Portfolio state objects | `Position`, `Portfolio`, `PerformanceMetrics` | `tests/unit/test_portfolio_handler_shorts.py` |
| `src/models/governance.py` | Governance control record model | `ControlRecord`, `ControlType`, `ControlStatus` | release gate unit tests |

## 3.9 Utility Managers (`src/utils`)

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/utils/release_gate_manager.py` | Gate1 quality governance | `ReleaseGateManager`, `ReleaseGateRecord` | `tests/unit/test_release_gate1.py` |
| `src/utils/integration_gate_manager.py` | Gate2 integration governance | `IntegrationGateManager`, `IntegrationGateRecord` | `tests/unit/test_release_gate2.py` |
| `src/utils/e2e_gate_manager.py` | Gate3 e2e governance | `E2EGateManager`, `E2EGateRecord` | `tests/unit/test_release_gate3.py` |
| `src/utils/final_release_manager.py` | Gate4 final release governance | `FinalReleaseManager`, `FinalReleaseRecord` | `tests/unit/test_release_gate4.py` |
| `src/utils/canary_manager.py` | Canary design controls | `CanaryDesignManager`, `CanaryDesignRecord` | `tests/unit/test_canary_design.py` |
| `src/utils/canary_launch_manager.py` | Canary launch controls | `CanaryLaunchManager`, `CanaryLaunchRecord` | `tests/unit/test_canary_launch.py` |
| `src/utils/safety_manager.py` | Safety guardrails controls | `SafetyGuardrailsManager`, `SafetyGuardrailsRecord` | `tests/unit/test_safety_guardrails.py` |
| `src/utils/staging_manager.py` | Staging hardening controls | `StagingHardeningManager`, `StagingHardeningRecord` | `tests/unit/test_staging_hardening.py` |
| `src/utils/validation_tools.py` | Governance verification helpers | `run_governance_verification` | release gate tests |

## 3.10 Research & Simulation

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/research/repro_manager.py` | Reproducibility record/decision model | `ReproducibilityManager`, `ReproducibilityRecord` | `tests/unit/test_repro_manager.py` |
| `src/simulations/monte_carlo.py` | Monte Carlo simulation + explicit seed control/Rust numeric backend | `MonteCarloSimulator` | `tests/unit/python/test_monte_carlo_reproducibility.py`, strategy + simulation tests |

---

## 4) Rust Ownership Map (`rust/*/src`)

## 4.1 `rust/common`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/common/src/types.rs` | Shared domain primitives | `Order`, `Position`, `Signal`, `RiskReport`, `RiskReason` | `tests/unit/test_common_types.rs`, `tests/unit/test_types.rs` |
| `rust/common/src/messaging.rs` | Cross-runtime envelope/messages + Phase 1 required-field validation | `Envelope`, `Message`, `RiskCheckRequest`, `RiskCheckResult` | `rust/common/tests/parser_tests.rs`, integration contract tests |
| `rust/common/src/errors.rs` | Shared error surface | `TradingError` | `tests/unit/test_errors.rs` |
| `rust/common/src/config.rs` | Shared service config structs | `SystemConfig`, `MarketDataConfig`, `RiskConfig` | crate config tests |
| `rust/common/src/health.rs` | Health status contract | `HealthCheck`, `SystemHealth` | `tests/unit/test_common_health.rs` |
| `rust/common/src/metrics.rs` | Shared metrics functions | `record_tick_received`, `record_order_submitted`, etc. | observability integration tests |
| `rust/common/src/http.rs` | Health/ready http helpers | `create_health_router` | service integration tests |

## 4.2 `rust/market-data`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/market-data/src/websocket.rs` | Alpaca stream ingestion | `WebSocketClient`, `AlpacaMessage` | `tests/integration/test_websocket.rs` |
| `rust/market-data/src/orderbook.rs` | Orderbook core | `FastOrderBook`, `OrderBookManager` | `tests/unit/test_orderbook.rs`, `tests/unit/test_market_data_orderbook.rs`, `rust/market-data/tests/orderbook_tests.rs` |
| `rust/market-data/src/aggregation.rs` | Bar/VWAP/microstructure aggregation | `BarAggregator`, `VwapCalculator`, `MicrostructureFeatures` | integration data flow tests |
| `rust/market-data/src/publisher.rs` | Event publish layer | `MarketDataPublisher` | integration stream tests |

## 4.3 `rust/signal-bridge`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/signal-bridge/src/indicators.rs` | Low-latency indicators + batch log-return/momentum helpers | `SMA`, `EMA`, `RSI`, `MACD`, `BollingerBands`, `batch_log_returns`, `batch_momentum` | crate tests, strategy signal unit/integration tests |
| `rust/signal-bridge/src/features.rs` | Feature compute service | `FeatureEngine` | signal flow integration |
| `rust/signal-bridge/src/backtest_runtime.rs` | [UPDATED] Rust-owned backtest kernel with streaming bar/signal merge, risk, execution, portfolio, PnL, metrics | `BacktestRuntime`, `SignalRow`, `RiskDecisionTrace`, `load_market_data`, `load_signals`, `run_to_completion` | `cargo test -p signal-bridge` |
| `rust/signal-bridge/src/bridge.rs` | Bridge compute contract + PyO3 batch/Monte Carlo/Rust-only backtest kernels | `FeatureComputer`, `BacktestRuntime`, `load_market_data_columnar`, `load_signals_columnar` | crate tests, `tests/unit/python/test_rust_feature_parity.py`, `tests/test_backtest_integration.py` |

## 4.4 `rust/risk-manager`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/risk-manager/src/limits.rs` | Position/daily loss limits | `LimitChecker`, `check_with_report` | `tests/unit/test_risk_manager.rs`, `rust/risk-manager/tests/limit_regression_tests.rs` |
| `rust/risk-manager/src/circuit_breaker.rs` | Circuit state machine | `CircuitBreaker`, `TripReason` | `rust/risk-manager/tests/circuit_breaker_tests.rs` |
| `rust/risk-manager/src/stops.rs` | Stop loss policies | `StopManager`, `StopLossTrigger`, `StopLossType` | `tests/integration/test_stop_loss_integration.rs`, stop tests |
| `rust/risk-manager/src/pnl.rs` | PnL accounting | `PnLTracker`, `PositionState` | risk integration tests |
| `rust/risk-manager/src/reload.rs` | Risk config reload parser | `load_risk_config_from_toml` | config reload tests |

## 4.5 `rust/execution-engine`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/execution-engine/src/router.rs` | Order routing and broker request model | `OrderRouter`, `AlpacaOrderRequest` | `tests/unit/test_execution_router.rs`, `tests/unit/test_router_security.rs` |
| `rust/execution-engine/src/retry.rs` | Retry policy | `RetryPolicy` | `tests/unit/test_retry.rs` |
| `rust/execution-engine/src/slippage.rs` | Slippage estimation | `SlippageEstimator` | `tests/unit/test_slippage.rs` |
| `rust/execution-engine/src/stop_loss_executor.rs` | Stop-loss order emission | `StopLossExecutor` | stop-loss integration tests |

## 4.6 `rust/database`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/database/src/connection.rs` | DB connection/pool manager | `ConnectionManager`, `DatabaseManager` | `rust/database/src/tests.rs` |
| `rust/database/src/schema.rs` | Schema lifecycle | `Schema::create_all`, `verify` | storage integration tests |
| `rust/database/src/migrations.rs` | Migrations and migrator | `MigrationManager`, `TimescaleMigrator` | migration tests |
| `rust/database/src/models.rs` | Metric/candle/trade/system records | `MetricRecord`, `TradeRecord`, `SystemEvent` | `tests/integration/test_duckdb_storage.rs` |
| `rust/database/src/query.rs` | Query builder and aggregation | `QueryBuilder`, `TimeInterval` | storage/query tests |
| `rust/database/src/error.rs` | DB error surface | `DatabaseError` | unit/integration db tests |

---

## 5) Go Ownership Map (`go/`)

| File/Module | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `go/cmd/server/main.go` | Entrypoint for Phase 3 API | `main` | `tests/observability/test_go_parity.py` |
| `go/internal/http/routes.go` | HTTP Route definitions | `SetupRoutes` | `go/internal/http/routes_test.go` |
| `go/internal/http/middleware.go` | CORS, ID, and Logger middleware | `SetupCors`, `CorrelationID`, `Logger` | `go/internal/http/routes_test.go` |
| `go/internal/auth/apikey.go` | Internal API key gate | `APIKeyAuth` | `go/internal/http/routes_test.go`, `tests/observability/test_go_parity.py` |
| `go/internal/ratelimit/limiter.go` | Key/IP throttling | `Limiter`, `Middleware` | `go/internal/http/routes_test.go` |
| `go/internal/ws/manager.go` | WebSocket Manager logic | `Manager`, `ServeWS` | `go/internal/ws/manager_test.go`, `tests/observability/test_go_parity.py` |
| `go/internal/storage/store.go` | Multi-DB store bundle | `Store`, `NewStore` | `tests/observability/test_go_parity.py` |
| `go/internal/storage/postgres.go` | PostgreSQL read adapter | `PostgresReader` | `tests/observability/test_go_parity.py` |
| `go/internal/storage/duckdb.go` | DuckDB read adapter | `DuckDBReader` | `tests/observability/test_go_parity.py` |
| `go/internal/storage/sqlite.go` | SQLite fallback read adapter | `SQLiteReader` | `tests/observability/test_go_parity.py` |
| `go/internal/health/aggregator.go` | Health aggregation logic | `Aggregator` | `tests/observability/test_go_parity.py` |
| `go/internal/worker/collector.go` | 10Hz WS metrics broadcast worker | `MetricsCollector` | `tests/observability/test_go_parity.py` |
| `go/internal/http/routes_test.go` | Go HTTP/auth/CORS gate tests | route tests | `cd go && go test ./...` |
| `go/internal/ws/manager_test.go` | Go websocket handshake/ping-pong tests | websocket tests | `cd go && go test ./...` |
| `go/tests/integration/duckdb_integration_test.go` | Go DuckDB integration tests | integration tests | `cd go && go test ./tests/integration/...` |

---

## 6) Test Ownership Map (`tests/`)

### 5.1 Unit tests

- Python unit: `tests/unit/python/`
  - `tests/unit/python/test_rust_feature_parity.py`
  - `tests/unit/python/test_monte_carlo_reproducibility.py`
- Mixed Python unit: `tests/unit/test_*.py`
- Rust unit/crate behavior: `tests/unit/test_*.rs`

### 5.1.1 Benchmarks

- `tests/benchmarks/feature_backend_benchmark.py`

### 5.2 Integration tests

- Python integration: `tests/integration/test_*.py`
- Rust integration: `tests/integration/test_*.rs`
- Phase 2 canonical gate: `tests/test_backtest_integration.py`
- Phase 2 rollout governance unit gates:
  - `tests/unit/python/test_risk_integrity_comparator.py`
  - `tests/unit/python/test_governance.py`
- Critical mixed path:
  - `tests/integration/test_backtest_signal_flow.py`
  - `tests/integration/test_observability_integration.py`
  - `tests/integration/test_risk_execution_observability.rs`

### 5.3 E2E

- `tests/e2e/test_full_system.py`

### 5.4 Observability

- `tests/observability/test_*.py`

---

## 6) Fast Routing Matrix (Doc -> Code -> Test)

| Symptom | Read first | Inspect first | Validate first |
|---|---|---|---|
| Alpaca auth/rate limit | `docs/api/ALPACA_API.md` | `src/api/alpaca_client.py` | `tests/test_alpaca_quick.py`, `tests/unit/test_alpaca_auth.rs` |
| Signal mismatch | `docs/api/ZMQ_PROTOCOL.md` | `src/strategies/strategy_router.py`, `rust/signal-bridge/src/indicators.rs` | `tests/unit/test_strategy_signals.py`, `tests/integration/test_backtest_signal_flow.py` |
| Risk reject anomalies | `docs/guides/RISK_MANAGEMENT_GUIDE.md` | `rust/risk-manager/src/limits.rs` | `tests/unit/test_risk_manager.rs` |
| Execution retry/slippage | `docs/architecture/component-interfaces.md` | `rust/execution-engine/src/retry.rs`, `rust/execution-engine/src/slippage.rs` | `tests/unit/test_retry.rs`, `tests/unit/test_slippage.rs` |
| Observability API/storage | `docs/observability/BACKEND_API.md`, `docs/observability/PHASE3_API_PARITY_MATRIX.md`, `docs/observability/PHASE3_CUTOVER_RUNBOOK.md` | `go/internal/http/routes.go`, `go/internal/ws/manager.go`, `src/observability/api/main.py`, `src/observability/storage/duckdb_client.py` | `tests/observability/test_go_parity.py`, `tests/integration/test_observability_integration.py` |
| DB persistence/query | `docs/STORAGE_GUIDE.md` | `rust/database/src/{schema,query,connection}.rs` | `tests/integration/test_duckdb_storage.rs` |

---

## 7) Path-Triggered Minimum Tests

- `src/api/**` -> `python -m pytest tests/test_alpaca_*.py -q`
- `src/data/**` -> `python -m pytest tests/unit/python/test_features.py -q`
- `src/strategies/**` -> `python -m pytest tests/unit/test_strategy_signals.py -q`
- `src/backtesting/**` -> `python -m pytest tests/unit/python/test_backtest_engine.py -q && python -m pytest tests/unit/python/test_risk_integrity_comparator.py -q && python -m pytest tests/unit/python/test_governance.py -q && python -m pytest tests/test_backtest_integration.py -q`
- `src/bridge/**` -> `python -m pytest tests/integration/test_backtest_signal_flow.py -q`
- `src/observability/**` -> `python -m pytest tests/observability -q`
- `rust/market-data/**` -> `cd rust && cargo test -p market-data`
- `rust/signal-bridge/**` -> `cd rust && PYO3_PYTHON="$PWD/../.venv/bin/python" cargo test -p signal-bridge`
- `rust/risk-manager/**` -> `cd rust && cargo test -p risk-manager`
- `rust/execution-engine/**` -> `cd rust && cargo test -p execution-engine`
- `rust/database/**` -> `cd rust && cargo test -p database`
- `rust/common/**` -> `cd rust && cargo test -p common`
- `go/**` -> `cd go && go test ./...`

For Phase 3 cutover hard-gate execution order, run:

- `python -m pytest tests/observability/test_go_parity.py -q`
- `python -m pytest tests/observability -q`
- `python -m pytest tests/integration/test_observability_integration.py -q`
- `python scripts/run_go_soak_test.py` (required before GO)
- rollback drill per `docs/observability/PHASE3_CUTOVER_RUNBOOK.md` (required before GO)

For cross-runtime contract edits (`src/bridge/**`, `rust/signal-bridge/**`, `rust/common/src/messaging.rs`), run both Python integration and Rust crate tests.

---

## 8) Baseline Command Pack (Post-change)

```bash
python -m pytest tests/unit -q
python -m pytest tests/integration -q
python -m pytest tests/observability -q
cd rust && cargo check --workspace
cd rust && cargo test --workspace
bash scripts/health_check.sh
```

---

## 9) Documentation Alignment Rules

- Canonical operational docs are defined in `docs/DOCS_CANONICAL_MAP.md`.
- `PLAYBOOK.md` is the source-of-truth for owner-file routing.
- If docs conflict with code, follow runtime code and patch docs in the same change.
- Use repo-relative or `[REPO_ROOT]/...` paths; avoid user-specific absolute paths.

---

## 10) Maintenance Contract

1. Any new project file (source/config/script/test/doc) must be added to this playbook in the same change.
2. Never patch generated outputs (`__pycache__`, `target/`, logs, build artifacts).
3. Keep edit scope minimal and owner-centered.
4. Do not reintroduce weekly lifecycle/gate artifacts into active playbook flow.
