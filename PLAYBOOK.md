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
- Test liên quan: tests/test_alpaca_*.py, tests/integration/test_alpaca_api.rs, tests/integration/test_end_to_end.rs, tests/integration/test_concurrent.rs.

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
- Test liên quan: tests/unit/test_common_types.rs, tests/unit/test_types.rs, tests/unit/test_errors.rs, tests/unit/test_common_health.rs.

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
