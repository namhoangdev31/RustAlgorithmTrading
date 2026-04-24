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

### src/observability/logging/redaction_handler.py

- Vai trò file: Utility redaction dùng chung cho formatter và sink observability, đảm bảo mask nhất quán các field nhạy cảm.
- Class trong file: Không có class (module-level constants/functions).
- Test liên quan: tests/observability/test_structured_logger.py, tests/integration/test_observability_integration.py.

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
- Test liên quan: rust/risk-manager/tests/limit_regression_tests.rs, rust/risk-manager/tests/config_reload_tests.rs, tests/integration/test_stop_loss_integration.rs, tests/integration/test_risk_execution_observability.rs.

### rust/risk-manager/src/lib.rs

- Vai trò file: Risk layer: limit checks, stop logic, PnL tracking, circuit breaker.
- Type trong file:
  - RiskManagerService (struct): Service coordinator/state holder cho component runtime.
- Test liên quan: rust/risk-manager/tests/limit_bva_tests.rs, rust/risk-manager/tests/limit_regression_tests.rs, rust/risk-manager/tests/config_reload_tests.rs, tests/integration/test_risk_execution_observability.rs.

### rust/risk-manager/src/limits.rs

- Vai trò file: Risk layer: limit checks, stop logic, PnL tracking, circuit breaker.
- Type trong file:
  - LimitChecker (struct): Engine xử lý nghiệp vụ lõi theo domain.
- Test liên quan: rust/risk-manager/tests/limit_bva_tests.rs, rust/risk-manager/tests/limit_regression_tests.rs, rust/risk-manager/tests/config_reload_tests.rs, tests/integration/test_risk_execution_observability.rs.

### rust/risk-manager/src/main.rs

- Vai trò file: Risk layer: limit checks, stop logic, PnL tracking, circuit breaker.
- Type trong file: Không có type declaration (thường là wiring, function helpers, hoặc entrypoint).
- Test liên quan: rust/risk-manager/tests/config_reload_tests.rs, rust/risk-manager/tests/limit_bva_tests.rs, tests/integration/test_risk_execution_observability.rs.

### rust/risk-manager/src/bin/verify_stop.rs

- Vai trò file: Helper CLI cho Week 6 parity harness, nhận JSON price stream từ Python và trả stop-loss trigger outcome của Rust risk-manager.
- Type trong file:
  - `ParityRequest` (struct): DTO input cho stop-loss parity check.
  - `ParityResponse` (struct): DTO output chứa trigger status, `correlation_id`, `stop_type`, `reason_code` và trigger/current price.
- Test liên quan: `python scripts/verify_parity_w6.py --fail-on-drift`, `cd rust && cargo test -p risk-manager`.

### rust/risk-manager/src/reload.rs

- Vai trò file: Parser và mapper hot-reload cho `config/risk_limits.toml`, chuyển về `RiskConfig` runtime với rule fail-safe.
- Type trong file:
  - RiskLimitsToml (struct): DTO parse config TOML theo section.
- Test liên quan: rust/risk-manager/tests/config_reload_tests.rs.

### rust/risk-manager/src/pnl.rs

- Vai trò file: Risk layer: limit checks, stop logic, PnL tracking, circuit breaker.
- Type trong file:
  - PositionState (struct): Cấu trúc dữ liệu/domain state của module.
  - PnLTracker (struct): Engine xử lý nghiệp vụ lõi theo domain.
- Test liên quan: rust/risk-manager/tests/limit_regression_tests.rs, tests/integration/test_risk_execution_observability.rs.

### rust/risk-manager/src/stops.rs

- Vai trò file: Risk layer: limit checks, stop logic, PnL tracking, circuit breaker.
- Type trong file:
  - StopLossType (enum): Enum biểu diễn trạng thái/loại dữ liệu/nhánh xử lý nghiệp vụ.
  - StopLossConfig (struct): Cấu hình strongly-typed cho module/service.
  - StopLossState (struct): Cấu trúc dữ liệu/domain state của module.
  - StopManager (struct): Quản lý tài nguyên/lifecycle hoặc orchestration nội bộ.
  - StopLossTrigger (struct): Cấu trúc dữ liệu/domain state của module.
- Test liên quan: rust/risk-manager/tests/limit_regression_tests.rs, rust/risk-manager/tests/config_reload_tests.rs, tests/integration/test_stop_loss_integration.rs.

### rust/risk-manager/tests/limit_bva_tests.rs

- Vai trò file: Bộ test BVA cho Risk Limits v1, xác nhận ngưỡng `limit-1/limit/limit+1` cho symbol/strategy limits và guardrail hiệu năng lookup risk.
- Type trong file: Không có type declaration (test cases mức crate/integration).
- Test liên quan: `cd rust && cargo test -p risk-manager --test limit_bva_tests`, `cd rust && cargo test -p risk-manager`.

### rust/risk-manager/tests/limit_regression_tests.rs

- Vai trò file: Regression tests cho risk limits path (edge cases và projected-position behavior) sau khi hợp nhất từ legacy test suite.
- Type trong file: Không có type declaration (test cases mức crate/integration).
- Test liên quan: `cd rust && cargo test -p risk-manager --test limit_regression_tests`, `cd rust && cargo test -p risk-manager`.

### rust/risk-manager/tests/config_reload_tests.rs

- Vai trò file: Kiểm chứng parser TOML + behavior hot-reload (`SIGHUP`) theo rule fail-safe cho risk config.
- Type trong file: Không có type declaration (test cases mức crate/integration).
- Test liên quan: `cd rust && cargo test -p risk-manager --test config_reload_tests`, `cd rust && cargo test -p risk-manager`.

### rust/risk-manager/tests/stop_bench_tests.rs

- Vai trò file: Dedicated micro-benchmark cho `StopManager::check`, xác nhận latency rủi ro luôn `<=0.2ms` dưới áp lực 1000+ positions.
- Type trong file: Không có type declaration (harness performance test).
- Test liên quan: `cd rust && cargo test -p risk-manager --test stop_bench_tests -- --nocapture`.

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
  - cd rust && cargo test -p risk-manager --test limit_bva_tests --test limit_regression_tests --test config_reload_tests
  - cd tests && cargo test --test test_risk_manager --test test_stop_loss_integration
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

### docs/roadmap/W06_OPERATIONS_PLAN.md

- Vai trò file: Kế hoạch vận hành tuần 6 cho Stop-loss coherence, tập trung đồng bộ stop-loss Python/Rust, execution side-effect guardrail và gate Phase 2.
- Class/Type trong file: Không có class/type (tài liệu điều phối implementation stop-loss, triage và closeout).
- Test liên quan: Điều phối command profile stop-loss-focused (pytest immediate stop regression + pytest integration + cargo test/check + health/compliance/correlation audits) và scenario matrix tuần 6.

### docs/roadmap/week6/KPI_CHARTER_WEEK6.md

- Vai trò file: KPI charter tuần 6 cho Stop-loss coherence, định nghĩa ngưỡng parity, duplicate stop-order, side-effect, stale cleanup và governance consistency.
- Class/Type trong file: Không có class/type (tài liệu KPI governance tuần 6).
- Test liên quan: Dùng evidence từ baseline report, issue register và gate notes để tính KPI.

### docs/roadmap/week6/STOP_LOSS_BASELINE_REPORT.md

- Vai trò file: Baseline report tuần 6 cho Stop-loss coherence, chuẩn hóa matrix `expected/actual/status/evidence_id` cho command profile và stop-loss scenarios.
- Class/Type trong file: Không có class/type (tài liệu validation/baseline evidence).
- Test liên quan: Tham chiếu trực tiếp immediate stop regression, `pytest integration`, `cargo test/check`, `health_check`, `compliance_audit.sh`, `audit_correlation.py` theo command profile tuần 6.

### docs/roadmap/week6/STOP_LOSS_IMPLEMENTATION_PLAN.md

- Vai trò file: Kế hoạch triển khai Stop-loss coherence với dependency matrix theo lane, triage clusters A/B/C và rollback strategy cho regressions tuần 6.
- Class/Type trong file: Không có class/type (tài liệu rollout/rollback strategy cho stop-loss).
- Test liên quan: Kiểm chứng Python/Rust stop semantics parity, execution side-effect guardrail, stale cleanup và artifact consistency trước gate.

### docs/roadmap/week6/ISSUE_REGISTER_WEEK6.md

- Vai trò file: Sổ issue tuần 6 cho Stop-loss coherence, có metadata đầy đủ (`ETA`, `evidence_id`, `blocking_of`) và mapping theo blockers Phase 2.
- Class/Type trong file: Không có class/type (tài liệu governance/triage tuần 6).
- Test liên quan: Map failure từ baseline/scenario matrix vào owner/ETA/mitigation và quyết định gate blockers.

### docs/roadmap/week6/INTERFACE_STOP_LOSS_SPEC.md

- Vai trò file: Spec interface tuần 6 cho stop-loss, giữ canonical envelope freeze và khóa behavioral rules cho stop event semantics.
- Class/Type trong file: Không có class/type code; định nghĩa policy contract freeze và error-handling/stop event rules.
- Test liên quan: Là đầu vào cho stop-loss checks, execution stop-path integration checks và observability audits tuần 6.

### docs/roadmap/week6/GATE_REHEARSAL_NOTES.md

- Vai trò file: Ghi chú rehearsal gate tuần 6, tổng hợp ngưỡng pass/fail cho Phase 2 (`duplicate stop-order <= 0.1%`, stop side-effect lớn = 0) và trạng thái checklist.
- Class/Type trong file: Không có class/type (tài liệu gate review tuần 6).
- Test liên quan: Xác nhận build/static/smoke, stop-loss parity matrix, correlation audit và artifact consistency.

### docs/roadmap/week6/WEEK6_FINAL_REPORT_AND_WEEK7_START_PACK.md

- Vai trò file: Báo cáo tổng kết tuần 6 và gói khởi động tuần 7 (Circuit breaker hardening), chứa nhánh `GO` và recovery queue khi `NO-GO`.
- Class/Type trong file: Không có class/type (tài liệu weekly closeout + handoff).
- Test liên quan: Tổng hợp evidence từ baseline report, implementation plan, issue register và gate rehearsal để ra quyết định final tuần 6.

### docs/roadmap/W07_OPERATIONS_PLAN.md

- Vai trò file: Kế hoạch vận hành tuần 7 cho Circuit Breaker Hardening, tập trung state machine, cooldown/recovery, stress no loop-trip, execution guard và gate Phase 2.
- Class/Type trong file: Không có class/type (tài liệu điều phối implementation circuit breaker, triage và closeout).
- Test liên quan: Điều phối command profile circuit-breaker-focused (pytest integration + cargo test/check + health/compliance/correlation audits) và scenario matrix tuần 7.

### docs/roadmap/week7/KPI_CHARTER_WEEK7.md

- Vai trò file: KPI charter tuần 7 cho Circuit Breaker Hardening, định nghĩa ngưỡng transition coverage, loop-trip count, false reset, risk-off bypass và governance consistency.
- Class/Type trong file: Không có class/type (tài liệu KPI governance tuần 7).
- Test liên quan: Dùng evidence từ baseline report, issue register và gate notes để tính KPI.

### docs/roadmap/week7/CIRCUIT_BREAKER_BASELINE_REPORT.md

- Vai trò file: Baseline report tuần 7 cho circuit breaker, chuẩn hóa matrix `expected/actual/status/evidence_id` cho command profile, transition scenarios, stress và runbook drill.
- Class/Type trong file: Không có class/type (tài liệu validation/baseline evidence).
- Test liên quan: Tham chiếu trực tiếp `pytest integration`, `cargo test/check`, `health_check`, `compliance_audit.sh`, `audit_correlation.py` theo command profile tuần 7.

### docs/roadmap/week7/CIRCUIT_BREAKER_IMPLEMENTATION_PLAN.md

- Vai trò file: Kế hoạch triển khai Circuit Breaker Hardening với dependency matrix theo lane, triage clusters A/B/C và rollback strategy cho regressions tuần 7.
- Class/Type trong file: Không có class/type (tài liệu rollout/rollback strategy cho circuit breaker).
- Test liên quan: Kiểm chứng state transition, cooldown/recovery, execution side-effect guardrail, stress no loop-trip và artifact consistency trước gate.

### rust/risk-manager/tests/circuit_breaker_tests.rs

- Vai trò file: Bộ integration tests cho Week 7 Circuit Breaker Hardening, bao phủ state machine, cooldown, reset approval, half-open probe, hot-reload guard và correlation preservation.
- Class/Type trong file: Không định nghĩa production class/type; dùng `RiskManagerService`, `CircuitBreakerState`, `TripReason` để kiểm chứng behavior public nội bộ crate.
- Test liên quan: Chạy bằng `cd rust && PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 cargo test -p risk-manager`.

### docs/roadmap/week7/ISSUE_REGISTER_WEEK7.md

- Vai trò file: Sổ issue tuần 7 cho Circuit Breaker Hardening, có metadata đầy đủ (`ETA`, `evidence_id`, `blocking_of`) và mapping theo blockers Phase 2.
- Class/Type trong file: Không có class/type (tài liệu governance/triage tuần 7).
- Test liên quan: Map failure từ baseline/scenario matrix vào owner/ETA/mitigation và quyết định gate blockers.

### docs/roadmap/week7/INTERFACE_CIRCUIT_BREAKER_SPEC.md

- Vai trò file: Spec interface tuần 7 cho circuit breaker, giữ canonical envelope freeze và khóa behavioral rules cho state/event semantics.
- Class/Type trong file: Không có class/type code; định nghĩa policy contract freeze, state machine contract và error-handling/reset rules.
- Test liên quan: Là đầu vào cho circuit breaker checks, execution reject-path checks, metrics và observability audits tuần 7.

### docs/roadmap/week7/GATE_REHEARSAL_NOTES.md

- Vai trò file: Ghi chú rehearsal gate tuần 7, tổng hợp ngưỡng pass/fail cho Phase 2 (`loop-trip count = 0`, risk-off bypass = 0, duplicate side-effect <= 0.1%) và trạng thái checklist.
- Class/Type trong file: Không có class/type (tài liệu gate review tuần 7).
- Test liên quan: Xác nhận build/static/smoke, transition matrix, cooldown/recovery, stress, correlation audit và artifact consistency.

### docs/roadmap/week7/WEEK7_FINAL_REPORT_AND_WEEK8_START_PACK.md

- Vai trò file: Báo cáo tổng kết tuần 7 và gói khởi động tuần 8 (Execution retry/slippage), chứa nhánh `GO` và recovery queue khi `NO-GO`.
- Class/Type trong file: Không có class/type (tài liệu weekly closeout + handoff).
- Test liên quan: Tổng hợp evidence từ baseline report, implementation plan, issue register và gate rehearsal để ra quyết định final tuần 7.

### docs/roadmap/W08_OPERATIONS_PLAN.md

- Vai trò file: Kế hoạch vận hành tuần 8 cho Execution Retry/Slippage, tập trung retry classification, idempotency, slippage guardrails, W07 breaker interaction và gate Phase 2.
- Class/Type trong file: Không có class/type (tài liệu điều phối implementation execution retry/slippage, triage và closeout).
- Test liên quan: Điều phối command profile execution-focused (pytest integration + cargo test/check + health/compliance/correlation audits) và scenario matrix tuần 8.

### docs/roadmap/week8/KPI_CHARTER_WEEK8.md

- Vai trò file: KPI charter tuần 8 cho Execution Retry/Slippage, định nghĩa ngưỡng duplicate order rate, retry classification coverage, slippage boundary coverage và governance consistency.
- Class/Type trong file: Không có class/type (tài liệu KPI governance tuần 8).
- Test liên quan: Dùng evidence từ baseline report, issue register và gate notes để tính KPI.

### docs/roadmap/week8/EXECUTION_RETRY_SLIPPAGE_BASELINE_REPORT.md

- Vai trò file: Baseline report tuần 8 cho retry/slippage, chuẩn hóa matrix `expected/actual/status/evidence_id` cho command profile, retry classification, duplicate guard và slippage boundary.
- Class/Type trong file: Không có class/type (tài liệu validation/baseline evidence).
- Test liên quan: Tham chiếu trực tiếp `pytest integration`, `cargo test/check`, `health_check`, `compliance_audit.sh`, `audit_correlation.py` theo command profile tuần 8.

### docs/roadmap/week8/RETRY_SLIPPAGE_IMPLEMENTATION_PLAN.md

- Vai trò file: Kế hoạch triển khai Execution Retry/Slippage với dependency matrix theo lane, retry classification policy, idempotency policy và rollback strategy cho regressions tuần 8.
- Class/Type trong file: Không có class/type (tài liệu rollout/rollback strategy cho execution retry/slippage).
- Test liên quan: Kiểm chứng retry classification, duplicate-order guardrail, slippage boundary, W07 risk-off interaction và artifact consistency trước gate.

### docs/roadmap/week8/ISSUE_REGISTER_WEEK8.md

- Vai trò file: Sổ issue tuần 8 cho Execution Retry/Slippage, có metadata đầy đủ (`ETA`, `evidence_id`, `blocking_of`) và mapping theo blockers Phase 2.
- Class/Type trong file: Không có class/type (tài liệu governance/triage tuần 8).
- Test liên quan: Map failure từ baseline/scenario matrix vào owner/ETA/mitigation và quyết định gate blockers.

### docs/roadmap/week8/INTERFACE_RETRY_SLIPPAGE_SPEC.md

- Vai trò file: Spec interface tuần 8 cho retry/slippage, giữ canonical envelope freeze và khóa behavioral rules cho retry, slippage, idempotency và error handling.
- Class/Type trong file: Không có class/type code; định nghĩa policy contract freeze, execution event semantics và file-level edit contract.
- Test liên quan: Là đầu vào cho retry tests, slippage boundary checks, execution reject-path checks, metrics và observability audits tuần 8.

### docs/roadmap/week8/GATE_REHEARSAL_NOTES.md

- Vai trò file: Ghi chú rehearsal gate tuần 8, tổng hợp ngưỡng pass/fail cho Phase 2 (`duplicate order rate <= 0.1%`, risk-off bypass = 0, slippage invalid acceptance = 0) và trạng thái checklist.
- Class/Type trong file: Không có class/type (tài liệu gate review tuần 8).
- Test liên quan: Xác nhận build/static/smoke, retry classification, slippage boundary, W05/W06/W07 regression, correlation audit và artifact consistency.

### docs/roadmap/week8/WEEK8_FINAL_REPORT_AND_WEEK9_START_PACK.md

- Vai trò file: Báo cáo tổng kết tuần 8 và gói khởi động tuần 9 (Observability Contract), chứa nhánh `GO` và recovery queue khi `NO-GO`.
- Class/Type trong file: Không có class/type (tài liệu weekly closeout + handoff).
- Test liên quan: Tổng hợp evidence từ baseline report, implementation plan, issue register và gate rehearsal để ra quyết định final tuần 8.

### docs/roadmap/W09_OPERATIONS_PLAN.md

- Vai trò file: Kế hoạch vận hành tuần 9 cho Observability Contract, tập trung structured logging schema, correlation continuity, redaction, dashboard/API schema sync và alert readiness.
- Class/Type trong file: Không có class/type (tài liệu điều phối implementation observability contract, triage và closeout).
- Test liên quan: Điều phối command profile observability-focused (`tests/observability`, pytest integration, cargo test/check, health/compliance/correlation audits) và scenario matrix tuần 9.

### docs/roadmap/week9/KPI_CHARTER_WEEK9.md

- Vai trò file: KPI charter tuần 9 cho Observability Contract, định nghĩa ngưỡng correlation coverage, structured log parseability, redaction leak count, dashboard availability và alert readiness.
- Class/Type trong file: Không có class/type (tài liệu KPI governance tuần 9).
- Test liên quan: Dùng evidence từ baseline report, issue register và gate notes để tính KPI.

### docs/roadmap/week9/OBSERVABILITY_BASELINE_REPORT.md

- Vai trò file: Baseline report tuần 9 cho observability contract, chuẩn hóa matrix `expected/actual/status/evidence_id` cho command profile, correlation coverage, schema parseability, redaction và alert readiness.
- Class/Type trong file: Không có class/type (tài liệu validation/baseline evidence).
- Test liên quan: Tham chiếu trực tiếp `tests/observability`, `test_observability_integration.py`, `cargo test/check`, `health_check`, `compliance_audit.sh`, `audit_correlation.py` theo command profile tuần 9.

### docs/roadmap/week9/OBSERVABILITY_CONTRACT_IMPLEMENTATION_PLAN.md

- Vai trò file: Kế hoạch triển khai Observability Contract với dependency matrix theo lane, critical event taxonomy, severity policy, redaction policy và rollback strategy cho regressions tuần 9.
- Class/Type trong file: Không có class/type (tài liệu rollout/rollback strategy cho observability contract).
- Test liên quan: Kiểm chứng structured logging, correlation continuity, Rust metrics/health metadata, dashboard/API schema sync, redaction và artifact consistency trước gate.

### docs/roadmap/week9/ISSUE_REGISTER_WEEK9.md

- Vai trò file: Sổ issue tuần 9 cho Observability Contract, có metadata đầy đủ (`ETA`, `evidence_id`, `blocking_of`) và mapping theo blockers Phase 3.
- Class/Type trong file: Không có class/type (tài liệu governance/triage tuần 9).
- Test liên quan: Map failure từ baseline/scenario matrix vào owner/ETA/mitigation và quyết định gate blockers.

### docs/roadmap/week9/INTERFACE_OBSERVABILITY_CONTRACT_SPEC.md

- Vai trò file: Spec interface tuần 9 cho observability contract, giữ canonical envelope freeze và khóa behavioral rules cho logging/event schema, severity, reason/disposition, component taxonomy và redaction.
- Class/Type trong file: Không có class/type code; định nghĩa policy contract freeze, critical event metadata và file-level edit contract.
- Test liên quan: Là đầu vào cho observability tests, correlation audits, redaction checks, dashboard/API checks và alert readiness rehearsal tuần 9.

### docs/roadmap/week9/GATE_REHEARSAL_NOTES.md

- Vai trò file: Ghi chú rehearsal gate tuần 9, tổng hợp ngưỡng pass/fail cho Phase 3 (`correlation coverage >= 99%`, redaction leak count = 0, critical alert false-negative = 0) và trạng thái checklist.
- Class/Type trong file: Không có class/type (tài liệu gate review tuần 9).
- Test liên quan: Xác nhận build/static/smoke, observability contract matrix, W05-W08 regression, correlation audit và artifact consistency.

### docs/roadmap/week9/WEEK9_FINAL_REPORT_AND_WEEK10_START_PACK.md

- Vai trò file: Báo cáo tổng kết tuần 9 và gói khởi động tuần 10 (API Health & SLO), chứa nhánh `GO` và recovery queue khi `NO-GO`.
- Class/Type trong file: Không có class/type (tài liệu weekly closeout + handoff).
- Test liên quan: Tổng hợp evidence từ baseline report, implementation plan, issue register và gate rehearsal để ra quyết định final tuần 9.

### docs/roadmap/W10_OPERATIONS_PLAN.md

- Vai trò file: Kế hoạch vận hành tuần 10 cho API Health & SLO, tập trung health/readiness/liveness, component health, WebSocket heartbeat, alert profile và dashboard SLO panels.
- Class/Type trong file: Không có class/type (tài liệu điều phối implementation API health/SLO, triage và closeout).
- Test liên quan: Điều phối command profile API-health/SLO-focused (`tests/observability/test_api.py`, `tests/observability`, pytest integration, cargo test/check, health/compliance/correlation audits) và scenario matrix tuần 10.

### docs/roadmap/week10/KPI_CHARTER_WEEK10.md

- Vai trò file: KPI charter tuần 10 cho API Health & SLO, định nghĩa ngưỡng health latency, readiness/liveness correctness, WebSocket heartbeat, alert quality và dashboard SLO availability.
- Class/Type trong file: Không có class/type (tài liệu KPI governance tuần 10).
- Test liên quan: Dùng evidence từ baseline report, issue register và gate notes để tính KPI.

### docs/roadmap/week10/API_HEALTH_SLO_BASELINE_REPORT.md

- Vai trò file: Baseline report tuần 10 cho API health/SLO, chuẩn hóa matrix `expected/actual/status/evidence_id` cho command profile, health endpoint SLO, alert quality, dashboard SLO và regression guard.
- Class/Type trong file: Không có class/type (tài liệu validation/baseline evidence).
- Test liên quan: Tham chiếu trực tiếp `tests/observability/test_api.py`, `tests/observability`, `test_observability_integration.py`, `cargo test/check`, `health_check`, `compliance_audit.sh`, `audit_correlation.py` theo command profile tuần 10.

### docs/roadmap/week10/API_HEALTH_SLO_IMPLEMENTATION_PLAN.md

- Vai trò file: Kế hoạch triển khai API Health & SLO với dependency matrix theo lane, SLO dictionary, alert profile policy, dashboard SLO requirements và rollback strategy cho regressions tuần 10.
- Class/Type trong file: Không có class/type (tài liệu rollout/rollback strategy cho API health/SLO).
- Test liên quan: Kiểm chứng health/readiness/liveness, component health, WebSocket heartbeat, alert quality, dashboard SLO panels và artifact consistency trước gate.

### docs/roadmap/week10/ISSUE_REGISTER_WEEK10.md

- Vai trò file: Sổ issue tuần 10 cho API Health & SLO, có metadata đầy đủ (`ETA`, `evidence_id`, `blocking_of`) và mapping theo blockers Phase 3.
- Class/Type trong file: Không có class/type (tài liệu governance/triage tuần 10).
- Test liên quan: Map failure từ baseline/scenario matrix vào owner/ETA/mitigation và quyết định gate blockers.

### docs/roadmap/week10/INTERFACE_API_HEALTH_SLO_SPEC.md

- Vai trò file: Spec interface tuần 10 cho API health/SLO, giữ canonical envelope freeze và khóa behavioral rules cho health endpoints, alert profile, SLO dictionary và error handling.
- Class/Type trong file: Không có class/type code; định nghĩa policy contract freeze, endpoint contract, alert profile và file-level edit contract.
- Test liên quan: Là đầu vào cho API health tests, observability tests, WebSocket heartbeat checks, alert quality rehearsal và dashboard SLO validation tuần 10.

### docs/roadmap/week10/GATE_REHEARSAL_NOTES.md

- Vai trò file: Ghi chú rehearsal gate tuần 10, tổng hợp ngưỡng pass/fail cho Phase 3 (`/health p95 <= 100ms`, alert false-positive <= 15%, critical false-negative = 0) và trạng thái checklist.
- Class/Type trong file: Không có class/type (tài liệu gate review tuần 10).
- Test liên quan: Xác nhận build/static/smoke, API health/SLO matrix, W05-W09 regression, correlation audit và artifact consistency.

### docs/roadmap/week10/WEEK10_FINAL_REPORT_AND_WEEK11_START_PACK.md

- Vai trò file: Báo cáo tổng kết tuần 10 và gói khởi động tuần 11 (Incident Runbook), chứa nhánh `GO` và recovery queue khi `NO-GO`.
- Class/Type trong file: Không có class/type (tài liệu weekly closeout + handoff).
- Test liên quan: Tổng hợp evidence từ baseline report, implementation plan, issue register và gate rehearsal để ra quyết định final tuần 10.

### docs/roadmap/W11_OPERATIONS_PLAN.md

- Vai trò file: Kế hoạch vận hành tuần 11 cho Incident Runbook, tập trung P0/P1 response flow, escalation matrix, drill rehearsal, closeout evidence và W12 readiness handoff.
- Class/Type trong file: Không có class/type (tài liệu điều phối ops readiness, triage và closeout).
- Test liên quan: Điều phối command profile incident-runbook-focused (`tests/observability/test_api.py`, `tests/observability`, pytest integration, cargo test/check, health/compliance/correlation audits) và scenario matrix tuần 11.

### docs/roadmap/week11/KPI_CHARTER_WEEK11.md

- Vai trò file: KPI charter tuần 11 cho Incident Runbook, định nghĩa ngưỡng P0/P1 acknowledgement, owner assignment, drill completion, closeout evidence, postmortem coverage và alert quality.
- Class/Type trong file: Không có class/type (tài liệu KPI governance tuần 11).
- Test liên quan: Dùng evidence từ baseline report, issue register và gate notes để tính KPI.

### docs/roadmap/week11/INCIDENT_RUNBOOK_BASELINE_REPORT.md

- Vai trò file: Baseline report tuần 11 cho incident runbook, chuẩn hóa matrix `expected/actual/status/evidence_id` cho command profile, incident drills, escalation SLA, regression guard và gate reconciliation.
- Class/Type trong file: Không có class/type (tài liệu validation/baseline evidence).
- Test liên quan: Tham chiếu trực tiếp `tests/observability/test_api.py`, `tests/observability`, `test_observability_integration.py`, `cargo test/check`, `health_check`, `compliance_audit.sh`, `audit_correlation.py` theo command profile tuần 11.

### docs/roadmap/week11/INCIDENT_RUNBOOK_IMPLEMENTATION_PLAN.md

- Vai trò file: Kế hoạch triển khai Incident Runbook với file-level guide, severity/escalation contract, required drills, rollback/recovery policy và dependency matrix tuần 11.
- Class/Type trong file: Không có class/type (tài liệu rollout/rollback strategy cho incident runbook).
- Test liên quan: Kiểm chứng P0/P1 acknowledgement, escalation matrix, API degraded, execution alert, circuit breaker, stale stream, position/risk breach drills và artifact consistency trước gate.

### docs/roadmap/week11/ISSUE_REGISTER_WEEK11.md

- Vai trò file: Sổ issue tuần 11 cho Incident Runbook, có metadata đầy đủ (`ETA`, `evidence_id`, `blocking_of`) và mapping theo blockers Phase 3.
- Class/Type trong file: Không có class/type (tài liệu governance/triage tuần 11).
- Test liên quan: Map failure từ baseline/scenario matrix vào owner/ETA/mitigation và quyết định gate blockers.

### docs/roadmap/week11/INTERFACE_INCIDENT_RUNBOOK_SPEC.md

- Vai trò file: Spec interface tuần 11 cho incident runbook, giữ canonical envelope freeze và khóa behavioral rules cho incident record, status transition, escalation matrix và evidence policy.
- Class/Type trong file: Không có class/type code; định nghĩa policy contract freeze, incident record contract và file-level edit contract.
- Test liên quan: Là đầu vào cho incident drills, alert acknowledgement checks, correlation audits, postmortem evidence và gate rehearsal tuần 11.

### docs/roadmap/week11/GATE_REHEARSAL_NOTES.md

- Vai trò file: Ghi chú rehearsal gate tuần 11, tổng hợp ngưỡng pass/fail cho Phase 3 (`P0 ack <= 5m`, required drills 100%, critical false-negative = 0) và trạng thái checklist.
- Class/Type trong file: Không có class/type (tài liệu gate review tuần 11).
- Test liên quan: Xác nhận build/static/smoke, incident drill matrix, W05-W10 regression, correlation audit và artifact consistency.

### docs/roadmap/week11/WEEK11_FINAL_REPORT_AND_WEEK12_START_PACK.md

- Vai trò file: Báo cáo tổng kết tuần 11 và gói khởi động tuần 12 (Ops Readiness Gate), chứa nhánh `GO` và recovery queue khi `NO-GO`.
- Class/Type trong file: Không có class/type (tài liệu weekly closeout + handoff).
- Test liên quan: Tổng hợp evidence từ baseline report, implementation plan, issue register và gate rehearsal để ra quyết định final tuần 11.

### docs/roadmap/W12_OPERATIONS_PLAN.md

- Vai trò file: Kế hoạch vận hành tuần 12 cho Ops Readiness Gate, tập trung readiness checklist, ownership/escalation readiness, rehearsal technical/operational/governance và W13 handoff.
- Class/Type trong file: Không có class/type (tài liệu điều phối readiness gate, triage và closeout).
- Test liên quan: Điều phối command profile readiness-focused (`tests/observability/test_api.py`, `tests/observability`, pytest integration, cargo test/check, health/compliance/correlation audits) và scenario matrix tuần 12.

### docs/roadmap/week12/KPI_CHARTER_WEEK12.md

- Vai trò file: KPI charter tuần 12 cho Ops Readiness Gate, định nghĩa ngưỡng readiness checklist completeness, ownership coverage, rehearsal pass rate, correlation/alert quality và artifact consistency.
- Class/Type trong file: Không có class/type (tài liệu KPI governance tuần 12).
- Test liên quan: Dùng evidence từ baseline report, issue register và gate notes để tính KPI.

### docs/roadmap/week12/OPS_READINESS_BASELINE_REPORT.md

- Vai trò file: Baseline report tuần 12 cho ops readiness, chuẩn hóa matrix `expected/actual/status/evidence_id` cho command profile, readiness rehearsals, regression guard và gate reconciliation.
- Class/Type trong file: Không có class/type (tài liệu validation/baseline evidence).
- Test liên quan: Tham chiếu trực tiếp `tests/observability/test_api.py`, `tests/observability`, `test_observability_integration.py`, `cargo test/check`, `health_check`, `compliance_audit.sh`, `audit_correlation.py` theo command profile tuần 12.

### docs/roadmap/week12/OPS_READINESS_IMPLEMENTATION_PLAN.md

- Vai trò file: Kế hoạch triển khai Ops Readiness Gate với file-level guide, readiness contract, rehearsal flow, rollback policy và dependency matrix tuần 12.
- Class/Type trong file: Không có class/type (tài liệu rollout/rollback strategy cho readiness gate).
- Test liên quan: Kiểm chứng readiness checklist, ownership/escalation, API/SLO readiness, incident/recovery readiness, regression guard và artifact consistency trước gate.

### docs/roadmap/week12/ISSUE_REGISTER_WEEK12.md

- Vai trò file: Sổ issue tuần 12 cho Ops Readiness Gate, có metadata đầy đủ (`ETA`, `evidence_id`, `blocking_of`) và mapping theo blockers Phase 3.
- Class/Type trong file: Không có class/type (tài liệu governance/triage tuần 12).
- Test liên quan: Map failure từ baseline/scenario matrix vào owner/ETA/mitigation và quyết định gate blockers.

### docs/roadmap/week12/INTERFACE_OPS_READINESS_SPEC.md

- Vai trò file: Spec interface tuần 12 cho ops readiness, giữ canonical envelope freeze và khóa behavioral rules cho readiness record, gate verdict contract và evidence linkage.
- Class/Type trong file: Không có class/type code; định nghĩa policy contract freeze, readiness record contract và file-level edit contract.
- Test liên quan: Là đầu vào cho readiness rehearsals, governance consistency checks, correlation/compliance audits và gate rehearsal tuần 12.

### docs/roadmap/week12/GATE_REHEARSAL_NOTES.md

- Vai trò file: Ghi chú rehearsal gate tuần 12, tổng hợp ngưỡng pass/fail cho Ops Readiness Gate (`mandatory checklist = 100%`, `P0 open = 0`, `P1 unowned = 0`) và trạng thái checklist.
- Class/Type trong file: Không có class/type (tài liệu gate review tuần 12).
- Test liên quan: Xác nhận build/static/smoke, readiness rehearsal matrix, W09-W11 regression, correlation audit và artifact consistency.

### docs/roadmap/week12/WEEK12_FINAL_REPORT_AND_WEEK13_START_PACK.md

- Vai trò file: Báo cáo tổng kết tuần 12 và gói khởi động tuần 13 (Strategy Governance), chứa nhánh `GO` và recovery queue khi `NO-GO`.
- Class/Type trong file: Không có class/type (tài liệu weekly closeout + handoff).
- Test liên quan: Tổng hợp evidence từ baseline report, implementation plan, issue register và gate rehearsal để ra quyết định final tuần 12.

### docs/roadmap/W13_OPERATIONS_PLAN.md

- Vai trò file: Kế hoạch vận hành tuần 13 cho Strategy Governance, tập trung OOS/walk-forward checklist enforcement, strategy evidence gate, decision traceability và W14 handoff.
- Class/Type trong file: Không có class/type (tài liệu điều phối strategy governance, triage và closeout).
- Test liên quan: Điều phối command profile strategy-governance-focused (`tests/unit/test_strategy_signals.py`, `tests/test_backtest_integration.py`, pytest integration, cargo test/check, health/compliance/correlation audits) và scenario matrix tuần 13.

### docs/roadmap/week13/KPI_CHARTER_WEEK13.md

- Vai trò file: KPI charter tuần 13 cho Strategy Governance, định nghĩa ngưỡng OOS/walk-forward completeness, strategy evidence gate enforcement, decision traceability, reproducibility drift và artifact consistency.
- Class/Type trong file: Không có class/type (tài liệu KPI governance tuần 13).
- Test liên quan: Dùng evidence từ baseline report, issue register và gate notes để tính KPI.

### docs/roadmap/week13/STRATEGY_GOVERNANCE_BASELINE_REPORT.md

- Vai trò file: Baseline report tuần 13 cho strategy governance, chuẩn hóa matrix `expected/actual/status/evidence_id` cho command profile, governance rehearsals, regression guard và gate reconciliation.
- Class/Type trong file: Không có class/type (tài liệu validation/baseline evidence).
- Test liên quan: Tham chiếu trực tiếp `tests/unit/test_strategy_signals.py`, `tests/test_backtest_integration.py`, integration tests, `cargo test/check`, `health_check`, `compliance_audit.sh`, `audit_correlation.py` theo command profile tuần 13.

### docs/roadmap/week13/STRATEGY_GOVERNANCE_IMPLEMENTATION_PLAN.md

- Vai trò file: Kế hoạch triển khai Strategy Governance với file-level guide, governance contract, rehearsal flow, rollback policy và dependency matrix tuần 13.
- Class/Type trong file: Không có class/type (tài liệu rollout/rollback strategy cho strategy governance).
- Test liên quan: Kiểm chứng OOS/walk-forward enforcement, strategy evidence gate, decision traceability, drift/risk guards, regression guard và artifact consistency trước gate.

### docs/roadmap/week13/ISSUE_REGISTER_WEEK13.md

- Vai trò file: Sổ issue tuần 13 cho Strategy Governance, có metadata đầy đủ (`ETA`, `evidence_id`, `blocking_of`) và mapping theo blockers Phase 4.
- Class/Type trong file: Không có class/type (tài liệu governance/triage tuần 13).
- Test liên quan: Map failure từ baseline/scenario matrix vào owner/ETA/mitigation và quyết định gate blockers.

### docs/roadmap/week13/INTERFACE_STRATEGY_GOVERNANCE_SPEC.md

- Vai trò file: Spec interface tuần 13 cho strategy governance, giữ canonical envelope freeze và khóa behavioral rules cho governance record, enforcement policy, gate verdict contract và evidence linkage.
- Class/Type trong file: Không có class/type code; định nghĩa policy contract freeze, governance record contract và file-level edit contract.
- Test liên quan: Là đầu vào cho governance rehearsals, strategy evidence gate checks, correlation/compliance audits và gate rehearsal tuần 13.

### docs/roadmap/week13/GATE_REHEARSAL_NOTES.md

- Vai trò file: Ghi chú rehearsal gate tuần 13, tổng hợp ngưỡng pass/fail cho Strategy Governance (`OOS/WF completeness = 100%`, `drift <=1%`, `new breach = 0`) và trạng thái checklist.
- Class/Type trong file: Không có class/type (tài liệu gate review tuần 13).
- Test liên quan: Xác nhận build/static/smoke, governance rehearsal matrix, W09-W12 regression, correlation audit và artifact consistency.

### docs/roadmap/week13/WEEK13_FINAL_REPORT_AND_WEEK14_START_PACK.md

- Vai trò file: Báo cáo tổng kết tuần 13 và gói khởi động tuần 14 (Portfolio Controls), chứa nhánh `GO` và recovery queue khi `NO-GO`.
- Class/Type trong file: Không có class/type (tài liệu weekly closeout + handoff).
- Test liên quan: Tổng hợp evidence từ baseline report, implementation plan, issue register và gate rehearsal để ra quyết định final tuần 13.

### docs/roadmap/W14_OPERATIONS_PLAN.md

- Vai trò file: Kế hoạch vận hành tuần 14 cho Portfolio Controls, tập trung exposure/concentration controls enforcement, cross-strategy risk interactions, decision traceability và W15 handoff.
- Class/Type trong file: Không có class/type (tài liệu điều phối portfolio controls, triage và closeout).
- Test liên quan: Điều phối command profile portfolio-controls-focused (`tests/test_backtest_integration.py`, integration tests, cargo test/check, health/compliance/correlation audits) và scenario matrix tuần 14.

### docs/roadmap/week14/KPI_CHARTER_WEEK14.md

- Vai trò file: KPI charter tuần 14 cho Portfolio Controls, định nghĩa ngưỡng exposure/concentration enforcement, cross-strategy coverage, drift/risk guard và artifact consistency.
- Class/Type trong file: Không có class/type (tài liệu KPI governance tuần 14).
- Test liên quan: Dùng evidence từ baseline report, issue register và gate notes để tính KPI.

### docs/roadmap/week14/PORTFOLIO_CONTROLS_BASELINE_REPORT.md

- Vai trò file: Baseline report tuần 14 cho portfolio controls, chuẩn hóa matrix `expected/actual/status/evidence_id` cho command profile, controls rehearsals, regression guard và gate reconciliation.
- Class/Type trong file: Không có class/type (tài liệu validation/baseline evidence).
- Test liên quan: Tham chiếu trực tiếp backtest/integration tests, `cargo test/check`, `health_check`, `compliance_audit.sh`, `audit_correlation.py` theo command profile tuần 14.

### docs/roadmap/week14/PORTFOLIO_CONTROLS_IMPLEMENTATION_PLAN.md

- Vai trò file: Kế hoạch triển khai Portfolio Controls với file-level guide, controls contract, rehearsal flow, rollback policy và dependency matrix tuần 14.
- Class/Type trong file: Không có class/type (tài liệu rollout/rollback strategy cho portfolio controls).
- Test liên quan: Kiểm chứng exposure/concentration enforcement, cross-strategy interactions, decision traceability, drift/risk guards, regression guard và artifact consistency trước gate.

### docs/roadmap/week14/ISSUE_REGISTER_WEEK14.md

- Vai trò file: Sổ issue tuần 14 cho Portfolio Controls, có metadata đầy đủ (`ETA`, `evidence_id`, `blocking_of`) và mapping theo blockers Phase 4.
- Class/Type trong file: Không có class/type (tài liệu governance/triage tuần 14).
- Test liên quan: Map failure từ baseline/scenario matrix vào owner/ETA/mitigation và quyết định gate blockers.

### docs/roadmap/week14/INTERFACE_PORTFOLIO_CONTROLS_SPEC.md

- Vai trò file: Spec interface tuần 14 cho portfolio controls, giữ canonical envelope freeze và khóa behavioral rules cho control record, enforcement policy, gate verdict contract và evidence linkage.
- Class/Type trong file: Không có class/type code; định nghĩa policy contract freeze, control record contract và file-level edit contract.
- Test liên quan: Là đầu vào cho controls rehearsals, enforcement checks, correlation/compliance audits và gate rehearsal tuần 14.

### docs/roadmap/week14/GATE_REHEARSAL_NOTES.md

- Vai trò file: Ghi chú rehearsal gate tuần 14, tổng hợp ngưỡng pass/fail cho Portfolio Controls (`exposure/concentration enforcement = 100%`, `new breaches = 0`, `drift <=1%`) và trạng thái checklist.
- Class/Type trong file: Không có class/type (tài liệu gate review tuần 14).
- Test liên quan: Xác nhận build/static/smoke, controls rehearsal matrix, W09-W13 regression, correlation audit và artifact consistency.

### docs/roadmap/week14/WEEK14_FINAL_REPORT_AND_WEEK15_START_PACK.md

- Vai trò file: Báo cáo tổng kết tuần 14 và gói khởi động tuần 15 (Capital Allocation), chứa nhánh `GO` và recovery queue khi `NO-GO`.
- Class/Type trong file: Không có class/type (tài liệu weekly closeout + handoff).
- Test liên quan: Tổng hợp evidence từ baseline report, implementation plan, issue register và gate rehearsal để ra quyết định final tuần 14.

### scripts/compliance_audit.sh

- Vai trò file: Script auto-gate kiểm tra coverage của `correlation_id` và `schema_version` trên log evidence theo cơ chế fail-fast.
- Class/Type trong file: Script shell (không có class/type), hỗ trợ cờ `--check-correlation`, `--check-versioning`, `--log-file`.
- Test liên quan: Chạy trong command profile tuần 3 và map trực tiếp vào gate evidence `EV-W3-106`.

### scripts/audit_correlation.py

- Vai trò file: Script static audit quét logging call ở core paths Python/Rust để phát hiện thiếu `correlation_id` context.
- Class/Type trong file:
  - `Finding` (dataclass): lưu thông tin lỗ hổng theo `path:line:reason`.
- Test liên quan: Chạy trong command profile tuần 3, yêu cầu `0 findings`, map trực tiếp vào evidence `EV-W3-107`.

### scripts/verify_parity_w6.py

- Vai trò file: Week 6 parity harness so sánh stop-loss behavior Python reference với Rust `risk-manager` trên cùng price stream và cùng `correlation_id`.
- Class/Type trong file:
  - `StopLossConfig` (dataclass): cấu hình stop-loss wire token (`STATIC/TRAILING/ABSOLUTE/MAX_LOSS`).
  - `PricePoint` (dataclass): một điểm giá/PnL trong stream kiểm thử.
  - `Scenario` (dataclass): scenario parity đầy đủ cho Python/Rust comparison.
- Test liên quan: `python scripts/verify_parity_w6.py --fail-on-drift`, map vào Week 6 evidence `EV-W6-110`, `EV-W6-215`, `EV-W6-307`.

### scripts/audit_w6_correlation.py

- Vai trò file: Script audit runtime quét log file (`trading.log`) để xác minh tính toàn vẹn của chuỗi correlation `signal -> stop_trigger -> execution`.
- Class/Type trong file: Không có class (regex-based audit tool).
- Test liên quan: `python scripts/audit_w6_correlation.py logs/trading.log`.
