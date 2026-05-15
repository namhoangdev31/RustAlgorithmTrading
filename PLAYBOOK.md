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
| `src/api/alpaca_client.py` | Alpaca REST/WebSocket client behavior | `AlpacaClient`, `get_account()`, `submit_order()`, `get_positions()` | `tests/unit/python/test_alpaca_client_go_runtime.py`, `tests/test_alpaca_quick.py` |
| `src/api/alpaca_paper_trading.py` | Paper trading account/order lifecycle | `AlpacaPaperTrading`, `OrderType`, `PortfolioMetrics`, `TradeUpdate` | `tests/integration/test_alpaca_api.rs`, `tests/integration/test_end_to_end.rs` |

### 3.2 Data Layer (`src/data`)

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/data/fetcher.py` | Market data acquisition abstraction | `DataFetcher`, `fetch_historical_bars()`, `stream_live_quotes()` | `tests/unit/test_download_data.py` |
| `src/data/loader.py` | Data loading/parquet-csv bridge | `DataLoader`, `load_parquet()`, `save_dataset()` | `tests/unit/python/test_backtesting.py` |
| `src/data/preprocessor.py` | Cleaning/transforms | `DataPreprocessor`, `handle_missing_values()`, `normalize_features()` | `tests/unit/python/test_features.py` |
| `src/data/indicators.py` | Technical indicator calculations | `TechnicalIndicators`, `calculate_rsi()`, `calculate_macd()`, `calculate_bollinger_bands()` | `tests/unit/test_strategy_signals.py` |
| `src/data/features.py` | Feature engineering pipeline | `FeatureEngine`, `generate_momentum_features()`, `generate_volatility_features()` | `tests/unit/python/test_features.py`, `tests/unit/python/test_rust_feature_parity.py` |

### 3.3 Backtesting Layer (`src/backtesting`)

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/backtesting/engine.py` | Rust-only batch simulation engine | `BacktestEngine`, `run_simulation()`, `StrategyBatchInterfaceRequired` | `tests/unit/python/test_backtest_engine.py`, `tests/test_backtest_integration.py` |
| `src/backtesting/portfolio_handler.py` | Passive state container for portfolio (synced from Rust) | `PortfolioHandler`, `update_position()`, `calculate_equity()` | `tests/unit/test_portfolio_handler_shorts.py` |
| `src/backtesting/risk_integrity.py` | Golden risk decision comparator | `RiskIntegrityComparison`, `validate_decisions()` | `tests/unit/python/test_risk_integrity_comparator.py` |
| `src/backtesting/performance.py` | Performance analytics | `PerformanceAnalyzer`, `calculate_sharpe_ratio()`, `calculate_max_drawdown()` | `tests/unit/python/test_backtesting.py` |
| `src/backtesting/transaction_costs.py` | Cost/slippage models | `TransactionCostModel`, `OrderBookSlippageModel`, `estimate_slippage()` | `tests/unit/test_slippage.rs` |
| `src/backtesting/walk_forward.py` | Walk-forward optimization logic | `WalkForwardOptimizer`, `generate_folds()` | `tests/unit/python/test_backtesting.py` |

### 3.4 Bridge Layer (`src/bridge`)

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/bridge/zmq_bridge.py` | Envelope serialization + ZMQ handoff | `ZMQPublisher`, `ZMQSubscriber`, `Signal`, `Position`, `publish_event()` | `tests/integration/test_backtest_signal_flow.py` |
| `src/bridge/rust_bridge.py` | Python -> Rust feature bridge wrapper | `RustFeatureComputer`, `compute_features_batch()` | `tests/unit/python/test_rust_feature_parity.py` |
| `src/bridge/backtest_bridge.py` | Bridge to Rust authoritative runtime | `RustBacktestBridge`, `execute_rust_backtest()` | `tests/test_backtest_integration.py` |

### 3.5 Strategy Layer (`src/strategies`)

| File | Ownership | Key classes | Primary tests |
|---|---|---|---|
| `src/strategies/base.py` | Strategy contract + signal type | `SignalType`, `Signal`, `Strategy` (Abstract Base Class) | `tests/unit/test_strategy_signals.py` |
| `src/strategies/strategy_router.py` | Multi-strategy orchestration | `StrategyRouter`, `route_signal()`, `MarketRegime` enum | `tests/integration/test_backtest_signal_flow.py` |
| `src/strategies/momentum.py` | Momentum Strategy implementation | `MomentumStrategy`, `generate_signals()` | `tests/unit/test_momentum_strategy.py` |
| `src/strategies/ml_ensemble_strategy.py` | ML Ensemble Strategy | `MLEnsembleStrategy`, `predict_regime()`, `train_model()` | `tests/ml/test_models.py` |
| `src/strategies/mean_reversion.py` | Mean Reversion logic | `MeanReversionStrategy`, `calculate_zscore()` | `tests/unit/test_strategy_signals.py` |

---

## 4) Rust Ownership Map (`rust/*/src`)

### 4.1 `rust/common`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/common/src/types.rs` | Shared domain primitives | `Order` (struct), `Position` (struct), `Signal` (enum), `RiskReport` (struct) | `tests/unit/test_common_types.rs` |
| `rust/common/src/messaging.rs` | Cross-runtime envelope/messages | `Envelope` (struct), `Message` (enum), `serialize()`, `deserialize()` | integration contract tests |
| `rust/common/src/errors.rs` | Shared error surface | `TradingError` (enum), `Result<T>` type alias | `tests/unit/test_errors.rs` |
| `rust/common/src/health.rs` | Health status contract | `HealthCheck` (trait), `SystemHealth` (struct) | `tests/unit/test_common_health.rs` |
| `rust/common/src/http.rs` | Health/ready http helpers | `create_health_router()` (axum router setup) | service integration tests |
| `rust/common/src/config.rs` | Configuration management | `AppConfig`, `load_config()` | `tests/unit/test_common_types.rs` |

### 4.2 `rust/market-data`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/market-data/src/websocket.rs` | Alpaca stream ingestion | `WebSocketClient` (struct), `AlpacaMessage` (enum), `connect()`, `handle_message()` | `tests/integration/test_websocket.rs` |
| `rust/market-data/src/orderbook.rs` | Orderbook core | `FastOrderBook` (struct), `OrderBookManager` (struct), `update_level()` | `tests/unit/test_orderbook.rs` |
| `rust/market-data/src/aggregation.rs` | Bar/VWAP aggregation | `BarAggregator` (struct), `VwapCalculator` (struct), `aggregate_trades()` | integration data flow tests |
| `rust/market-data/src/publisher.rs` | Event publish layer | `MarketDataPublisher` (struct), `broadcast_tick()` | integration stream tests |
| `rust/market-data/src/main.rs` | Entry point | `main()`, `tokio::main` setup | `cargo test -p market-data` |

### 4.3 `rust/signal-bridge`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/signal-bridge/src/indicators.rs` | Low-latency indicators (RSI, MACD, etc) | `SMA` (struct), `EMA` (struct), `RSI` (struct), `MACD` (struct), `batch_log_returns()` | `cargo test -p signal-bridge` |
| `rust/signal-bridge/src/features.rs` | Feature computation logic | `FeatureEngine`, `compute_features()` | `cargo test -p signal-bridge` |
| `rust/signal-bridge/src/backtest_runtime.rs` | Rust-owned backtest kernel | `BacktestRuntime` (struct), `SignalRow` (struct), `run_step()` | `cargo test -p signal-bridge` |
| `rust/signal-bridge/src/bridge.rs` | PyO3 batch/Monte Carlo/Backtest bridge | `FeatureComputer` (struct), `BacktestRuntime` (struct) exposed via PyO3 `#[pyclass]` | `tests/test_backtest_integration.py` |

### 4.4 `rust/risk-manager`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/risk-manager/src/limits.rs` | Position/daily loss limits | `LimitChecker` (struct), `check_with_report()`, `PositionLimits` | `tests/unit/test_risk_manager.rs` |
| `rust/risk-manager/src/stops.rs` | Stop loss policies | `StopManager` (struct), `StopLossTrigger` (enum), `evaluate_stops()` | `tests/integration/test_stop_loss_integration.rs` |
| `rust/risk-manager/src/pnl.rs` | PnL accounting | `PnLTracker` (struct), `PositionState` (struct), `update_pnl()` | risk integration tests |
| `rust/risk-manager/src/circuit_breaker.rs` | Circuit state machine | `CircuitBreaker` (struct), `trigger_halt()`, `CircuitState` (enum) | risk-manager unit tests |
| `rust/risk-manager/src/reload.rs` | Dynamic config reloading | `ConfigReloader`, `watch_config_file()` | `tests/unit/test_risk_manager.rs` |

### 4.5 `rust/execution-engine`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/execution-engine/src/router.rs` | Order routing to broker | `OrderRouter` (struct), `AlpacaOrderRequest` (struct), `route_order()` | `tests/unit/test_execution_router.rs` |
| `rust/execution-engine/src/retry.rs` | Retry policy | `RetryPolicy` (struct), `should_retry()`, `calculate_backoff()` | `tests/unit/test_retry.rs` |
| `rust/execution-engine/src/slippage.rs` | Slippage estimation | `SlippageEstimator` (struct), `apply_slippage()` | `tests/unit/test_slippage.rs` |
| `rust/execution-engine/src/stop_loss_executor.rs` | Stop-loss order emission | `StopLossExecutor` (struct), `execute_stop_market()` | stop-loss integration tests |
| `rust/execution-engine/src/main.rs` | Entry point | `main()`, ZMQ listener setup | `cargo test -p execution-engine` |

### 4.6 `rust/database`

| File | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `rust/database/src/connection.rs` | DB connection manager | `ConnectionManager` (struct), `get_pool()` | `rust/database/src/tests.rs` |
| `rust/database/src/schema.rs` | Schema lifecycle | `Schema::create_all()`, `TableDefinitions` | storage integration tests |
| `rust/database/src/models.rs` | Metric/trade records | `MetricRecord` (struct), `TradeRecord` (struct) mapping to DB rows | `tests/integration/test_duckdb_storage.rs` |
| `rust/database/src/query.rs` | Query builders | `QueryBuilder`, `insert_trade()`, `fetch_metrics()` | `rust/database/src/tests.rs` |

---

## 5) Go Ownership Map (`go/`)

| Module | Ownership | Key types/functions | Primary tests |
|---|---|---|---|
| `go/cmd/server/main.go` | Entrypoint for Phase 3 API | `main()`, Env var parsing (`duckDBPath`, `sqlitePath`), Server Initialization | `tests/observability/test_go_parity.py` |
| `go/internal/http/routes.go` | HTTP Route definitions | `SetupRoutes()`, defining `/health`, `/metrics`, `/ws` | `go/internal/http/routes_test.go` |
| `go/internal/http/middleware.go` | HTTP Middleware | `AuthMiddleware()`, `RateLimitMiddleware()` | `go/internal/http/routes_test.go` |
| `go/internal/ws/manager.go` | WebSocket fanout logic | `Manager` struct, `ServeWS()`, `broadcastMessage()`, `Client` struct | `go/internal/ws/manager_test.go` |
| `go/internal/storage/duckdb.go` | DuckDB read adapter | `DuckDBReader` struct, `QueryAnalytics()`, Connection pooling setup | `tests/observability/test_go_parity.py` |
| `go/internal/storage/sqlite.go` | SQLite read adapter | `SQLiteReader` struct, `QueryTransactions()`, `InsertLog()` | `tests/observability/test_go_parity.py` |
| `go/internal/storage/postgres.go` | Postgres read/write adapter | `PostgresReader` struct, Database URL handling | `go/tests/integration/duckdb_integration_test.go` |
| `go/internal/health/aggregator.go` | Health aggregation logic | `Aggregator` struct, `CollectHealthStatus()`, `ComponentHealth` type | `tests/observability/test_go_parity.py` |
| `go/internal/worker/collector.go` | Metrics broadcast worker | `MetricsCollector` struct, `Start()`, `Stop()`, Time ticker loops | `tests/observability/test_go_parity.py` |
| `go/internal/alpaca/client.go` | Go-native Alpaca adapter | `Client` struct, `PlaceMarketOrder()`, `CancelOrder()` | `go/internal/alpaca/client_test.go` |
| `go/internal/integrity/integrity.go` | Go integrity gate evaluator | `ValidateRunIntegrity()`, Checking `schema_version` and invariants | `go/internal/integrity/integrity_test.go` |
| `go/internal/zmqbridge/envelope.go` | ZMQ Envelope handling | `Envelope` struct parsing, Message deserialization logic | `go/internal/zmqbridge/envelope_test.go` |

---

## 6) Deployment & Infrastructure (`deployment/`)

| Path | Responsibility | Key components |
|---|---|---|
| `deployment/docker-compose.yml` | Primary runtime orchestration | Services: `market_data_service`, `order_execution_service`, `risk_management_service`, `strategy_engine`, `api_gateway`. Network: `trading_network`. |
| `deployment/docker-compose.observability.yml` | Control plane orchestration | Services: `observability-api` (Go server on port 8081). Replaces Python FastAPI. |
| `deployment/docker-compose.staging.yml` | Staging environment overrides | Staging specific environment variables and resource limits. |
| `deployment/docker-compose.dev.yml` | Development environment overrides | Hot-reloading configs and exposed debug ports. |
| `deployment/monitoring/` | Monitoring stack configs | `prometheus.yml`, `alertmanager.yml`, `alerts/trading_system.yml` (alert rules). |
| `deployment/grafana/` | Grafana dashboard provisioning | `dashboards/staging-performance.json`, `provisioning/dashboards.yml`, `provisioning/datasources.yml`. |
| `docs/deployment/PRODUCTION_DEPLOYMENT.md` | Authoritative deployment guide | Lifecycle, security, rollback instructions. Required reading before prod changes. |
| `docs/deployment/DEPENDENCY_INSTALLATION.md` | Unified runtime sync guide | `rustup`, `uv`, `go` environment synchronization procedures. |
| `deployment/Makefile` | Docker stack management commands | `make up`, `make down`, `make health`, `make logs`. |
| `deployment/Dockerfile` | Multi-stage Rust build | Builder stage -> Runtime stages for each Rust binary (`market_data_service`, etc.). |
| `deployment/go.Dockerfile` | Go control plane build | Multi-stage Alpine build for the `observability-api` binary. |

---

## 7) Mobile Apps (Standalone)

### 7.1 Android App (`android/`)

Standalone Android project (Jetpack Compose + Material 3). Migrated from `leposapp/androidApp` with shared module inlined.

| Path | Ownership | Key Components |
|---|---|---|
| `android/app/build.gradle.kts` | App build config (all deps inline) | Compose, Firebase, Ktor, Koin dependencies defined here. |
| `android/app/src/main/kotlin/.../MainActivity.kt` | Entry point | `MainActivity` inheriting `ComponentActivity`, setting Compose content. |
| `android/app/src/main/kotlin/.../LeposApp.kt` | Application class | `LeposApp`, Firebase App initialization, Koin `startKoin` block. |
| `android/app/src/main/kotlin/.../core/` | Core utilities (Result, AppError, Dispatchers) | `Result` (Sealed class), `AppError` (Sealed class), `DispatcherProvider` (Interface & Impl). |
| `android/app/src/main/kotlin/.../data/` | Data layer (DTOs, mappers, network, repos) | `ApiService` (Ktor), `BundleRepositoryImpl`, `TokenStorageImpl`. |
| `android/app/src/main/kotlin/.../domain/` | Domain models, ports, use cases | `Bundle` (data class), `MiniApp` (data class), `BundleDownloader` interface, `GetBundlesUseCase`. |
| `android/app/src/main/kotlin/.../di/` | DI modules (Koin) | `AndroidModule.kt`, `SharedModule.kt` defining singletons and factory instances. |
| `android/app/src/main/kotlin/.../ui/` | All UI screens (Compose) | `MainScreen` (Bottom Nav), `ProfileScreen`, `AccountOverviewScreen`, `ActivityScreen`, `LoginScreen`, `HomeScreen`. |
| `android/app/src/main/kotlin/.../navigation/` | Jetpack Navigation structure | `Route.kt` (Sealed classes for type-safe routing), `AppNavigation.kt` (NavHost setup). |
| `android/app/src/main/kotlin/.../runtime/` | WebRuntime + capabilities | `PlatformCapabilities`, `GestureValidator`, `WebRuntimeViewModel` for Mini Apps. |

### 7.2 iOS App (`ios/`)

Standalone iOS project (SwiftUI + Liquid Glass). Migrated from `leposapp/iosApp` with native Swift replacing KMP Shared framework.

| Path | Ownership | Key Components |
|---|---|---|
| `ios/iosApp.xcodeproj` | Xcode project config | Build settings, SPM dependencies, Target configurations. |
| `ios/iosApp/iOSApp.swift` | Entry point | `@main struct iOSApp: App`, lifecycle management. |
| `ios/iosApp/Shared/Core/` | Core (Result, AppError, Dispatchers) | `AppResult` (enum), `AppError` (enum), `AppDispatcher` helper. |
| `ios/iosApp/Shared/Domain/Models/` | Domain models (native Swift) | `Bundle_` (struct), `MiniApp` (struct), `User` (struct), `FeaturedApp` (struct). |
| `ios/iosApp/Shared/Domain/Repositories.swift` | Repository protocols | `BundleRepository` (protocol), `TodayRepository` (protocol), `LoginRepository` (protocol). |
| `ios/iosApp/Shared/Domain/UseCases.swift` | Use cases | `GetBundlesUseCase` (struct), `DownloadBundleUseCase` (struct). |
| `ios/iosApp/Shared/Data/` | Data layer (networking, mock repos) | `ApiService` (URLSession wrapper), `TokenStorage`, Mock repository implementations. |
| `ios/iosApp/Shared/Runtime/` | Runtime capabilities | `PlatformCapabilities`, `GestureValidator`. |
| `ios/iosApp/Coordinators/` | Navigation routing state | `NavigationViewModel` (ObservableObject), `AppRoute` (enum). |
| `ios/iosApp/DI/` | Dependency injection | `SharedComponent`, `AppDependencyContainer` managing protocol-to-implementation resolution. |
| `ios/iosApp/Views/` | All UI views (SwiftUI) | `MainTabView`, `HomeView`, `ProfileView`, `AccountOverviewView`, `ActivityView`, `LoginView`. |
| `ios/iosApp/DesignSystem/` | Design tokens | Color extensions, Typography structs, Spacing constants, LiquidGlass view modifiers. |
| `ios/iosApp/DesignSystem/PlatformVersion.swift` | Cross-version gates | `SupportedOSVersion` (enum), `PlatformVersion` helpers for OS 15/16/17/18/26 and WWDC25 checks. |
| `ios/iosApp/DesignSystem/AdaptiveSurfaceModifiers.swift` | UI compatibility layer | `AdaptiveGlassContainer`, `adaptiveGlass`, `adaptiveGlassButton`, `adaptiveBackgroundExtension`, `adaptiveTabBarMinimizeOnScroll`. |
| `ios/iosApp/Shared/Runtime/WebRuntimeManifest.swift` | Runtime launch manifest model | `WebRuntimeManifest` dùng cho route `.miniApp` và runtime launch contract. |
| `ios/iosApp/Shared/Services/AppInstallationService.swift` | Local install-state service | `AppInstallationService` (UserDefaults-backed) cho trạng thái cài/gỡ mini app. |
| `ios/iosApp/DesignSystem/ScrollOffsetCompat.swift` | Scroll offset compatibility helper | `onCompatScrollOffsetChange(...)` thay thế API `onScrollGeometryChange` iOS 18+ trên các màn Home/Discovery/Profile/Library/Details. |
| `ios/iosApp/DesignSystem/GlassCompat.swift` | Glass effect compatibility shim | `glassEffect()` fallback qua `adaptiveGlass(...)` để tránh availability lỗi iOS 26 APIs. |
| `ios/iosApp/DesignSystem/DesignTokens.swift` | Standalone token fallback | `DesignTokens` light/dark/colors/spacing/typography để thay thế dependency token generator bị thiếu trong target iOS standalone. |
| `ios/Libraries/AdaptiveSwiftUi/` | Reusable SwiftUI compatibility package | `Package.swift` + `AdaptivePlatformVersion` + adaptive wrappers for Glass, ButtonSizing, TabView, Sheet, List, Navigation across OS 15/16/17/18/26. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveTabViews.swift` | Tab view compatibility (all modifiers) | `AdaptiveTabViewStyle`, `adaptiveTabViewStyle(_:)`, `adaptiveTabBarMinimizeBehavior(_:)`, `adaptiveTabViewBottomAccessory(content:)`, sidebar header/footer/bottomBar, `adaptiveDefaultAdaptableTabBarPlacement(_:)`, `adaptiveTabViewCustomization(_:)`, `adaptiveCustomizationBehavior(_:for:)`, `adaptiveSectionActions(_:)`, `adaptiveTabBadge(_:)`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveTabViewComponents.swift` | Tab view concrete types | `AdaptiveValueTab(...)`, `AdaptiveTabSection(...)`, `AdaptiveTabViewBottomAccessoryPlacementReader` for iOS 26+ environment reading. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveToolbars.swift` | Toolbar compatibility wrappers | `AdaptiveToolbarTitlePlacement`, `AdaptiveToolbarSpacer`, `adaptiveSharedBackgroundVisibility(_:)`, `adaptiveNavigationSubtitle(_:)`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveSliders.swift` | Slider compatibility wrappers | `AdaptiveSliderTick`, `AdaptiveSliderTickContentForEach`, `adaptiveSliderTint(_:)`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveGauges.swift` | Gauge compatibility wrappers | `AdaptiveGaugeStyle`, `adaptiveGaugeStyle(_:)`, `adaptiveGaugeTint(_:)`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveProgressViews.swift` | Progress view compatibility wrappers | `AdaptiveProgressViewStyle`, `adaptiveProgressViewStyle(_:)`, `adaptiveProgressTint(_:)`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveMenus.swift` | Menu compatibility wrappers | `AdaptiveMenuOrder`, `adaptiveMenuOrder(_:)`, `adaptiveContextMenu(menuItems:preview:)`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveViewThatFits.swift` | ViewThatFits compatibility wrappers | `AdaptiveViewThatFitsAxes`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveGroupBoxes.swift` | Group box compatibility wrappers | `adaptiveGroupBoxBackgroundStyle(_:)`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveScrollViews.swift` | Scroll view compatibility wrappers | `AdaptiveScrollEdgeEffectStyle`, `adaptiveScrollEdgeEffectStyle(_:for:)`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveViews.swift` | Generic view-level compatibility wrappers | `adaptiveControlSize(_:)`, `adaptiveBackgroundExtensionEffect()`, `adaptiveGlassEffect()`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveColors.swift` | Color and gradient compatibility wrappers | `AdaptiveColorHierarchy`, `adaptiveForegroundStyle(_:gradient:hierarchy:opacity:)`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveMaterials.swift` | Material compatibility wrappers | `adaptiveBackgroundMaterial(_:)`, `adaptiveForegroundMaterial(_:)`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveControlGroups.swift` | Control group compatibility wrappers | `AdaptiveControlGroupStyleType`, `adaptiveControlGroupStyle(_:)`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveNavigations.swift` | Navigation compatibility wrappers | `adaptiveNavigationTitle(_:subtitle:)`, `adaptiveContainerBackground`, `adaptiveScrollEdgeHardEffect`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveDividers.swift` | Divider compatibility wrappers | `adaptiveDividerColor(_:)`, `adaptiveDividerThickness(_:axis:)`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveLists.swift` | List compatibility wrappers | `AdaptiveListStyleType`, `adaptiveListStyle(_:)`, `adaptiveListRowSeparator(_:)`, `adaptiveSwipeActions(edge:allowsFullSwipe:content:)`, `adaptiveRefreshable(action:)`, etc. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveDatePickers.swift` | Date picker compatibility wrappers | `AdaptiveMultiDatePicker`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptivePickers.swift` | Picker compatibility wrappers | `AdaptivePickerStyle`, `adaptivePickerStyle(_:)`, `adaptiveHorizontalRadioGroupLayout()`, `adaptiveDefaultWheelPickerItemHeight(_:)`. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Compatibility/AdaptiveSheets.swift` | Sheet compatibility wrappers | `adaptivePresentationDetents`, `adaptivePresentationSizing`, `adaptiveInteractiveDismissDisabled`, `adaptivePresentationBackground`, etc. fallbacks. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveRoleButton.swift` | Role button cross-version component | `AdaptiveButtonRole`, `AdaptiveRoleButton`, `AdaptiveRenameButton`, `AdaptivePasteButton`, `AdaptiveEditButton` with iOS 26 roles/styles and legacy fallbacks. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveButton.swift` | Generic adaptive button component | `AdaptiveButton` supporting all styles (including iOS 26 glass), sizing, tints, and border shapes across OS versions. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveSlider.swift` | Generic adaptive slider component | `AdaptiveSlider` supporting iOS 26 tick system and tinting across OS versions. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptivePicker.swift` | Generic adaptive picker component | `AdaptivePicker` supporting various styles and iOS 18 currentValueLabel across OS versions. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveDatePicker.swift` | Generic adaptive date picker component | `AdaptiveDatePicker` supporting styles, ranges, and components across OS versions. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveProgressView.swift` | Generic adaptive progress view component | `AdaptiveProgressView` supporting various styles, value/timer modes, and labels with fallbacks. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveMenu.swift` | Generic adaptive menu component | `AdaptiveMenu` supporting primary actions and various labels across OS versions. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveViewThatFits.swift` | Generic adaptive view selection component | `AdaptiveViewThatFits` automatically choosing the best fitting view with fallback support. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveGroupBox.swift` | Generic adaptive group box component | `AdaptiveGroupBox` providing boxed content with label and fallbacks. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveScrollView.swift` | Generic adaptive scroll view component | `AdaptiveScrollView` wrapping the native ScrollView for library consistency. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveColor.swift` | Adaptive color namespace | `AdaptiveColor` providing static UIKit bridge colors and modern color polyfills. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveText.swift` | Generic adaptive text component | `AdaptiveText` wrapping text formatting logic with formatters fallback. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveMaterial.swift` | Generic adaptive material component | `AdaptiveMaterial` providing UIVisualEffectView fallback for background blur. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveControlGroup.swift` | Generic adaptive control group component | `AdaptiveControlGroup` providing grouped controls with legacy layout fallback. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveLinks.swift` | Generic adaptive links components | `AdaptiveLink`, `AdaptiveShareLink`, `AdaptiveHelpLink`, `AdaptiveTextFieldLink` providing fallbacks for navigation and sharing. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveGlassEffectContainer.swift` | Glass effect container | `AdaptiveGlassEffectContainer` for morphing liquid glass components. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveDivider.swift` | Generic adaptive divider component | `AdaptiveDivider` supporting axis-aware orientation, custom color, and thickness. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveList.swift` | Generic adaptive list component | `AdaptiveList` supporting adaptive styles and data-driven instantiation. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveDisclosureGroup.swift` | Generic adaptive disclosure group component | `AdaptiveDisclosureGroup` providing expanding views with fallback. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveOutlineGroup.swift` | Generic adaptive outline group component | `AdaptiveOutlineGroup` for hierarchical trees with fallback. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveGauge.swift` | Generic adaptive gauge component | `AdaptiveGauge` supporting various styles and fallbacks across OS versions. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveContentUnavailable.swift` | Empty-state compatibility components | `AdaptiveContentUnavailable`, `AdaptiveSearchUnavailable` with `ContentUnavailableView` passthrough on supported OS and fallback UI on older OS. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveConcentricRectangle.swift` | Concentric rectangle shape | `AdaptiveConcentricRectangle` Shape providing a seamless fallback to `RoundedRectangle` on OS versions < 26.0. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveShapes.swift` | Shape components | `AdaptiveContainerRelativeShape` for relative container contexts. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveLabels.swift` | Label components | `AdaptiveLabel`, `adaptiveLabelStyle(_:)` providing fallback for iOS 13. |
| `ios/Libraries/AdaptiveSwiftUi/Sources/AdaptiveSwiftUi/Components/AdaptiveLabeledContent.swift` | Labeled content components | `AdaptiveLabeledContent` providing fallback for iOS 13-15. |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/CompileContractsTests.swift` | Compile/fallback contract tests | Smoke coverage for `adaptive*` wrappers, version flags, tab customization storage API, and cross-module integration compile checks. |

---

## 8) Frontend Landing Page (`frontend/`)

| Path | Responsibility | Key components |
|---|---|---|
| `frontend/app/page.tsx` | Landing page composition | Main entry point composing `Hero`, `Benefits`, `Features`, `Pricing`, `Contact`, `FAQ`, `Footer`. |
| `frontend/app/layout.tsx` | Global layout wrapper | Root HTML layout, font loading, `ThemeProvider` injection. |
| `frontend/app/globals.css` | Tailwind/shadcn theme tokens | CSS variables for Light/dark trading platform palette. |
| `frontend/components/layout/` | Page shell and section components | `navbar.tsx`, `theme-provider.tsx`, `sections/hero.tsx`, `sections/features.tsx`, `sections/pricing.tsx`. |
| `frontend/components/ui/` | shadcn source components | Primitive UI elements: `button.tsx`, `card.tsx`, `sheet.tsx`, `navigation-menu.tsx`, `accordion.tsx`, `form.tsx`. |
| `frontend/public/` | Static landing assets | Images, SVG icons, Favicon. |
| `frontend/package.json` | Dependencies and scripts | Next.js, React, Tailwind, Framer Motion, Lucide icons dependencies. |

Validate with:

```bash
cd frontend && npm run typecheck && npm run build
```

---

## 9) Documentation Index (`docs/`)

| Folder | Focus | Key Authority |
|---|---|---|
| `docs/architecture/` | System Design | `SYSTEM_ARCHITECTURE.md`, `python-rust-separation.md`, `component-interfaces.md`. |
| `docs/api/` | Contracts | `ZMQ_PROTOCOL.md` (messaging format), `ALPACA_API.md` (broker integration), `DATABASE_MODULE.md`. |
| `docs/observability/` | Monitoring | `OBSERVABILITY_OVERVIEW.md`, `METRICS_CATALOG.md`, `STORAGE_OPERATIONS.md`, `PHASE3_API_PARITY_MATRIX.md`. |
| `docs/operations/` | Day-to-Day | `OPERATIONS_GUIDE.md` (ops manual). |
| `docs/optimization/` | Performance | `PERFORMANCE_GUIDE.md` (Rust tuning). |
| `docs/security/` | Hardening | `SECURITY_STANDARDS.md` (Panic-free guarantees, payload signing). |
| `docs/setup/` | Provisioning | `DEVELOPMENT.md` (local machine setup). |
| `docs/roadmap/` | Lifecycle | `COMPLETION_REPORT.md` (Phase 3.5 final status). |
| `docs/guides/` | How-Tos | `RISK_MANAGEMENT_GUIDE.md`, `strategy-development.md`, `ERROR_HANDLING_PATTERNS.md`. |
| `docs/ml/` | Machine Learning | `ML_STRATEGY_GUIDE.md`. |

---

## 10) Fast Routing Matrix (Doc -> Code -> Test)

| Symptom | Read first | Inspect first | Validate first |
|---|---|---|---|
| Alpaca Auth/API | `docs/api/ALPACA_API.md` | `src/api/alpaca_client.py` | `tests/test_alpaca_quick.py` |
| Signal Mismatch | `docs/api/ZMQ_PROTOCOL.md` | `rust/signal-bridge/src/indicators.rs` | `tests/unit/test_strategy_signals.py` |
| Risk Reject | `docs/guides/RISK_MANAGEMENT_GUIDE.md` | `rust/risk-manager/src/limits.rs` | `tests/unit/test_risk_manager.rs` |
| Execution Retry | `docs/architecture/component-interfaces.md` | `rust/execution-engine/src/retry.rs` | `tests/unit/test_retry.rs` |
| DB Persistence | `docs/observability/STORAGE_OPERATIONS.md` | `go/internal/storage/duckdb.go` | `tests/integration/test_duckdb_storage.rs` |
| Observability/Go | `docs/observability/OBSERVABILITY_OVERVIEW.md` | `go/cmd/server/main.go` | `tests/observability/test_go_parity.py` |

---

## 11) Path-Triggered Minimum Tests

- `src/api/**` -> `python -m pytest tests/test_alpaca_*.py -q`
- `src/data/**` -> `python -m pytest tests/unit/python/test_features.py -q`
- `src/strategies/**` -> `python -m pytest tests/unit/test_strategy_signals.py -q`
- `src/backtesting/**` -> `python -m pytest tests/test_backtest_integration.py -q`
- `rust/market-data/**` -> `cd rust && cargo test -p market-data`
- `rust/signal-bridge/**` -> `cd rust && cargo test -p signal-bridge`
- `rust/risk-manager/**` -> `cd rust && cargo test -p risk-manager`
- `rust/execution-engine/**` -> `cd rust && cargo test -p execution-engine`
- `go/**` -> `cd go && go test ./...`
- `frontend/**` -> `cd frontend && npm run typecheck && npm run build`

---

## 12) Maintenance Contract

1. Any new project file must be added to this playbook in the same change.
2. Keep edit scope minimal and owner-centered.
3. If docs conflict with code, follow runtime code and patch docs.
4. **Never delete routing tables or ownership maps; they are the platform's brain.**

---

## 13) Test Ownership Map (`tests/`)

| Folder | Ownership | Primary Language | Key Files |
|---|---|---|---|
| `tests/unit/python/` | Python Unit Tests | Python | `test_backtest_engine.py`, `test_rust_feature_parity.py`, `test_features.py`, `test_portfolio_controls.py`. |
| `tests/unit/` | Rust Unit Tests | Rust | `test_common_types.rs`, `test_risk_manager.rs`, `test_orderbook.rs`, `test_execution_router.rs`, `test_slippage.rs`. |
| `tests/integration/` | Cross-runtime Integration | Mixed | `test_backtest_signal_flow.py` (Python->Rust), `test_websocket.rs` (Rust->Alpaca), `test_duckdb_storage.rs`. |
| `tests/e2e/` | Full System Flows | Python | `test_full_system.py` (End to end execution validation). |
| `tests/observability/` | Go API & Metrics Parity | Python/Go | `test_go_parity.py` (Validates Go API responses match legacy Python), `test_api.py`. |
| `tests/benchmarks/` | Performance Gates | Python/Rust | `backtest_engine_production_benchmark.py` (Ensures performance regressions don't occur). |
| `tests/ml/` | ML Strategy Validation | Python | `test_feature_engineering.py`, `test_models.py` (Model inference checks). |
| `tests/property/` | Property-based tests | Rust | `test_order_invariants.rs` (Fuzzing constraints). |
| `tests/fixtures/` | Test Data & Golden Artifacts | JSON/Parquet | `risk_decision_golden.json`, `phase2/` snapshots for regression testing. |

---
## 14) iOS Package Test Fixture Map (`ios/Libraries/AdaptiveSwiftUi`)

| File | Ownership | Role | Primary test |
|---|---|---|---|
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Fixtures/exploreswiftui_feed.xml` | AdaptiveSwiftUi test suite | Frozen RSS snapshot fixture used for full-coverage parsing assertions (case/component completeness). | `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/CompileContractsTests.swift::testExploreSwiftUIRSSFixtureHasFullCoverage` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Fixtures/exploreswiftui_feed.json` | AdaptiveSwiftUi test suite | Structured JSON version of the RSS feed for simplified test assertions and automated component mapping. | `AdaptiveSwiftUiTests` (JSON Data Driven) |
| `ios/scripts/parse_rss.py` | iOS platform scripts | Python utility to parse the Explore SwiftUI RSS feed XML into structured JSON. | `N/A` (Developer tool) |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/RSSParameterizedTests.swift` | AdaptiveSwiftUi test suite | Parameterized Swift Testing suite that expands RSS validation into 184 per-item tests and 28 per-component tests. | `rssCaseValidity`, `rssComponentCoverage` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/RSSHardeningTests.swift` | AdaptiveSwiftUi test suite | Parser hardening and strict gates: malformed XML, missing content, duplicate/invalid GUID behavior, snapshot invariants, p95 performance gate. | `RSSHardeningTests` |
| `ios/scripts/ios/package_ci.sh` | iOS platform scripts | Deterministic local CI runner for package reset, cache cleanup, test, and coverage. | Used by CI coverage job and local release rehearsal |
| `.github/workflows/ios-adaptive-swiftui.yml` | CI/CD workflow ownership | Dedicated macOS library pipeline: lint/format, swift test, coverage artifacts, iosApp integration compile, tag release artifacts. | GitHub Actions `iOS AdaptiveSwiftUi Library CI` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/ButtonsSmokeTests.swift` | AdaptiveSwiftUi Smokes | Buttons group | `testButtonsContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/ToolbarsSmokeTests.swift` | AdaptiveSwiftUi Smokes | Toolbars group | `testToolbarsContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/SlidersSmokeTests.swift` | AdaptiveSwiftUi Smokes | Sliders group | `testSlidersContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/PickersSmokeTests.swift` | AdaptiveSwiftUi Smokes | Pickers group | `testPickersContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/DatePickersSmokeTests.swift` | AdaptiveSwiftUi Smokes | Date Pickers group | `testDatePickersContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/GaugesSmokeTests.swift` | AdaptiveSwiftUi Smokes | Gauges group | `testGaugesContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/ProgressViewsSmokeTests.swift` | AdaptiveSwiftUi Smokes | Progress Views group | `testProgressViewsContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/ContentUnavailableViewsSmokeTests.swift` | AdaptiveSwiftUi Smokes | Content Unavailable Views group | `testContentUnavailableViewsContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/MenusSmokeTests.swift` | AdaptiveSwiftUi Smokes | Menus group | `testMenusContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/ViewThatFitsSmokeTests.swift` | AdaptiveSwiftUi Smokes | View That Fits group | `testViewThatFitsContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/DividersSmokeTests.swift` | AdaptiveSwiftUi Smokes | Dividers group | `testDividersContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/ListsSmokeTests.swift` | AdaptiveSwiftUi Smokes | Lists group | `testListsContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/GroupBoxesSmokeTests.swift` | AdaptiveSwiftUi Smokes | Group Boxes group | `testGroupBoxesContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/ScrollViewsSmokeTests.swift` | AdaptiveSwiftUi Smokes | Scroll Views group | `testScrollViewsContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/ColorsSmokeTests.swift` | AdaptiveSwiftUi Smokes | Colors group | `testColorsContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/TextSmokeTests.swift` | AdaptiveSwiftUi Smokes | Text group | `testTextContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/MaterialSmokeTests.swift` | AdaptiveSwiftUi Smokes | Material group | `testMaterialContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/LinksSmokeTests.swift` | AdaptiveSwiftUi Smokes | Links group | `testLinksContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/ControlGroupsSmokeTests.swift` | AdaptiveSwiftUi Smokes | Control Groups group | `testControlGroupsContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/NavigationSmokeTests.swift` | AdaptiveSwiftUi Smokes | Navigation group | `testNavigationContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/TabViewsSmokeTests.swift` | AdaptiveSwiftUi Smokes | Tab Views group | `testTabViewsContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/ViewsSmokeTests.swift` | AdaptiveSwiftUi Smokes | Views group | `testViewsContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/GlassEffectContainersSmokeTests.swift` | AdaptiveSwiftUi Smokes | Glass Effect Containers group | `testGlassEffectContainersContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/ShapesSmokeTests.swift` | AdaptiveSwiftUi Smokes | Shapes group | `testShapesContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/LabelsSmokeTests.swift` | AdaptiveSwiftUi Smokes | Labels group | `testLabelsContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/LabeledContentSmokeTests.swift` | AdaptiveSwiftUi Smokes | Labeled Content group | `testLabeledContentContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/ConcentricRectanglesSmokeTests.swift` | AdaptiveSwiftUi Smokes | Concentric Rectangles group | `testConcentricRectanglesContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/Tests/AdaptiveSwiftUiTests/Smokes/SheetsSmokeTests.swift` | AdaptiveSwiftUi Smokes | Sheets group | `testSheetsContractsCompile` |
| `ios/Libraries/AdaptiveSwiftUi/docs/CHANGELOG.md` | iOS package release engineering | Internal semantic tag changelog and release checklist for rc/stable promotions. | Reviewed during `v0.1.0-rcN` and `v0.1.0` release gates |
| `ios/Libraries/AdaptiveSwiftUi/docs/ROLLBACK_RUNBOOK.md` | iOS package operations | Rollback procedure and drill checklist to return to previous stable tag within SLA. | Rollback rehearsal in release phase |

---
**Architect**: Antigravity AI
**Status**: Authoritative Playbook (PHASE 3.5 FULL SYSTEM & TESTS RESTORED)
