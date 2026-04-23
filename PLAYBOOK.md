# PLAYBOOK.md - Doc -> Code -> Test Deep Map (Python + Rust)

Tài liệu này là bản đồ triển khai chi tiết ở mức từng file và từng class/type cho code Python và Rust trong dự án.

Phạm vi:
- Python: toàn bộ src/**/*.py
- Rust: toàn bộ rust/*/src/*.rs

Mục tiêu sử dụng:
1. Từ doc đi thẳng đến file code đúng.
2. Hiểu vai trò từng class/type trước khi sửa.
3. Chọn test phù hợp khi thay đổi.

---

## 1) Cách đọc playbook

Mỗi file có 3 phần:
- Vai trò file: file dùng để làm gì trong hệ thống.
- Class/Type: các class (Python) hoặc struct/enum/trait (Rust) và ý nghĩa.
- Test liên quan: nhóm test nên ưu tiên chạy khi sửa file này.

---

## 2) Python Source Map (src/**/*.py)

### src/__init__.py

- Vai trò file: File package marker/export module.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: pytest tests -q (chọn subset theo phạm vi sửa).

### src/api/__init__.py

- Vai trò file: Tầng tích hợp broker/API (Alpaca), account/order/market data operations.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/test_alpaca_*.py, tests/integration/test_alpaca_api.rs, tests/integration/test_end_to_end.rs, tests/integration/test_concurrent.rs.

### src/api/alpaca_client.py

- Vai trò file: Tầng tích hợp broker/API (Alpaca), account/order/market data operations.
- Class trong file:
  - AlpacaClient: Client truy cập dịch vụ ngoài hoặc lớp lưu trữ.
- Test liên quan: tests/test_alpaca_*.py, tests/integration/test_alpaca_api.rs, tests/integration/test_end_to_end.rs, tests/integration/test_concurrent.rs.

### src/api/alpaca_paper_trading.py

- Vai trò file: Tầng tích hợp broker/API (Alpaca), account/order/market data operations.
- Class trong file:
  - OrderType: Lớp nghiệp vụ trong module.
  - PortfolioMetrics: Data object/domain object cho event, signal, position hoặc metric.
  - PositionInfo: Data object/domain object cho event, signal, position hoặc metric.
  - AlpacaPaperTrading: Lớp nghiệp vụ trong module.
- Test liên quan: tests/test_alpaca_*.py, tests/integration/test_alpaca_api.rs, tests/integration/test_end_to_end.rs, tests/integration/test_concurrent.rs.

### src/backtesting/__init__.py

- Vai trò file: Tầng mô phỏng giao dịch lịch sử, execution simulation, metrics và walk-forward.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/backtesting/data_handler.py

- Vai trò file: Tầng mô phỏng giao dịch lịch sử, execution simulation, metrics và walk-forward.
- Class trong file:
  - HistoricalDataHandler: Xử lý luồng dữ liệu/sự kiện trong module (execution, data, logging queue...).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/backtesting/engine.py

- Vai trò file: Tầng mô phỏng giao dịch lịch sử, execution simulation, metrics và walk-forward.
- Class trong file:
  - BacktestEngine: Lõi xử lý chính của module (backtest/feature/... ).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/backtesting/execution_handler.py

- Vai trò file: Tầng mô phỏng giao dịch lịch sử, execution simulation, metrics và walk-forward.
- Class trong file:
  - SimulatedExecutionHandler: Xử lý luồng dữ liệu/sự kiện trong module (execution, data, logging queue...).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/backtesting/metrics.py

- Vai trò file: Tầng mô phỏng giao dịch lịch sử, execution simulation, metrics và walk-forward.
- Class trong file:
  - PerformanceMetrics: Data object/domain object cho event, signal, position hoặc metric.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/backtesting/performance.py

- Vai trò file: Tầng mô phỏng giao dịch lịch sử, execution simulation, metrics và walk-forward.
- Class trong file:
  - PerformanceAnalyzer: Phân tích performance/risk hoặc thống kê hậu kiểm.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/backtesting/portfolio_handler.py

- Vai trò file: Tầng mô phỏng giao dịch lịch sử, execution simulation, metrics và walk-forward.
- Class trong file:
  - PortfolioHandler: Xử lý luồng dữ liệu/sự kiện trong module (execution, data, logging queue...).
  - PositionSizer: Data object/domain object cho event, signal, position hoặc metric.
  - FixedAmountSizer: Lớp nghiệp vụ trong module.
  - PercentageOfEquitySizer: Lớp nghiệp vụ trong module.
  - KellyPositionSizer: Data object/domain object cho event, signal, position hoặc metric.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/backtesting/transaction_costs.py

- Vai trò file: Tầng mô phỏng giao dịch lịch sử, execution simulation, metrics và walk-forward.
- Class trong file:
  - TransactionCost: Lớp nghiệp vụ trong module.
  - TransactionCostModel: Lớp mô hình dữ liệu hoặc ML model abstraction/implementation.
  - OrderBookSlippageModel: Lớp mô hình dữ liệu hoặc ML model abstraction/implementation.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/backtesting/walk_forward.py

- Vai trò file: Tầng mô phỏng giao dịch lịch sử, execution simulation, metrics và walk-forward.
- Class trong file:
  - WalkForwardWindow: Lớp nghiệp vụ trong module.
  - WalkForwardAnalyzer: Phân tích performance/risk hoặc thống kê hậu kiểm.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/bridge/__init__.py

- Vai trò file: Lớp cầu nối Python <-> Rust hoặc Python <-> ZMQ runtime.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/test_alpaca_*.py, tests/integration/test_alpaca_api.rs, tests/integration/test_end_to_end.rs, tests/integration/test_concurrent.rs.

### src/bridge/rust_bridge.py

- Vai trò file: Lớp cầu nối Python <-> Rust hoặc Python <-> ZMQ runtime.
- Class trong file:
  - MarketBar: Lớp nghiệp vụ trong module.
  - RustFeatureComputer: Lớp nghiệp vụ trong module.
- Test liên quan: tests/test_alpaca_*.py, tests/integration/test_alpaca_api.rs, tests/integration/test_end_to_end.rs, tests/integration/test_concurrent.rs.

### src/bridge/zmq_bridge.py

- Vai trò file: Lớp cầu nối Python <-> Rust hoặc Python <-> ZMQ runtime.
- Class trong file:
  - MessageType: Lớp nghiệp vụ trong module.
  - Signal: Data object/domain object cho event, signal, position hoặc metric.
  - Position: Data object/domain object cho event, signal, position hoặc metric.
  - ZMQPublisher: Lớp nghiệp vụ trong module.
  - ZMQSubscriber: Lớp nghiệp vụ trong module.
- Contract behavior (Week 3 one-pass):
  - Envelope bắt buộc có `schema_version=v1.0.0`, `correlation_id`, `event_type`, `timestamp`, `payload`.
  - Parse flow: `envelope -> payload`, reject có cấu trúc khi mismatch và không crash pipeline.
  - Legacy normalization (nội bộ): `direction/strength -> action/confidence`.
- Test liên quan: tests/test_alpaca_*.py, tests/integration/test_alpaca_api.rs, tests/integration/test_end_to_end.rs, tests/integration/test_concurrent.rs, tests/integration/test_backtest_signal_flow.py.

### src/data/__init__.py

- Vai trò file: Tầng dữ liệu: tải dữ liệu, tiền xử lý, chỉ báo và feature engineering.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/data/features.py

- Vai trò file: Tầng dữ liệu: tải dữ liệu, tiền xử lý, chỉ báo và feature engineering.
- Class trong file:
  - FeatureEngine: Lõi xử lý chính của module (backtest/feature/... ).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/data/fetcher.py

- Vai trò file: Tầng dữ liệu: tải dữ liệu, tiền xử lý, chỉ báo và feature engineering.
- Class trong file:
  - DataFetcher: Lớp nghiệp vụ trong module.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/data/indicators.py

- Vai trò file: Tầng dữ liệu: tải dữ liệu, tiền xử lý, chỉ báo và feature engineering.
- Class trong file:
  - TechnicalIndicators: Lớp nghiệp vụ trong module.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/data/loader.py

- Vai trò file: Tầng dữ liệu: tải dữ liệu, tiền xử lý, chỉ báo và feature engineering.
- Class trong file:
  - DataLoader: Lớp nghiệp vụ trong module.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/data/preprocessor.py

- Vai trò file: Tầng dữ liệu: tải dữ liệu, tiền xử lý, chỉ báo và feature engineering.
- Class trong file:
  - DataPreprocessor: Lớp nghiệp vụ trong module.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/models/__init__.py

- Vai trò file: Domain models dùng chung (event/market/portfolio) cho runtime & backtest.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/unit/python/*.py, tests/unit/test_types.rs, tests/unit/test_common_types.rs (nếu chạm contract liên ngôn ngữ).

### src/models/base.py

- Vai trò file: Domain models dùng chung (event/market/portfolio) cho runtime & backtest.
- Class trong file:
  - BaseModel: Lớp mô hình dữ liệu hoặc ML model abstraction/implementation.
- Test liên quan: tests/unit/python/*.py, tests/unit/test_types.rs, tests/unit/test_common_types.rs (nếu chạm contract liên ngôn ngữ).

### src/models/events.py

- Vai trò file: Domain models dùng chung (event/market/portfolio) cho runtime & backtest.
- Class trong file:
  - EventType: Data object/domain object cho event, signal, position hoặc metric.
  - Event: Data object/domain object cho event, signal, position hoặc metric.
  - MarketEvent: Data object/domain object cho event, signal, position hoặc metric.
  - SignalEvent: Data object/domain object cho event, signal, position hoặc metric.
  - OrderEvent: Data object/domain object cho event, signal, position hoặc metric.
  - FillEvent: Data object/domain object cho event, signal, position hoặc metric.
- Test liên quan: tests/unit/python/*.py, tests/unit/test_types.rs, tests/unit/test_common_types.rs (nếu chạm contract liên ngôn ngữ).

### src/models/market.py

- Vai trò file: Domain models dùng chung (event/market/portfolio) cho runtime & backtest.
- Class trong file:
  - Bar: Lớp nghiệp vụ trong module.
  - Trade: Data object/domain object cho event, signal, position hoặc metric.
  - Quote: Data object/domain object cho event, signal, position hoặc metric.
- Test liên quan: tests/unit/python/*.py, tests/unit/test_types.rs, tests/unit/test_common_types.rs (nếu chạm contract liên ngôn ngữ).

### src/models/portfolio.py

- Vai trò file: Domain models dùng chung (event/market/portfolio) cho runtime & backtest.
- Class trong file:
  - Position: Data object/domain object cho event, signal, position hoặc metric.
  - Portfolio: Lớp nghiệp vụ trong module.
  - PerformanceMetrics: Data object/domain object cho event, signal, position hoặc metric.
- Test liên quan: tests/unit/python/*.py, tests/unit/test_types.rs, tests/unit/test_common_types.rs (nếu chạm contract liên ngôn ngữ).

### src/observability/__init__.py

- Vai trò file: File package marker/export module.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/api/__init__.py

- Vai trò file: API observability (FastAPI + route/WS management).
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/api/main.py

- Vai trò file: API observability (FastAPI + route/WS management).
- Class trong file:
  - ObservabilityAPI: Lớp nghiệp vụ trong module.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/api/routes/__init__.py

- Vai trò file: API observability (FastAPI + route/WS management).
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/api/routes/metrics.py

- Vai trò file: API observability (FastAPI + route/WS management).
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/api/routes/system.py

- Vai trò file: API observability (FastAPI + route/WS management).
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/api/routes/trades.py

- Vai trò file: API observability (FastAPI + route/WS management).
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/api/websocket_manager.py

- Vai trò file: API observability (FastAPI + route/WS management).
- Class trong file:
  - WebSocketConnection: Lớp nghiệp vụ trong module.
  - WebSocketManager: Điều phối lifecycle hoặc tài nguyên (connection, websocket, storage, routing).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/config/__init__.py

- Vai trò file: Cấu hình logging/observability.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/config/logging_config.py

- Vai trò file: Cấu hình logging/observability.
- Class trong file:
  - LoggingConfig: Định nghĩa cấu hình runtime/validation cho module.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/database.py

- Vai trò file: Facade database cho observability layer.
- Class trong file:
  - ObservabilityDatabase: Lớp nghiệp vụ trong module.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/database/__init__.py

- Vai trò file: Data access manager cho observability database (DuckDB).
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/database/duckdb_manager.py

- Vai trò file: Data access manager cho observability database (DuckDB).
- Class trong file:
  - DuckDBManager: Điều phối lifecycle hoặc tài nguyên (connection, websocket, storage, routing).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/logging/__init__.py

- Vai trò file: Structured logging stack: formatter/handler/context/stream loggers.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/logging/correlations.py

- Vai trò file: Structured logging stack: formatter/handler/context/stream loggers.
- Class trong file:
  - CorrelationContext: Lớp nghiệp vụ trong module.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/logging/decorators.py

- Vai trò file: Structured logging stack: formatter/handler/context/stream loggers.
- Class trong file:
  - LogContext: Lớp nghiệp vụ trong module.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/logging/formatters.py

- Vai trò file: Structured logging stack: formatter/handler/context/stream loggers.
- Class trong file:
  - JSONFormatter: Lớp logging/formatting cho quan sát hệ thống.
  - StructuredFormatter: Lớp logging/formatting cho quan sát hệ thống.
  - CompactJSONFormatter: Lớp logging/formatting cho quan sát hệ thống.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/logging/handlers.py

- Vai trò file: Structured logging stack: formatter/handler/context/stream loggers.
- Class trong file:
  - AsyncQueueHandler: Xử lý luồng dữ liệu/sự kiện trong module (execution, data, logging queue...).
  - RotatingFileHandlerAsync: Lớp nghiệp vụ trong module.
  - SyslogHandlerAsync: Lớp nghiệp vụ trong module.
  - NullHandler: Xử lý luồng dữ liệu/sự kiện trong module (execution, data, logging queue...).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/logging/streams.py

- Vai trò file: Structured logging stack: formatter/handler/context/stream loggers.
- Class trong file:
  - MarketDataLogger: Lớp logging/formatting cho quan sát hệ thống.
  - StrategyLogger: Lớp logging/formatting cho quan sát hệ thống.
  - RiskLogger: Lớp logging/formatting cho quan sát hệ thống.
  - ExecutionLogger: Lớp logging/formatting cho quan sát hệ thống.
  - SystemLogger: Lớp logging/formatting cho quan sát hệ thống.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/logging/structured_logger.py

- Vai trò file: Structured logging stack: formatter/handler/context/stream loggers.
- Class trong file:
  - LoggerMetrics: Lớp logging/formatting cho quan sát hệ thống.
  - StructuredLogger: Lớp logging/formatting cho quan sát hệ thống.
- Contract behavior (Week 3 one-pass):
  - Context bắt buộc: `correlation_id` và `schema_version`.
  - Error triage log bắt buộc: `error_code`, `reason`, `disposition`, `payload_preview` (redacted <= 200 chars).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/metrics/__init__.py

- Vai trò file: Metric collectors và bridge nhận dữ liệu metric từ hệ thống.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/metrics/collectors.py

- Vai trò file: Metric collectors và bridge nhận dữ liệu metric từ hệ thống.
- Class trong file:
  - BaseCollector: Thu thập và chuẩn hóa metric/event cho observability.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/metrics/execution_collector.py

- Vai trò file: Metric collectors và bridge nhận dữ liệu metric từ hệ thống.
- Class trong file:
  - ExecutionCollector: Thu thập và chuẩn hóa metric/event cho observability.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/metrics/market_data_collector.py

- Vai trò file: Metric collectors và bridge nhận dữ liệu metric từ hệ thống.
- Class trong file:
  - MarketDataCollector: Thu thập và chuẩn hóa metric/event cho observability.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/metrics/rust_bridge.py

- Vai trò file: Metric collectors và bridge nhận dữ liệu metric từ hệ thống.
- Class trong file:
  - RustMetricsBridge: Data object/domain object cho event, signal, position hoặc metric.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/metrics/strategy_collector.py

- Vai trò file: Metric collectors và bridge nhận dữ liệu metric từ hệ thống.
- Class trong file:
  - StrategyCollector: Thu thập và chuẩn hóa metric/event cho observability.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/metrics/system_collector.py

- Vai trò file: Metric collectors và bridge nhận dữ liệu metric từ hệ thống.
- Class trong file:
  - SystemCollector: Thu thập và chuẩn hóa metric/event cho observability.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/models/__init__.py

- Vai trò file: Schema/model cho API observability (Pydantic events/metrics).
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/models/events_models.py

- Vai trò file: Schema/model cho API observability (Pydantic events/metrics).
- Class trong file:
  - EventType: Data object/domain object cho event, signal, position hoặc metric.
  - BaseEvent: Data object/domain object cho event, signal, position hoặc metric.
  - MetricEvent: Data object/domain object cho event, signal, position hoặc metric.
  - TradeEvent: Data object/domain object cho event, signal, position hoặc metric.
  - OrderEvent: Data object/domain object cho event, signal, position hoặc metric.
  - AlertEvent: Data object/domain object cho event, signal, position hoặc metric.
  - StrategyEvent: Data object/domain object cho event, signal, position hoặc metric.
  - SystemEvent: Data object/domain object cho event, signal, position hoặc metric.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/models/metrics_models.py

- Vai trò file: Schema/model cho API observability (Pydantic events/metrics).
- Class trong file:
  - MarketDataMetric: Lớp nghiệp vụ trong module.
  - StrategyMetric: Lớp nghiệp vụ trong module.
  - ExecutionMetric: Lớp nghiệp vụ trong module.
  - SystemMetric: Lớp nghiệp vụ trong module.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/models/schemas.py

- Vai trò file: Schema/model cho API observability (Pydantic events/metrics).
- Class trong file:
  - TimeRange: Lớp nghiệp vụ trong module.
  - AggregationInterval: Lớp nghiệp vụ trong module.
  - MetricsSnapshot: Data object/domain object cho event, signal, position hoặc metric.
  - MetricsHistoryRequest: Data object/domain object cho event, signal, position hoặc metric.
  - MetricsHistoryResponse: Data object/domain object cho event, signal, position hoặc metric.
  - Trade: Data object/domain object cho event, signal, position hoặc metric.
  - TradeFilter: Data object/domain object cho event, signal, position hoặc metric.
  - TradeHistoryResponse: Data object/domain object cho event, signal, position hoặc metric.
  - ComponentStatus: Lớp nghiệp vụ trong module.
  - SystemHealth: Lớp nghiệp vụ trong module.
  - PerformanceMetrics: Data object/domain object cho event, signal, position hoặc metric.
  - WebSocketMessage: Lớp nghiệp vụ trong module.
  - MetricsUpdate: Data object/domain object cho event, signal, position hoặc metric.
  - TradeNotification: Data object/domain object cho event, signal, position hoặc metric.
  - AlertNotification: Lớp nghiệp vụ trong module.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/server.py

- Vai trò file: Entrypoint server observability backend.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/storage/__init__.py

- Vai trò file: Storage client/schema/integration cho observability backend.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/storage/duckdb_client.py

- Vai trò file: Storage client/schema/integration cho observability backend.
- Class trong file:
  - DuckDBClient: Client truy cập dịch vụ ngoài hoặc lớp lưu trữ.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/storage/integration.py

- Vai trò file: Storage client/schema/integration cho observability backend.
- Class trong file:
  - StorageManager: Điều phối lifecycle hoặc tài nguyên (connection, websocket, storage, routing).
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/storage/schemas.py

- Vai trò file: Storage client/schema/integration cho observability backend.
- Class trong file:
  - TimeInterval: Lớp nghiệp vụ trong module.
  - MetricRecord: Lớp nghiệp vụ trong module.
  - CandleRecord: Lớp nghiệp vụ trong module.
  - PerformanceRecord: Lớp nghiệp vụ trong module.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/observability/storage/sqlite_client.py

- Vai trò file: Storage client/schema/integration cho observability backend.
- Class trong file:
  - SQLiteClient: Client truy cập dịch vụ ngoài hoặc lớp lưu trữ.
- Test liên quan: tests/observability/*.py, tests/integration/test_observability_integration.py, tests/integration/test_duckdb_storage.rs.

### src/simulations/__init__.py

- Vai trò file: Mô phỏng ngẫu nhiên (Monte Carlo) cho risk/performance analysis.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/simulations/monte_carlo.py

- Vai trò file: Mô phỏng ngẫu nhiên (Monte Carlo) cho risk/performance analysis.
- Class trong file:
  - MonteCarloSimulator: Mô phỏng dữ liệu/kịch bản để ước lượng rủi ro hoặc đánh giá chiến lược.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/__init__.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/base.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - SignalType: Data object/domain object cho event, signal, position hoặc metric.
  - Signal: Data object/domain object cho event, signal, position hoặc metric.
  - Strategy: Triển khai logic chiến lược giao dịch (signal, position sizing, regime/risk-aware decisions).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/enhanced_momentum.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - SignalQuality: Data object/domain object cho event, signal, position hoặc metric.
  - RiskParameters: Lớp nghiệp vụ trong module.
  - IndicatorThresholds: Lớp nghiệp vụ trong module.
  - TradeRationale: Data object/domain object cho event, signal, position hoặc metric.
  - EnhancedMomentumStrategy: Triển khai logic chiến lược giao dịch (signal, position sizing, regime/risk-aware decisions).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/market_regime.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - MarketRegime: Lớp nghiệp vụ trong module.
  - RegimeDetector: Lớp nghiệp vụ trong module.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/mean_reversion.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - MeanReversion: Lớp nghiệp vụ trong module.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/ml/__init__.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/ml/examples/ml_strategy_example.py

- Vai trò file: Ví dụ chạy chiến lược/ML workflow.
- Class trong file:
  - MLTradingStrategy: Triển khai logic chiến lược giao dịch (signal, position sizing, regime/risk-aware decisions).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/ml/examples/monte_carlo_ml.py

- Vai trò file: Ví dụ chạy chiến lược/ML workflow.
- Class trong file:
  - MonteCarloConfig: Định nghĩa cấu hình runtime/validation cho module.
  - MLMonteCarloSimulator: Mô phỏng dữ liệu/kịch bản để ước lượng rủi ro hoặc đánh giá chiến lược.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/ml/features/__init__.py

- Vai trò file: Feature engineering cho pipeline ML strategy.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/ml/features/feature_engineering.py

- Vai trò file: Feature engineering cho pipeline ML strategy.
- Class trong file:
  - FeatureConfig: Định nghĩa cấu hình runtime/validation cho module.
  - FeatureEngineer: Lõi xử lý chính của module (backtest/feature/... ).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/ml/models/__init__.py

- Vai trò file: Base và implementation của ML models trong strategy layer.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/ml/models/base_model.py

- Vai trò file: Base và implementation của ML models trong strategy layer.
- Class trong file:
  - BaseMLModel: Lớp mô hình dữ liệu hoặc ML model abstraction/implementation.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/ml/models/price_predictor.py

- Vai trò file: Base và implementation của ML models trong strategy layer.
- Class trong file:
  - PricePredictor: Lớp nghiệp vụ trong module.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/ml/models/trend_classifier.py

- Vai trò file: Base và implementation của ML models trong strategy layer.
- Class trong file:
  - TrendClassifier: Lớp nghiệp vụ trong module.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/ml/validation/__init__.py

- Vai trò file: Validation/cross-validation cho mô hình ML strategy.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/ml/validation/cross_validator.py

- Vai trò file: Validation/cross-validation cho mô hình ML strategy.
- Class trong file:
  - CrossValidator: Lớp nghiệp vụ trong module.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/ml/validation/model_validator.py

- Vai trò file: Validation/cross-validation cho mô hình ML strategy.
- Class trong file:
  - ValidationConfig: Định nghĩa cấu hình runtime/validation cho module.
  - ModelValidator: Lớp nghiệp vụ trong module.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/ml_ensemble_strategy.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - RegimeState: Lớp nghiệp vụ trong module.
  - MLEnsembleStrategy: Triển khai logic chiến lược giao dịch (signal, position sizing, regime/risk-aware decisions).
  - XGBoostClassifier: Lớp nghiệp vụ trong module.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/momentum.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - MomentumStrategy: Triển khai logic chiến lược giao dịch (signal, position sizing, regime/risk-aware decisions).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/momentum_optimized.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - MomentumOptimizedStrategy: Triển khai logic chiến lược giao dịch (signal, position sizing, regime/risk-aware decisions).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/momentum_regime_aware.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - RegimeAwareMomentumStrategy: Triển khai logic chiến lược giao dịch (signal, position sizing, regime/risk-aware decisions).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/momentum_simplified.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - SimplifiedMomentumStrategy: Triển khai logic chiến lược giao dịch (signal, position sizing, regime/risk-aware decisions).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/moving_average.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - MovingAverageCrossover: Lớp nghiệp vụ trong module.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/order_book_imbalance.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - OrderBookSnapshot: Lớp nghiệp vụ trong module.
  - OrderBookImbalanceStrategy: Triển khai logic chiến lược giao dịch (signal, position sizing, regime/risk-aware decisions).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/quantitative_strategy.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - MarketContext: Lớp nghiệp vụ trong module.
  - QuantitativeStrategy: Triển khai logic chiến lược giao dịch (signal, position sizing, regime/risk-aware decisions).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/simple_momentum.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - SimpleMomentumStrategy: Triển khai logic chiến lược giao dịch (signal, position sizing, regime/risk-aware decisions).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/statistical_arbitrage.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - StatisticalArbitrageStrategy: Triển khai logic chiến lược giao dịch (signal, position sizing, regime/risk-aware decisions).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/strategy_router.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - StrategyRouter: Lớp nghiệp vụ trong module.
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/trend_following.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - TrendFollowingStrategy: Triển khai logic chiến lược giao dịch (signal, position sizing, regime/risk-aware decisions).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/strategies/trend_momentum_strategy.py

- Vai trò file: Các chiến lược giao dịch và router chiến lược.
- Class trong file:
  - TrendMomentumStrategy: Triển khai logic chiến lược giao dịch (signal, position sizing, regime/risk-aware decisions).
- Test liên quan: tests/unit/python/*, tests/unit/test_*strategy*.py, tests/integration/test_*signal*.py, tests/test_backtest_integration.py.

### src/utils/__init__.py

- Vai trò file: Tiện ích hỗ trợ logging/metrics/visualization/regime detection.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/unit/python/*.py, tests/unit/test_types.rs, tests/unit/test_common_types.rs (nếu chạm contract liên ngôn ngữ).

### src/utils/helpers.py

- Vai trò file: Tiện ích hỗ trợ logging/metrics/visualization/regime detection.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/unit/python/*.py, tests/unit/test_types.rs, tests/unit/test_common_types.rs (nếu chạm contract liên ngôn ngữ).

### src/utils/logger.py

- Vai trò file: Tiện ích hỗ trợ logging/metrics/visualization/regime detection.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/unit/python/*.py, tests/unit/test_types.rs, tests/unit/test_common_types.rs (nếu chạm contract liên ngôn ngữ).

### src/utils/market_regime.py

- Vai trò file: Tiện ích hỗ trợ logging/metrics/visualization/regime detection.
- Class trong file:
  - MarketRegime: Lớp nghiệp vụ trong module.
  - MarketRegimeDetector: Lớp nghiệp vụ trong module.
- Test liên quan: tests/unit/python/*.py, tests/unit/test_types.rs, tests/unit/test_common_types.rs (nếu chạm contract liên ngôn ngữ).

### src/utils/metrics.py

- Vai trò file: Tiện ích hỗ trợ logging/metrics/visualization/regime detection.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/unit/python/*.py, tests/unit/test_types.rs, tests/unit/test_common_types.rs (nếu chạm contract liên ngôn ngữ).

### src/utils/visualization.py

- Vai trò file: Tiện ích hỗ trợ logging/metrics/visualization/regime detection.
- Class trong file: Không có class (module-level functions/constants hoặc package init).
- Test liên quan: tests/unit/python/*.py, tests/unit/test_types.rs, tests/unit/test_common_types.rs (nếu chạm contract liên ngôn ngữ).

---

## 3) Rust Source Map (rust/*/src/*.rs)

### rust/common/src/config.rs

- Vai trò file: Shared kernel: types, config, errors, messaging, health, metrics helpers.
- Type trong file:
  - MarketDataConfig (struct): Cấu hình strongly-typed cho module/service.
  - RiskConfig (struct): Cấu hình strongly-typed cho module/service.
  - ExecutionConfig (struct): Cấu hình strongly-typed cho module/service.
  - SignalConfig (struct): Cấu hình strongly-typed cho module/service.
  - SystemConfig (struct): Cấu hình strongly-typed cho module/service.
- Test liên quan: tests/unit/test_common_types.rs, tests/unit/test_types.rs, tests/unit/test_errors.rs, tests/unit/test_common_health.rs.

### rust/common/src/errors.rs

- Vai trò file: Shared kernel: types, config, errors, messaging, health, metrics helpers.
- Type trong file:
  - TradingError (enum): Enum biểu diễn trạng thái/loại dữ liệu/nhánh xử lý nghiệp vụ.
- Test liên quan: tests/unit/test_common_types.rs, tests/unit/test_types.rs, tests/unit/test_errors.rs, tests/unit/test_common_health.rs.

### rust/common/src/health.rs

- Vai trò file: Shared kernel: types, config, errors, messaging, health, metrics helpers.
- Type trong file:
  - HealthStatus (enum): Enum biểu diễn trạng thái/loại dữ liệu/nhánh xử lý nghiệp vụ.
  - HealthCheck (struct): Cấu trúc dữ liệu/domain state của module.
  - SystemHealth (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/unit/test_common_types.rs, tests/unit/test_types.rs, tests/unit/test_errors.rs, tests/unit/test_common_health.rs.

### rust/common/src/http.rs

- Vai trò file: Shared kernel: types, config, errors, messaging, health, metrics helpers.
- Type trong file:
  - HealthResponse (struct): DTO cho API/messaging boundary.
  - ReadyResponse (struct): DTO cho API/messaging boundary.
  - HealthState (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/unit/test_common_types.rs, tests/unit/test_types.rs, tests/unit/test_errors.rs, tests/unit/test_common_health.rs.

### rust/common/src/lib.rs

- Vai trò file: Shared kernel: types, config, errors, messaging, health, metrics helpers.
- Type trong file: Không có type declaration (thường là wiring, function helpers, hoặc entrypoint).
- Test liên quan: tests/unit/test_common_types.rs, tests/unit/test_types.rs, tests/unit/test_errors.rs, tests/unit/test_common_health.rs.

### rust/common/src/messaging.rs

- Vai trò file: Shared kernel: types, config, errors, messaging, health, metrics helpers.
- Type trong file:
  - Message (enum): Enum biểu diễn trạng thái/loại dữ liệu/nhánh xử lý nghiệp vụ.
  - OrderResponse (struct): DTO cho API/messaging boundary.
  - RiskCheckRequest (struct): DTO cho API/messaging boundary.
  - RiskCheckResult (struct): Cấu trúc dữ liệu/domain state của module.
  - Heartbeat (struct): Cấu trúc dữ liệu/domain state của module.
- Contract behavior (Week 3 one-pass):
  - Parser 2 bước: validate envelope trước, parse payload sau.
  - Zero-panic policy cho malformed JSON/invalid UTF-8: trả lỗi có `disposition=QUARANTINE`.
  - Structured parse error: `error_code`, `correlation_id`, `reason`, `disposition`, `payload_preview`.
- Test liên quan: tests/unit/test_common_types.rs, tests/unit/test_types.rs, tests/unit/test_errors.rs, tests/unit/test_common_health.rs, tests/integration/test_risk_execution_observability.rs.

### rust/common/src/metrics.rs

- Vai trò file: Shared kernel: types, config, errors, messaging, health, metrics helpers.
- Type trong file:
  - MetricsConfig (struct): Cấu hình strongly-typed cho module/service.
- Test liên quan: tests/unit/test_common_types.rs, tests/unit/test_types.rs, tests/unit/test_errors.rs, tests/unit/test_common_health.rs.

### rust/common/src/types.rs

- Vai trò file: Shared kernel: types, config, errors, messaging, health, metrics helpers.
- Type trong file:
  - Symbol (struct): Cấu trúc dữ liệu/domain state của module.
  - Price (struct): Cấu trúc dữ liệu/domain state của module.
  - Quantity (struct): Cấu trúc dữ liệu/domain state của module.
  - Side (enum): Enum biểu diễn trạng thái/loại dữ liệu/nhánh xử lý nghiệp vụ.
  - OrderType (enum): Enum biểu diễn trạng thái/loại dữ liệu/nhánh xử lý nghiệp vụ.
  - OrderStatus (enum): Enum biểu diễn trạng thái/loại dữ liệu/nhánh xử lý nghiệp vụ.
  - Level (struct): Cấu trúc dữ liệu/domain state của module.
  - Trade (struct): Cấu trúc dữ liệu/domain state của module.
  - Bar (struct): Cấu trúc dữ liệu/domain state của module.
  - OrderBook (struct): Cấu trúc dữ liệu/domain state của module.
  - Order (struct): Cấu trúc dữ liệu/domain state của module.
  - Position (struct): Cấu trúc dữ liệu/domain state của module.
  - Signal (struct): Cấu trúc dữ liệu/domain state của module.
  - SignalAction (enum): Enum biểu diễn trạng thái/loại dữ liệu/nhánh xử lý nghiệp vụ.
- Test liên quan: tests/unit/test_common_types.rs, tests/unit/test_types.rs, tests/unit/test_errors.rs, tests/unit/test_common_health.rs.

### rust/database/src/connection.rs

- Vai trò file: Persistence layer: connection/migration/schema/query/models/error.
- Type trong file:
  - ConnectionManager (struct): Quản lý tài nguyên/lifecycle hoặc orchestration nội bộ.
  - DatabaseManager (struct): Quản lý tài nguyên/lifecycle hoặc orchestration nội bộ.
- Test liên quan: tests/integration/test_duckdb_storage.rs, tests/integration/test_observability_integration.rs, tests/observability/test_databases.py.

### rust/database/src/error.rs

- Vai trò file: Persistence layer: connection/migration/schema/query/models/error.
- Type trong file:
  - DatabaseError (enum): Enum biểu diễn trạng thái/loại dữ liệu/nhánh xử lý nghiệp vụ.
- Test liên quan: tests/integration/test_duckdb_storage.rs, tests/integration/test_observability_integration.rs, tests/observability/test_databases.py.

### rust/database/src/lib.rs

- Vai trò file: Persistence layer: connection/migration/schema/query/models/error.
- Type trong file: Không có type declaration (thường là wiring, function helpers, hoặc entrypoint).
- Test liên quan: tests/integration/test_duckdb_storage.rs, tests/integration/test_observability_integration.rs, tests/observability/test_databases.py.

### rust/database/src/migrations.rs

- Vai trò file: Persistence layer: connection/migration/schema/query/models/error.
- Type trong file:
  - Migration (struct): Cấu trúc dữ liệu/domain state của module.
  - MigrationManager (struct): Quản lý tài nguyên/lifecycle hoặc orchestration nội bộ.
  - TimescaleMigrator (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/integration/test_duckdb_storage.rs, tests/integration/test_observability_integration.rs, tests/observability/test_databases.py.

### rust/database/src/models.rs

- Vai trò file: Persistence layer: connection/migration/schema/query/models/error.
- Type trong file:
  - MetricRecord (struct): Cấu trúc dữ liệu/domain state của module.
  - CandleRecord (struct): Cấu trúc dữ liệu/domain state của module.
  - TradeRecord (struct): Cấu trúc dữ liệu/domain state của module.
  - SystemEvent (struct): Cấu trúc dữ liệu/domain state của module.
  - PerformanceSummary (struct): Cấu trúc dữ liệu/domain state của module.
  - TableStats (struct): Cấu trúc dữ liệu/domain state của module.
  - AggregatedMetric (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/integration/test_duckdb_storage.rs, tests/integration/test_observability_integration.rs, tests/observability/test_databases.py.

### rust/database/src/query.rs

- Vai trò file: Persistence layer: connection/migration/schema/query/models/error.
- Type trong file:
  - TimeInterval (enum): Enum biểu diễn trạng thái/loại dữ liệu/nhánh xử lý nghiệp vụ.
  - QueryBuilder (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/integration/test_duckdb_storage.rs, tests/integration/test_observability_integration.rs, tests/observability/test_databases.py.

### rust/database/src/schema.rs

- Vai trò file: Persistence layer: connection/migration/schema/query/models/error.
- Type trong file:
  - Schema (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/integration/test_duckdb_storage.rs, tests/integration/test_observability_integration.rs, tests/observability/test_databases.py.

### rust/database/src/tests.rs

- Vai trò file: Persistence layer: connection/migration/schema/query/models/error.
- Type trong file: Không có type declaration (thường là wiring, function helpers, hoặc entrypoint).
- Test liên quan: tests/integration/test_duckdb_storage.rs, tests/integration/test_observability_integration.rs, tests/observability/test_databases.py.

### rust/execution-engine/src/lib.rs

- Vai trò file: Order execution layer: routing, retry, slippage, stop-loss execution.
- Type trong file:
  - ExecutionEngineService (struct): Service coordinator/state holder cho component runtime.
- Test liên quan: tests/unit/test_execution_router.rs, tests/unit/test_retry.rs, tests/unit/test_slippage.rs, tests/integration/test_alpaca_api.rs, tests/integration/test_end_to_end.rs.

### rust/execution-engine/src/main.rs

- Vai trò file: Order execution layer: routing, retry, slippage, stop-loss execution.
- Type trong file: Không có type declaration (thường là wiring, function helpers, hoặc entrypoint).
- Test liên quan: tests/unit/test_execution_router.rs, tests/unit/test_retry.rs, tests/unit/test_slippage.rs, tests/integration/test_alpaca_api.rs, tests/integration/test_end_to_end.rs.

### rust/execution-engine/src/retry.rs

- Vai trò file: Order execution layer: routing, retry, slippage, stop-loss execution.
- Type trong file:
  - RetryPolicy (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/unit/test_execution_router.rs, tests/unit/test_retry.rs, tests/unit/test_slippage.rs, tests/integration/test_alpaca_api.rs, tests/integration/test_end_to_end.rs.

### rust/execution-engine/src/router.rs

- Vai trò file: Order execution layer: routing, retry, slippage, stop-loss execution.
- Type trong file:
  - AlpacaOrderRequest (struct): DTO cho API/messaging boundary.
  - AlpacaOrderResponse (struct): DTO cho API/messaging boundary.
  - OrderRouter (struct): Engine xử lý nghiệp vụ lõi theo domain.
- Test liên quan: tests/unit/test_execution_router.rs, tests/unit/test_retry.rs, tests/unit/test_slippage.rs, tests/integration/test_alpaca_api.rs, tests/integration/test_end_to_end.rs.

### rust/execution-engine/src/slippage.rs

- Vai trò file: Order execution layer: routing, retry, slippage, stop-loss execution.
- Type trong file:
  - SlippageEstimator (struct): Engine xử lý nghiệp vụ lõi theo domain.
- Test liên quan: tests/unit/test_execution_router.rs, tests/unit/test_retry.rs, tests/unit/test_slippage.rs, tests/integration/test_alpaca_api.rs, tests/integration/test_end_to_end.rs.

### rust/execution-engine/src/stop_loss_executor.rs

- Vai trò file: Order execution layer: routing, retry, slippage, stop-loss execution.
- Type trong file:
  - StopLossExecutor (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/unit/test_execution_router.rs, tests/unit/test_retry.rs, tests/unit/test_slippage.rs, tests/integration/test_alpaca_api.rs, tests/integration/test_end_to_end.rs.

### rust/market-data/src/aggregation.rs

- Vai trò file: Market data ingestion: websocket, orderbook, aggregation, publish.
- Type trong file:
  - TimeWindow (enum): Enum biểu diễn trạng thái/loại dữ liệu/nhánh xử lý nghiệp vụ.
  - BarAccumulator (struct): Cấu trúc dữ liệu/domain state của module.
  - BarAggregator (struct): Cấu trúc dữ liệu/domain state của module.
  - VwapCalculator (struct): Engine xử lý nghiệp vụ lõi theo domain.
  - MicrostructureFeatures (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/unit/test_market_data_orderbook.rs, tests/integration/test_websocket.rs, tests/integration/test_end_to_end.rs, tests/benchmarks/orderbook_bench.rs.

### rust/market-data/src/lib.rs

- Vai trò file: Market data ingestion: websocket, orderbook, aggregation, publish.
- Type trong file:
  - MarketDataService (struct): Service coordinator/state holder cho component runtime.
- Test liên quan: tests/unit/test_market_data_orderbook.rs, tests/integration/test_websocket.rs, tests/integration/test_end_to_end.rs, tests/benchmarks/orderbook_bench.rs.

### rust/market-data/src/main.rs

- Vai trò file: Market data ingestion: websocket, orderbook, aggregation, publish.
- Type trong file: Không có type declaration (thường là wiring, function helpers, hoặc entrypoint).
- Test liên quan: tests/unit/test_market_data_orderbook.rs, tests/integration/test_websocket.rs, tests/integration/test_end_to_end.rs, tests/benchmarks/orderbook_bench.rs.

### rust/market-data/src/orderbook.rs

- Vai trò file: Market data ingestion: websocket, orderbook, aggregation, publish.
- Type trong file:
  - FastOrderBook (struct): Cấu trúc dữ liệu/domain state của module.
  - OrderBookManager (struct): Quản lý tài nguyên/lifecycle hoặc orchestration nội bộ.
- Test liên quan: tests/unit/test_market_data_orderbook.rs, tests/integration/test_websocket.rs, tests/integration/test_end_to_end.rs, tests/benchmarks/orderbook_bench.rs.

### rust/market-data/src/publisher.rs

- Vai trò file: Market data ingestion: websocket, orderbook, aggregation, publish.
- Type trong file:
  - MarketDataPublisher (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/unit/test_market_data_orderbook.rs, tests/integration/test_websocket.rs, tests/integration/test_end_to_end.rs, tests/benchmarks/orderbook_bench.rs.

### rust/market-data/src/websocket.rs

- Vai trò file: Market data ingestion: websocket, orderbook, aggregation, publish.
- Type trong file:
  - AlpacaMessage (enum): Enum biểu diễn trạng thái/loại dữ liệu/nhánh xử lý nghiệp vụ.
  - WebSocketClient (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/unit/test_market_data_orderbook.rs, tests/integration/test_websocket.rs, tests/integration/test_end_to_end.rs, tests/benchmarks/orderbook_bench.rs.

### rust/risk-manager/src/circuit_breaker.rs

- Vai trò file: Risk layer: limit checks, stop logic, PnL tracking, circuit breaker.
- Type trong file:
  - CircuitBreaker (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/unit/test_risk_manager.rs, tests/unit/test_risk_limits.rs, tests/integration/test_stop_loss_integration.rs, tests/integration/test_risk_execution_observability.rs.

### rust/risk-manager/src/lib.rs

- Vai trò file: Risk layer: limit checks, stop logic, PnL tracking, circuit breaker.
- Type trong file:
  - RiskManagerService (struct): Service coordinator/state holder cho component runtime.
- Test liên quan: tests/unit/test_risk_manager.rs, tests/unit/test_risk_limits.rs, tests/integration/test_stop_loss_integration.rs, tests/integration/test_risk_execution_observability.rs.

### rust/risk-manager/src/limits.rs

- Vai trò file: Risk layer: limit checks, stop logic, PnL tracking, circuit breaker.
- Type trong file:
  - LimitChecker (struct): Engine xử lý nghiệp vụ lõi theo domain.
- Test liên quan: tests/unit/test_risk_manager.rs, tests/unit/test_risk_limits.rs, tests/integration/test_stop_loss_integration.rs, tests/integration/test_risk_execution_observability.rs.

### rust/risk-manager/src/main.rs

- Vai trò file: Risk layer: limit checks, stop logic, PnL tracking, circuit breaker.
- Type trong file: Không có type declaration (thường là wiring, function helpers, hoặc entrypoint).
- Test liên quan: tests/unit/test_risk_manager.rs, tests/unit/test_risk_limits.rs, tests/integration/test_stop_loss_integration.rs, tests/integration/test_risk_execution_observability.rs.

### rust/risk-manager/src/pnl.rs

- Vai trò file: Risk layer: limit checks, stop logic, PnL tracking, circuit breaker.
- Type trong file:
  - PositionState (struct): Cấu trúc dữ liệu/domain state của module.
  - PnLTracker (struct): Engine xử lý nghiệp vụ lõi theo domain.
- Test liên quan: tests/unit/test_risk_manager.rs, tests/unit/test_risk_limits.rs, tests/integration/test_stop_loss_integration.rs, tests/integration/test_risk_execution_observability.rs.

### rust/risk-manager/src/stops.rs

- Vai trò file: Risk layer: limit checks, stop logic, PnL tracking, circuit breaker.
- Type trong file:
  - StopLossType (enum): Enum biểu diễn trạng thái/loại dữ liệu/nhánh xử lý nghiệp vụ.
  - StopLossConfig (struct): Cấu hình strongly-typed cho module/service.
  - StopLossState (struct): Cấu trúc dữ liệu/domain state của module.
  - StopManager (struct): Quản lý tài nguyên/lifecycle hoặc orchestration nội bộ.
  - StopLossTrigger (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/unit/test_risk_manager.rs, tests/unit/test_risk_limits.rs, tests/integration/test_stop_loss_integration.rs, tests/integration/test_risk_execution_observability.rs.

### rust/risk-manager/tests/limit_bva_tests.rs

- Vai trò file: Bộ test BVA cho Risk Limits v1, xác nhận ngưỡng `limit-1/limit/limit+1` cho symbol/strategy limits và guardrail hiệu năng lookup risk.
- Type trong file: Không có type declaration (test cases mức crate/integration).
- Test liên quan: `cd rust && cargo test -p risk-manager --test limit_bva_tests`, `cd rust && cargo test -p risk-manager`.

### rust/signal-bridge/src/bridge.rs

- Vai trò file: Signal pipeline: feature/indicator compute, bridge với Python/runtime.
- Type trong file:
  - Bar (struct): Cấu trúc dữ liệu/domain state của module.
  - FeatureComputer (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/integration/test_momentum_signal_generation.py, tests/integration/test_end_to_end.rs, tests/integration/test_performance_load.rs.

### rust/signal-bridge/src/features.rs

- Vai trò file: Signal pipeline: feature/indicator compute, bridge với Python/runtime.
- Type trong file:
  - FeatureEngine (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/integration/test_momentum_signal_generation.py, tests/integration/test_end_to_end.rs, tests/integration/test_performance_load.rs.

### rust/signal-bridge/src/indicators.rs

- Vai trò file: Signal pipeline: feature/indicator compute, bridge với Python/runtime.
- Type trong file:
  - SMA (struct): Cấu trúc dữ liệu/domain state của module.
  - EMA (struct): Cấu trúc dữ liệu/domain state của module.
  - RSI (struct): Cấu trúc dữ liệu/domain state của module.
  - MACD (struct): Cấu trúc dữ liệu/domain state của module.
  - BollingerBands (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: tests/integration/test_momentum_signal_generation.py, tests/integration/test_end_to_end.rs, tests/integration/test_performance_load.rs.

### rust/signal-bridge/src/lib.rs

- Vai trò file: Signal pipeline: feature/indicator compute, bridge với Python/runtime.
- Type trong file:
  - SignalBridgeService (struct): Service coordinator/state holder cho component runtime.
- Test liên quan: tests/integration/test_momentum_signal_generation.py, tests/integration/test_end_to_end.rs, tests/integration/test_performance_load.rs.

### rust/signal-bridge/src/main.rs

- Vai trò file: Signal pipeline: feature/indicator compute, bridge với Python/runtime.
- Type trong file: Không có type declaration (thường là wiring, function helpers, hoặc entrypoint).
- Test liên quan: tests/integration/test_momentum_signal_generation.py, tests/integration/test_end_to_end.rs, tests/integration/test_performance_load.rs.

---

## 4) Doc -> Code -> Test nhanh (thực thi theo task)

### Task: Sửa Strategy/Signal
- Code: src/strategies/*, src/backtesting/*, rust/signal-bridge/src/*
- Test:
  - pytest tests/unit/python/test_strategies.py -q
  - pytest tests/unit/python/test_backtest_engine.py -q
  - pytest tests/integration/test_momentum_signal_generation.py -q

### Task: Sửa Market Data / Order Book
- Code: rust/market-data/src/websocket.rs, orderbook.rs, aggregation.rs, publisher.rs
- Test:
  - cd rust && cargo test -p market-data
  - cd tests && cargo test --test test_websocket --test test_end_to_end

### Task: Sửa Risk / Stop Loss / Circuit Breaker
- Code: rust/risk-manager/src/limits.rs, stops.rs, circuit_breaker.rs, pnl.rs
- Test:
  - cd tests && cargo test --test test_risk_manager --test test_risk_limits --test test_stop_loss_integration
  - pytest tests/unit/test_week3_stop_loss_immediate_exit.py -q

### Task: Sửa Execution / Router / Slippage
- Code: rust/execution-engine/src/router.rs, retry.rs, slippage.rs, stop_loss_executor.rs
- Test:
  - cd tests && cargo test --test test_execution_router --test test_retry --test test_slippage --test test_alpaca_api

### Task: Sửa Observability API/Storage
- Code: src/observability/api/*, src/observability/metrics/*, src/observability/database/*, src/observability/storage/*
- Test:
  - pytest tests/observability -q
  - pytest tests/integration/test_observability_integration.py -q
  - cd tests && cargo test --test test_duckdb_storage --test test_observability_integration

---

## 5) Ghi chú quan trọng

- Đây là playbook chi tiết ở mức file/type để onboarding và code navigation.
- Khi tài liệu docs/* mâu thuẫn, ưu tiên code hiện tại + docs/DOCS_CANONICAL_MAP.md.
- Khuyến nghị cập nhật playbook này khi thêm file/class mới ở src/ hoặc rust/*/src/.

---

## 6) Tracking file docs mới (ngoài src/rust)

### docs/roadmap/EXECUTION_PLAN_24_WEEKS_2026-04-20_to_2026-10-04.md

- Vai trò file: Lộ trình thực thi 24 tuần cho Balanced Delivery (stability, risk/execution, observability, controlled live rollout).
- Class/Type trong file: Không có class/type (tài liệu kế hoạch triển khai).
- Test liên quan: Không có test trực tiếp; dùng như execution baseline cho lựa chọn test theo từng tuần/phase gate.

### docs/roadmap/CHECKLIST_GATE_W01_W24.md

- Vai trò file: Checklist vận hành tổng hợp W01->W24 để team tick trực tiếp cho từng tuần và final-phase gates.
- Class/Type trong file: Không có class/type (tài liệu checklist, evidence tracking, Go/No-Go decision).
- Test liên quan: Ràng buộc weekly compile/static/lint/type/smoke checks (W01-W20) và full-suite gates (W21-W24), kèm rule test ownership theo codebase.

### docs/roadmap/WEEK1_OPERATIONS_PLAN_2026-04-20_to_2026-04-26.md

- Vai trò file: Kế hoạch vận hành chi tiết tuần 1 với task theo ngày, checklist, issue register và mẫu báo cáo cuối tuần.
- Class/Type trong file: Không có class/type (tài liệu điều phối vận hành).
- Test liên quan: Không có test trực tiếp; dùng để kiểm soát baseline test/build/observability và issue governance tuần 1.

### docs/roadmap/week1/KPI_CHARTER_V1.md

- Vai trò file: Định nghĩa bộ KPI tuần 1 theo 5 nhóm Reliability, Trading quality, Risk, Engineering, Observability.
- Class/Type trong file: Không có class/type (tài liệu KPI governance).
- Test liên quan: Không có test trực tiếp; là nguồn tham chiếu cho weekly gate checklist và KPI board coverage.

### docs/roadmap/week1/BASELINE_VALIDATION_REPORT_V1.md

- Vai trò file: Báo cáo baseline test/build Python + Rust, trạng thái pass/fail và mapping issue theo blocker.
- Class/Type trong file: Không có class/type (tài liệu validation/baseline evidence).
- Test liên quan: Tham chiếu kết quả từ `python -m pytest ...`, `cargo check --workspace`, `cargo test --workspace`.

### docs/roadmap/week1/OBSERVABILITY_BASELINE_SLO_DRAFT.md

- Vai trò file: Chụp baseline observability (health/log/metrics) và draft SLO tạm thời tuần 1.
- Class/Type trong file: Không có class/type (tài liệu vận hành observability).
- Test liên quan: Tham chiếu health-check script và test observability/integration khi vào tuần 2.

### docs/roadmap/week1/ISSUE_REGISTER_V1.md

- Vai trò file: Sổ đăng ký issue tuần 1 chuẩn hóa theo severity, owner, due date, dependency và exit criteria.
- Class/Type trong file: Không có class/type (tài liệu governance/triage).
- Test liên quan: Không có test trực tiếp; map từng failure baseline sang issue có owner + ETA.

### docs/roadmap/week1/INTERFACE_SPEC_DRAFT_V0.md

- Vai trò file: Draft spec interface tuần 2-3 cho `schema_version`, `RiskDecision`, `ExecutionAck`, `ObservabilityEvent`.
- Class/Type trong file: Không có class/type code; chỉ định nghĩa contract fields/acceptance ở mức spec.
- Test liên quan: Làm đầu vào cho contract test và integration scenarios tuần 2-3.

### docs/roadmap/week1/GATE_REHEARSAL_NOTES.md

- Vai trò file: Ghi chú rehearsal Go/No-Go gate tuần 1, tổng hợp coverage/checklist và blocker còn mở.
- Class/Type trong file: Không có class/type (tài liệu gate review).
- Test liên quan: Không có test trực tiếp; xác nhận baseline rerunability và tình trạng issue ownership.

### docs/roadmap/week1/WEEK1_FINAL_REPORT_AND_WEEK2_START_PACK.md

- Vai trò file: Báo cáo tổng kết tuần 1 và gói khởi động tuần 2 (top priorities + điều kiện start day-1).
- Class/Type trong file: Không có class/type (tài liệu weekly closeout + handoff).
- Test liên quan: Tổng hợp bằng chứng từ baseline/test matrix và quyết định Go/No-Go tuần 2.

### docs/roadmap/WEEK2_OPERATIONS_PLAN_2026-04-27_to_2026-05-03.md

- Vai trò file: Kế hoạch vận hành chi tiết tuần 2 cho Contract Audit, gồm task board theo ngày, checklist, issue khởi tạo và gate criteria.
- Class/Type trong file: Không có class/type (tài liệu điều phối audit/spec/policy).
- Test liên quan: Không có test trực tiếp; dùng để điều phối contract-focused baseline checks và triage mismatch tuần 2.

### docs/roadmap/week2/KPI_CHARTER_V2.md

- Vai trò file: Định nghĩa bộ KPI contract-focused tuần 2 (inventory coverage, schema compliance, rerun stability, mismatch closure).
- Class/Type trong file: Không có class/type (tài liệu KPI governance tuần 2).
- Test liên quan: Không có test trực tiếp; là tiêu chuẩn đánh giá weekly gate và KPI board coverage tuần 2.

### docs/roadmap/week2/CONTRACT_AUDIT_BASELINE_REPORT_V1.md

- Vai trò file: Báo cáo baseline contract audit tuần 2, chuẩn hóa command evidence, taxonomy mismatch và baseline matrix.
- Class/Type trong file: Không có class/type (tài liệu validation/baseline evidence).
- Test liên quan: Tham chiếu trực tiếp các lệnh `pytest`/`cargo`/`health_check` trong command set contract-focused.

### docs/roadmap/week2/CONTRACT_COMPATIBILITY_MATRIX_V1.md
 
 - Vai trò file: Ma trận tương thích contract Python-Rust với boundary inventory, owner files, test paths và policy checkpoints.
 - Class/Type trong file: Không có class/type (tài liệu contract mapping và ownership).
 - Test liên quan: Dẫn xuất test path cho từng boundary để kiểm tra compatibility theo critical path.
 
### docs/roadmap/week2/COMPATIBILITY_POLICY_V1.md

- Vai trò file: Chính sách tương thích v1 cho hệ thống hybrid, định nghĩa chuẩn runtime (ABI3), chuẩn schema (v1) và mapping data types.
- Class/Type trong file: Không có class/type (tài liệu quản trị runtime/interop).
- Test liên quan: Ràng buộc cấu hình `Cargo.toml` và các startup scripts đảm bảo môi trường rerun ổn định.

### docs/roadmap/week2/ISSUE_REGISTER_V2.md

- Vai trò file: Sổ issue tuần 2 theo mismatch clusters, có severity/owner/ETA/mitigation/exit criteria.
- Class/Type trong file: Không có class/type (tài liệu governance/triage cho Contract Audit).
- Test liên quan: Không có test trực tiếp; map failure/mismatch từ baseline command set vào issue có owner.

### docs/roadmap/week2/INTERFACE_SPEC_DELTA_V1.md

- Vai trò file: Delta spec tuần 2 cho `schema_version`, `RiskDecision`, `ExecutionAck`, `ObservabilityEvent` và compatibility policy.
- Class/Type trong file: Không có class/type code; định nghĩa contract fields/policy/acceptance cho tuần 3 implementation.
- Test liên quan: Làm đầu vào cho contract tests (positive/negative/version mismatch) và integration handshake tuần 3.

### docs/roadmap/week2/GATE_REHEARSAL_NOTES.md

- Vai trò file: Ghi chú rehearsal gate tuần 2, tổng hợp checklist status, blocking conditions và quyết định Go/No-Go provisional.
- Class/Type trong file: Không có class/type (tài liệu gate review).
- Test liên quan: Xác nhận khả năng rerun baseline contract checks và tình trạng ownership của mismatch P0/P1.

### docs/roadmap/week2/WEEK2_FINAL_REPORT_AND_WEEK3_START_PACK.md

- Vai trò file: Báo cáo tổng kết tuần 2 và gói khởi động tuần 3 (schema versioning kickoff priorities + gate criteria).
- Class/Type trong file: Không có class/type (tài liệu weekly closeout + handoff).
- Test liên quan: Tổng hợp evidence từ compatibility matrix, baseline report, interface delta và issue register để quyết định Go/No-Go tuần 3.

### docs/roadmap/week3/GATE_REHEARSAL_NOTES.md

- Vai trò file: Ghi chú rehearsal gate tuần 3, tổng hợp checklist status, blocking conditions và điều kiện Go/No-Go vào tuần 4, bao gồm hardening checks `W3-T19..W3-T23`.
- Class/Type trong file: Không có class/type (tài liệu gate review).
- Test liên quan: Xác nhận baseline schema tests, fuzzing no-panic, extreme negative tests, shadow log audit, network disconnect simulation, playbook sync và điều kiện đóng `W3-ISS-009`.

### docs/roadmap/week3/WEEK3_FINAL_REPORT_AND_WEEK4_START_PACK.md

- Vai trò file: Báo cáo tổng kết tuần 3 và gói khởi động tuần 4 (integration stabilization priorities + gate criteria), có KPI hiệu năng baseline và kết luận `NO-GO có điều kiện` khi evidence chưa đủ.
- Class/Type trong file: Không có class/type (tài liệu weekly closeout + handoff).
- Test liên quan: Tổng hợp evidence từ baseline report, cutover plan, implementation spec, hardening tasks (`W3-T19..W3-T23`) và issue register để quyết định Go/No-Go tuần 4.

### docs/roadmap/W03_OPERATIONS_PLAN.md

- Vai trò file: Kế hoạch vận hành tuần 3 theo mô hình one-pass contract cutover, tập trung triển khai một chuẩn hợp đồng thống nhất trong một đợt với `schema_version` cố định.
- Class/Type trong file: Không có class/type (tài liệu điều phối implementation, test matrix, gate criteria).
- Test liên quan: Điều phối command profile baseline, compliance audit script, correlation source audit, fuzzing/shadow-audit, network simulation và performance watermark cho gate tuần 3.

### docs/roadmap/week3/KPI_CHARTER_WEEK3.md

- Vai trò file: KPI charter cho one-pass cutover, bổ sung chỉ số drift/burn-down, ngưỡng auto-block và performance baseline (avg/p95/max latency).
- Class/Type trong file: Không có class/type (tài liệu KPI governance tuần 3).
- Test liên quan: Dùng evidence từ baseline report, issue register, gate notes để tính KPI.

### docs/roadmap/week3/CONTRACT_BASELINE_REPORT.md

- Vai trò file: Baseline report cho one-pass cutover, chứa preflight clean-slate, command evidence set, matrix expected/actual/evidence, hardening tests và performance baseline.
- Class/Type trong file: Không có class/type (tài liệu validation/baseline evidence).
- Test liên quan: Tham chiếu trực tiếp `pytest`, `cargo test/check`, `health_check`, `compliance_audit.sh`, `audit_correlation.py` theo command profile tuần 3.

### docs/roadmap/week3/CUTOVER_PLAN.md

- Vai trò file: Kế hoạch cutover one-pass với dependency matrix giữa các lane, triage clusters A/B/C và rollback drill từ snapshot trước cutover.
- Class/Type trong file: Không có class/type (tài liệu rollout/rollback strategy).
- Test liên quan: Kiểm chứng dependency gate và rollback rehearsal evidence (`EV-W3-5xx`).

### docs/roadmap/week3/ISSUE_REGISTER_WEEK3.md

- Vai trò file: Sổ issue tuần 3 cho one-pass cutover, có metadata mở rộng (`ETA`, `evidence_id`, `blocking_of`) và phân cụm triage A/B/C.
- Class/Type trong file: Không có class/type (tài liệu governance/triage).
- Test liên quan: Map lỗi từ baseline/test matrix, source audit, network rehearsal vào owner/ETA/mitigation và gate blockers.

### docs/roadmap/week3/INTERFACE_IMPLEMENTATION_SPEC.md

- Vai trò file: Spec triển khai interface one-pass, định nghĩa wire envelope có `schema_version`, mapping contract và error-handling protocol fail-safe.
- Class/Type trong file: Không có class/type code; định nghĩa contract fields và runtime behavior.
- Test liên quan: Là đầu vào trực tiếp cho parser tests, cross-runtime tests và observability tests tuần 3.

### docs/roadmap/W04_OPERATIONS_PLAN.md

- Vai trò file: Kế hoạch vận hành tuần 4 cho integration stabilization, tập trung ổn định critical path `signal -> risk -> execution`, reconnect/rollback rehearsal và gate reconciliation.
- Class/Type trong file: Không có class/type (tài liệu điều phối stabilization, issue closure, gate decision).
- Test liên quan: Điều phối command profile tích hợp (pytest integration + cargo test/check + health/compliance/correlation audits) và scenario rehearsal tuần 4.

### docs/roadmap/week4/KPI_CHARTER_WEEK4.md

- Vai trò file: KPI charter tuần 4 cho integration stabilization, định nghĩa ngưỡng smoke/reconnect/rollback/correlation/governance để quyết định gate.
- Class/Type trong file: Không có class/type (tài liệu KPI governance tuần 4).
- Test liên quan: Dùng evidence từ baseline report, issue register và gate notes để tính KPI.

### docs/roadmap/week4/INTEGRATION_BASELINE_REPORT.md

- Vai trò file: Baseline report tuần 4 cho stabilization, chuẩn hóa matrix `expected/actual/status/evidence_id` cho command profile và scenario rehearsal.
- Class/Type trong file: Không có class/type (tài liệu validation/baseline evidence).
- Test liên quan: Tham chiếu trực tiếp `pytest integration`, `cargo test/check`, `health_check`, `compliance_audit.sh`, `audit_correlation.py` theo command profile tuần 4.

### docs/roadmap/week4/STABILIZATION_PLAN.md

- Vai trò file: Kế hoạch stabilization tuần 4 với dependency matrix theo lane, triage clusters A/B/C và rollback triggers cho reconnect/runtime failures.
- Class/Type trong file: Không có class/type (tài liệu rollout stabilization/rollback strategy).
- Test liên quan: Kiểm chứng reconnect rehearsal, rollback rehearsal, smoke rerun và artifact consistency trước gate.

### docs/roadmap/week4/ISSUE_REGISTER_WEEK4.md

- Vai trò file: Sổ issue tuần 4 cho integration stabilization, có metadata đầy đủ (`ETA`, `evidence_id`, `blocking_of`) và mapping carry-over từ tuần 3.
- Class/Type trong file: Không có class/type (tài liệu governance/triage tuần 4).
- Test liên quan: Map failure từ baseline/scenario matrix vào owner/ETA/mitigation và quyết định gate blockers.

### docs/roadmap/week4/INTERFACE_STABILITY_SPEC.md

- Vai trò file: Spec ổn định interface tuần 4, khóa canonical envelope (`schema_version`, `correlation_id`, `event_type`, `timestamp`, `payload`) và guardrail đổi type/interface.
- Class/Type trong file: Không có class/type code; định nghĩa policy contract freeze và error-handling protocol.
- Test liên quan: Là đầu vào cho parser/integration/observability checks trong stabilization pass.

### docs/roadmap/week4/GATE_REHEARSAL_NOTES.md

- Vai trò file: Ghi chú rehearsal gate tuần 4, tổng hợp ngưỡng pass/fail, trạng thái checklist và điều kiện chốt `GO/NO-GO` duy nhất.
- Class/Type trong file: Không có class/type (tài liệu gate review tuần 4).
- Test liên quan: Xác nhận build/lint/type/smoke, reconnect/rollback rehearsal, correlation audit và artifact consistency.

### docs/roadmap/week4/WEEK4_FINAL_REPORT_AND_WEEK5_START_PACK.md

- Vai trò file: Báo cáo tổng kết tuần 4 và gói khởi động tuần 5 (Risk Limits v1), chứa cả nhánh `GO` và recovery queue khi `NO-GO`.
- Class/Type trong file: Không có class/type (tài liệu weekly closeout + handoff).
- Test liên quan: Tổng hợp evidence từ baseline report, issue register, gate rehearsal để ra quyết định final và handoff tuần 5.

### docs/roadmap/W05_OPERATIONS_PLAN.md

- Vai trò file: Kế hoạch vận hành tuần 5 cho Risk Limits v1, tập trung enforce giới hạn theo symbol/strategy, chuẩn hóa reject semantics và gate Phase 2.
- Class/Type trong file: Không có class/type (tài liệu điều phối implementation risk limits, triage và closeout).
- Test liên quan: Điều phối command profile risk-focused (pytest integration + cargo test/check + health/compliance/correlation audits) và scenario matrix tuần 5.

### docs/roadmap/week5/KPI_CHARTER_WEEK5.md

- Vai trò file: KPI charter tuần 5 cho Risk Limits v1, định nghĩa ngưỡng duplicate-order rate, risk breach, limit compliance và governance consistency.
- Class/Type trong file: Không có class/type (tài liệu KPI governance tuần 5).
- Test liên quan: Dùng evidence từ baseline report, issue register và gate notes để tính KPI.

### docs/roadmap/week5/RISK_LIMITS_BASELINE_REPORT.md

- Vai trò file: Baseline report tuần 5 cho Risk Limits v1, chuẩn hóa matrix `expected/actual/status/evidence_id` cho command profile và risk scenarios.
- Class/Type trong file: Không có class/type (tài liệu validation/baseline evidence).
- Test liên quan: Tham chiếu trực tiếp `pytest integration`, `cargo test/check`, `health_check`, `compliance_audit.sh`, `audit_correlation.py` theo command profile tuần 5.

### docs/roadmap/week5/RISK_LIMITS_IMPLEMENTATION_PLAN.md

- Vai trò file: Kế hoạch triển khai Risk Limits v1 với dependency matrix theo lane, triage clusters A/B/C và rollback strategy cho regressions tuần 5.
- Class/Type trong file: Không có class/type (tài liệu rollout/rollback strategy cho risk limits).
- Test liên quan: Kiểm chứng limit compliance, reject semantics, duplicate-order guardrail và artifact consistency trước gate.

### docs/roadmap/week5/ISSUE_REGISTER_WEEK5.md

- Vai trò file: Sổ issue tuần 5 cho Risk Limits v1, có metadata đầy đủ (`ETA`, `evidence_id`, `blocking_of`) và mapping theo blockers Phase 2.
- Class/Type trong file: Không có class/type (tài liệu governance/triage tuần 5).
- Test liên quan: Map failure từ baseline/scenario matrix vào owner/ETA/mitigation và quyết định gate blockers.

### docs/roadmap/week5/INTERFACE_RISK_LIMITS_SPEC.md

- Vai trò file: Spec interface tuần 5 cho risk limits, giữ canonical envelope freeze và khóa behavioral rules cho reject semantics (`decision/reason_code/limit_snapshot`).
- Class/Type trong file: Không có class/type code; định nghĩa policy contract freeze và error-handling/reject rules.
- Test liên quan: Là đầu vào cho risk-limit checks, reject-path integration checks và observability audits tuần 5.

### docs/roadmap/week5/GATE_REHEARSAL_NOTES.md

- Vai trò file: Ghi chú rehearsal gate tuần 5, tổng hợp ngưỡng pass/fail cho Phase 2 (`duplicate order <= 0.1%`, `risk breach mới = 0`) và trạng thái checklist.
- Class/Type trong file: Không có class/type (tài liệu gate review tuần 5).
- Test liên quan: Xác nhận build/static/smoke, risk-limit matrix, correlation audit và artifact consistency.

### docs/roadmap/week5/WEEK5_FINAL_REPORT_AND_WEEK6_START_PACK.md

- Vai trò file: Báo cáo tổng kết tuần 5 và gói khởi động tuần 6 (Stop-loss coherence), chứa nhánh `GO` và recovery queue khi `NO-GO`.
- Class/Type trong file: Không có class/type (tài liệu weekly closeout + handoff).
- Test liên quan: Tổng hợp evidence từ baseline report, implementation plan, issue register và gate rehearsal để ra quyết định final tuần 5.

### scripts/compliance_audit.sh

- Vai trò file: Script auto-gate kiểm tra coverage của `correlation_id` và `schema_version` trên log evidence theo cơ chế fail-fast.
- Class/Type trong file: Script shell (không có class/type), hỗ trợ cờ `--check-correlation`, `--check-versioning`, `--log-file`.
- Test liên quan: Chạy trong command profile tuần 3 và map trực tiếp vào gate evidence `EV-W3-106`.

### scripts/audit_correlation.py

- Vai trò file: Script static audit quét logging call ở core paths Python/Rust để phát hiện thiếu `correlation_id` context.
- Class/Type trong file:
  - `Finding` (dataclass): lưu thông tin lỗ hổng theo `path:line:reason`.
- Test liên quan: Chạy trong command profile tuần 3, yêu cầu `0 findings`, map trực tiếp vào evidence `EV-W3-107`.
