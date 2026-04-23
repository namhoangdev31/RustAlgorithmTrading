# py_rt - Hệ Thống Giao Dịch Thuật Toán Hybrid Python-Rust

Hệ thống giao dịch hiệu năng cao, kết hợp tốc độ phát triển của Python (nghiên cứu, backtest, ML) với khả năng thực thi độ trễ thấp của Rust (market data, risk, execution).

## Tổng Quan

`py_rt` đi theo kiến trúc tách lớp rõ ràng:

- **Python Offline**: nghiên cứu, backtesting, tối ưu tham số, huấn luyện mô hình.
- **Rust Online**: xử lý dữ liệu thị trường real-time, kiểm soát rủi ro, gửi lệnh.
- **Integration Layer**: ONNX, ZeroMQ, PyO3 cho giao tiếp Python-Rust.

Mục tiêu:

- Tăng tốc vòng đời nghiên cứu chiến lược.
- Giữ runtime production an toàn, ổn định, nhanh.
- Có khả năng quan sát hệ thống đầy đủ (metrics/logs/health).

## Tính Năng Chính

### Python (Offline)

- Backtesting event-driven với phí/slippage thực tế.
- Tối ưu tham số (grid search, Bayesian).
- Pipeline ML (feature engineering, training, ONNX export).
- Phân tích thống kê và trực quan hóa.

### Rust (Online)

- Streaming market data thời gian thực.
- Risk checks trước khi gửi lệnh.
- Execution engine có retry, rate-limit, quản lý trạng thái lệnh.
- ONNX inference thời gian thực trong `signal-bridge`.

### Tích hợp

- ZeroMQ pub/sub cho luồng nội bộ.
- ONNX để chuyển mô hình từ Python sang Rust.
- PyO3 cho các đoạn tăng tốc bằng Rust từ Python.

## Kiến Trúc

```text
market-data (Rust) --> signal-bridge (Rust) --> risk-manager (Rust) --> execution-engine (Rust)
        |                     |                         |                       |
     Alpaca WS            ONNX infer              circuit breaker           Alpaca REST
```

Tài liệu kiến trúc chi tiết:

- [docs/architecture/production-architecture.md](docs/architecture/production-architecture.md)
- [docs/architecture/python-rust-separation.md](docs/architecture/python-rust-separation.md)
- [docs/architecture/python-rust-integration.md](docs/architecture/python-rust-integration.md)
- [docs/architecture/SYSTEM_ARCHITECTURE.md](docs/architecture/SYSTEM_ARCHITECTURE.md)

## Công Nghệ Sử Dụng

### Python Stack (Offline)

| Thành phần | Công nghệ | Mục đích |
|---|---|---|
| Data/Analysis | Pandas, NumPy | xử lý dữ liệu, vectorized calc |
| ML | PyTorch, XGBoost, LightGBM | training/inference research |
| Optimization | Optuna, Scipy | tuning tham số |
| Research | Jupyter | khám phá dữ liệu |

### Rust Stack (Online)

| Thành phần | Công nghệ | Mục đích |
|---|---|---|
| Runtime | Tokio | async I/O hiệu năng cao |
| Messaging | ZeroMQ | giao tiếp service nội bộ |
| Serialization | serde | encode/decode dữ liệu |
| Inference | ONNX Runtime (`ort`) | mô hình real-time |
| Logging/Metrics | tracing, prometheus | observability |

## Quick Start

### Prerequisites

- Python 3.11+ (khuyến nghị).
- Rust stable (khuyến nghị >= 1.70).
- Tài khoản Alpaca paper trading.
- ZeroMQ system libraries.

### Cài đặt

```bash
git clone https://github.com/SamoraDC/RustAlgorithmTrading.git
cd RustAlgorithmTrading

# Python
uv sync

# Rust
cd rust
cargo build --release --workspace
cargo test --workspace
cd ..
```

### Cấu hình

1. Tạo `.env` từ template và điền key Alpaca.
2. Tạo/chỉnh `config/system.json`.
3. Review `config/risk_limits.toml` trước khi chạy paper/live.

Xem thêm:

- [docs/guides/quickstart.md](docs/guides/quickstart.md)
- [docs/setup/DEVELOPMENT.md](docs/setup/DEVELOPMENT.md)
- [docs/guides/ALPACA_INTEGRATION.md](docs/guides/ALPACA_INTEGRATION.md)

### Chạy hệ thống (4 terminal)

```bash
# Terminal 1
cd rust/market-data && RUST_LOG=info cargo run --release

# Terminal 2
cd rust/signal-bridge && RUST_LOG=info cargo run --release

# Terminal 3
cd rust/risk-manager && RUST_LOG=info cargo run --release

# Terminal 4
cd rust/execution-engine && RUST_LOG=info cargo run --release
```

## Cấu Trúc Dự Án

```text
RustAlgorithmTrading/
├── src/                      # Python source (API, data, strategies, backtesting, observability)
├── rust/                     # Rust workspace (market-data, signal-bridge, risk-manager, execution-engine, common)
├── tests/                    # unit/integration/e2e/perf tests
├── docs/                     # tài liệu kỹ thuật, triển khai, vận hành
├── medium/                   # bài research/insight
├── config/                   # cấu hình hệ thống và risk
├── data/                     # dữ liệu runtime/backtest
└── scripts/                  # script vận hành, health-check, hỗ trợ devops
```

## Các Thành Phần Cốt Lõi

### Python Offline

- `src/api/alpaca_client.py`
- `src/data/fetcher.py`, `src/data/preprocessor.py`
- `src/strategies/`
- `src/backtesting/engine.py`
- `src/simulations/monte_carlo.py`
- `src/observability/`

### Rust Online

- `rust/market-data/`
- `rust/signal-bridge/`
- `rust/risk-manager/`
- `rust/execution-engine/`
- `rust/common/`

## API Integration

Hệ thống tích hợp Alpaca cho:

- market data streaming (WebSocket),
- order/account API (REST),
- position/order reconciliation.

Tham khảo:

- [docs/api/ALPACA_API.md](docs/api/ALPACA_API.md)
- [docs/guides/ALPACA_INTEGRATION.md](docs/guides/ALPACA_INTEGRATION.md)

## Observability

Tài liệu chính:

- [docs/observability/BACKEND_API.md](docs/observability/BACKEND_API.md)
- [docs/observability/OBSERVABILITY_DUCKDB.md](docs/observability/OBSERVABILITY_DUCKDB.md)
- [docs/operations/OPERATIONS_RUNBOOK.md](docs/operations/OPERATIONS_RUNBOOK.md)

Bạn có:

- REST + WebSocket metrics,
- health/readiness/liveness endpoints,
- logging + metrics cho từng service.

## Testing

```bash
# Python tests
pytest -q

# Rust tests
cd rust && cargo test --workspace
```

Chiến lược test tổng:

- [tests/docs/COMPREHENSIVE_TESTING_STRATEGY.md](tests/docs/COMPREHENSIVE_TESTING_STRATEGY.md)

## Hiệu Năng (Theo Tài Liệu Dự Án)

- Rust runtime mục tiêu độ trễ thấp cho market data/risk/execution.
- ONNX inference được tối ưu trong `signal-bridge`.
- Kênh giao tiếp service theo ZeroMQ.

Chi tiết benchmark/perf:

- [docs/architecture/production-architecture.md](docs/architecture/production-architecture.md)
- [docs/optimization/README.md](docs/optimization/README.md)
- [rust/docs/SIMD_MIGRATION_RESEARCH.md](rust/docs/SIMD_MIGRATION_RESEARCH.md)

## Workflow: Research -> Production

1. Nghiên cứu và xây dựng giả thuyết trên Python.
2. Backtest + walk-forward + stress tests.
3. Huấn luyện model, export ONNX.
4. Tích hợp ONNX vào Rust `signal-bridge`.
5. Chạy paper trading + monitoring.
6. Chuyển production theo checklist triển khai.

## Production Deployment

### Triển khai nhanh

```bash
# 1) Setup env + secrets
cp .env.example .env

# 2) Build workspace
cd rust && cargo build --release --workspace && cd ..

# 3) Native deployment (latency thấp) hoặc Docker
# Native: systemd services
# Docker: docker compose

# 4) Health-check
./scripts/health_check.sh
```

### Lựa chọn phương án

| Phương án | Độ trễ | Độ phức tạp | Phù hợp |
|---|---|---|---|
| Native | thấp nhất | trung bình | production latency-sensitive |
| Docker | cao hơn native | thấp | dev/staging |
| Kubernetes | cao nhất trong 3 loại | cao | scale/HA enterprise |

### Tài liệu triển khai và vận hành

- [docs/deployment/PRODUCTION_DEPLOYMENT.md](docs/deployment/PRODUCTION_DEPLOYMENT.md)
- [docs/guides/deployment.md](docs/guides/deployment.md)
- [docs/operations/OPERATIONS_RUNBOOK.md](docs/operations/OPERATIONS_RUNBOOK.md)
- [docs/operations/DISASTER_RECOVERY.md](docs/operations/DISASTER_RECOVERY.md)
- [docs/guides/troubleshooting.md](docs/guides/troubleshooting.md)

## Mục docs (Nên Đọc Theo Thứ Tự)

Tài liệu map canonical:

- [docs/DOCS_CANONICAL_MAP.md](docs/DOCS_CANONICAL_MAP.md)

Nhóm tài liệu quan trọng:

- Onboarding: `README.md`, `docs/guides/quickstart.md`, `docs/workspace-structure.md`
- Architecture: `docs/architecture/*`
- API: `docs/api/*`
- Ops/Deploy: `docs/deployment/*`, `docs/operations/*`, `docs/guides/{deployment,operations,troubleshooting}.md`
- Testing: `tests/docs/COMPREHENSIVE_TESTING_STRATEGY.md`
- Research context: `medium/*.md`

## Lộ Trình Thực Thi 24 Tuần (04/2026-10/2026)

Kế hoạch theo tuần đã được chốt và đặt tại:

- [docs/roadmap/EXECUTION_PLAN_24_WEEKS_2026-04-20_to_2026-10-04.md](docs/roadmap/EXECUTION_PLAN_24_WEEKS_2026-04-20_to_2026-10-04.md)
- [docs/roadmap/WEEK1_OPERATIONS_PLAN_2026-04-20_to_2026-04-26.md](docs/roadmap/WEEK1_OPERATIONS_PLAN_2026-04-20_to_2026-04-26.md)
- [docs/roadmap/week1/](docs/roadmap/week1/) (Execution Pack tuần 1)

Execution Pack tuần 1 gồm các artifact đã triển khai:

- `KPI_CHARTER_V1.md`
- `BASELINE_VALIDATION_REPORT_V1.md`
- `OBSERVABILITY_BASELINE_SLO_DRAFT.md`
- `ISSUE_REGISTER_V1.md`
- `INTERFACE_SPEC_DRAFT_V0.md`
- `GATE_REHEARSAL_NOTES.md`
- `WEEK1_FINAL_REPORT_AND_WEEK2_START_PACK.md`

Tóm tắt 6 phase:

1. Tuần 1-4: baseline KPI + contract audit + integration stabilization.
2. Tuần 5-8: risk limits, stop-loss coherence, circuit breaker, retry/slippage.
3. Tuần 9-12: observability schema, API health/SLO, incident runbook, ops gate.
4. Tuần 13-16: strategy governance, portfolio controls, capital allocation, reproducibility.
5. Tuần 17-20: staging hardening, canary design, safety guardrails, canary launch.
6. Tuần 21-24: canary tuning, scale readiness, reliability hardening, quarter closeout.

Chuẩn thực thi xuyên suốt:

- Doc -> Code -> Test.
- Weekly exit criteria.
- Phase gate 4 tuần với quyết định Go/No-Go.

Tuần 1 có plan chi tiết vận hành theo ngày, gồm:

- Task board `W1-T01..W1-T18`
- Checklist hằng ngày và checklist cuối tuần
- Issue register `W1-ISS-001..W1-ISS-005` có owner/due
- Mẫu báo cáo `Week-1 Final Report` để chốt Go/No-Go tuần 2

## Bản Đồ Doc -> Code Path Thực Tế

Section này đóng vai trò "navigator" khi bạn đọc doc và cần đi thẳng vào code đúng chỗ.

### A) Onboarding / Setup / Runtime Bootstrap

| Doc | Entrypoint code | Core code | Config/Script liên quan |
|---|---|---|---|
| `docs/guides/quickstart.md` | `rust/market-data/src/main.rs`, `rust/signal-bridge/src/main.rs`, `rust/risk-manager/src/main.rs`, `rust/execution-engine/src/main.rs` | `rust/*/src/lib.rs` | `config/system.json`, `config/risk_limits.toml`, `scripts/start_trading_system.sh`, `scripts/health_check.sh` |
| `docs/setup/DEVELOPMENT.md` | `rust/Cargo.toml`, `pyproject.toml` | `src/*`, `rust/*` | `config/system.json`, `.env`, `tests/run_all_tests.sh` |

### B) Architecture -> Module ownership

| Doc | Python ownership | Rust ownership | Notes triển khai |
|---|---|---|---|
| `docs/architecture/production-architecture.md` | `src/observability/*`, `src/api/*` | `rust/market-data/src/*`, `rust/signal-bridge/src/*`, `rust/risk-manager/src/*`, `rust/execution-engine/src/*`, `rust/database/src/*` | dùng để map service boundary và startup order |
| `docs/architecture/python-rust-separation.md` | `src/backtesting/*`, `src/strategies/*`, `src/simulations/*` | `rust/*/src/*` | xác định phần nào chạy offline vs online |
| `docs/architecture/python-rust-integration.md` | `src/bridge/zmq_bridge.py`, `src/bridge/rust_bridge.py` | `rust/common/src/messaging.rs`, `rust/signal-bridge/src/bridge.rs`, `rust/signal-bridge/src/features.rs`, `rust/signal-bridge/src/indicators.rs` | map lớp ONNX/ZMQ/PyO3 |
| `docs/architecture/database-persistence.md` | `src/observability/storage/*` | `rust/database/src/connection.rs`, `migrations.rs`, `query.rs`, `models.rs`, `schema.rs` | map persistence + migration |

### C) API / Messaging / Data flow

| Doc | Code path chính | Điểm cần soi khi debug |
|---|---|---|
| `docs/api/ALPACA_API.md` | `src/api/alpaca_client.py`, `src/api/alpaca_paper_trading.py`, `rust/market-data/src/websocket.rs`, `rust/execution-engine/src/router.rs`, `rust/execution-engine/src/retry.rs` | auth headers, retry policy, rate-limit |
| `docs/api/ZMQ_PROTOCOL.md` | `rust/common/src/messaging.rs`, `rust/market-data/src/publisher.rs`, `src/bridge/zmq_bridge.py`, `rust/signal-bridge/src/bridge.rs` | topic naming, payload envelope, pub/sub filter |

### D) Strategy / Backtest / Signal pipeline

| Doc | Code path chính | Điểm sửa thường gặp |
|---|---|---|
| `docs/guides/strategy-development.md` | `src/strategies/base.py`, `src/strategies/*.py`, `src/strategies/strategy_router.py` | signal rules, position sizing, regime logic |
| `docs/guides/backtesting.md` | `src/backtesting/engine.py`, `src/backtesting/metrics.py`, `src/backtesting/walk_forward.py`, `src/simulations/monte_carlo.py` | transaction costs, look-ahead guard, metrics calc |
| `rust/docs/SIMD_MIGRATION_*` | `rust/signal-bridge/src/indicators.rs`, `rust/signal-bridge/src/features.rs`, `rust/signal-bridge/Cargo.toml` | SIMD hotspots và regression performance |

### E) Risk / Execution / Ops / Observability

| Doc | Code path chính | Điểm kiểm tra nhanh |
|---|---|---|
| `docs/guides/RISK_MANAGEMENT_GUIDE.md` | `rust/risk-manager/src/limits.rs`, `stops.rs`, `circuit_breaker.rs`, `pnl.rs`, `config/risk_limits.toml` | limit breaches, stop trigger, circuit state |
| `docs/observability/BACKEND_API.md` | `src/observability/api/main.py`, `src/observability/api/routes/metrics.py`, `trades.py`, `system.py`, `src/observability/api/websocket_manager.py` | REST vs WS path, collector wiring |
| `docs/observability/OBSERVABILITY_DUCKDB.md` | `src/observability/database/duckdb_manager.py`, `src/observability/storage/duckdb_client.py`, `src/observability/storage/schemas.py` | schema drift, write batching, query interval |
| `docs/deployment/PRODUCTION_DEPLOYMENT.md` | `docker/docker-compose.yml`, `config/system.production.json`, `scripts/health_check.sh`, `rust/*/src/main.rs` | env/config mismatch, health endpoint |
| `docs/operations/OPERATIONS_RUNBOOK.md` | `scripts/start_trading_system.sh`, `scripts/stop_trading_system.sh`, `scripts/health_check.sh`, `logs/`, `monitoring/` | incident handling, startup/shutdown order |
| `docs/operations/DISASTER_RECOVERY.md` | `rust/database/src/migrations.rs`, `rust/database/src/connection.rs`, `config/system.production.json` | backup/restore và recovery prerequisites |

### F) Mapping nhanh theo intent sửa code

- Sửa strategy logic: `src/strategies/*` + `src/backtesting/*` + `tests/unit/python/test_strategies.py`
- Sửa market data: `rust/market-data/src/websocket.rs`, `orderbook.rs`, `publisher.rs`, `aggregation.rs`
- Sửa risk controls: `rust/risk-manager/src/limits.rs`, `stops.rs`, `circuit_breaker.rs`, `config/risk_limits.toml`
- Sửa execution: `rust/execution-engine/src/router.rs`, `retry.rs`, `slippage.rs`, `stop_loss_executor.rs`
- Sửa observability API: `src/observability/api/*`, `src/observability/metrics/*`, `src/observability/database/*`

## Doc -> Code -> Test (Playbook)

Bảng này là checklist thực thi: đọc doc nào thì vào code nào và chạy test nào trước khi merge.

| Doc | Code path ưu tiên | Test ưu tiên (đang có trong repo) |
|---|---|---|
| `docs/guides/strategy-development.md` | `src/strategies/base.py`, `src/strategies/*.py`, `src/backtesting/engine.py` | `tests/unit/python/test_strategies.py`, `tests/unit/test_strategy_signals.py`, `tests/unit/test_momentum_strategy.py`, `tests/integration/test_momentum_signal_generation.py` |
| `docs/guides/backtesting.md` | `src/backtesting/engine.py`, `metrics.py`, `walk_forward.py`, `src/simulations/monte_carlo.py` | `tests/unit/python/test_backtest_engine.py`, `tests/unit/python/test_backtesting.py`, `tests/test_backtest_integration.py`, `tests/integration/test_backtest_signal_flow.py` |
| `docs/api/ALPACA_API.md` | `src/api/alpaca_client.py`, `src/api/alpaca_paper_trading.py`, `rust/execution-engine/src/router.rs`, `retry.rs` | `tests/test_alpaca_quick.py`, `tests/test_alpaca_api_limits.py`, `tests/unit/test_alpaca_auth.rs`, `tests/unit/test_alpaca_rate_limiter.rs`, `tests/integration/test_alpaca_api.rs` |
| `docs/api/ZMQ_PROTOCOL.md` | `rust/common/src/messaging.rs`, `rust/market-data/src/publisher.rs`, `src/bridge/zmq_bridge.py` | `tests/integration/test_concurrent.rs`, `tests/integration/test_end_to_end.rs`, `tests/integration/test_risk_execution_observability.rs` |
| `docs/guides/RISK_MANAGEMENT_GUIDE.md` | `rust/risk-manager/src/limits.rs`, `stops.rs`, `circuit_breaker.rs`, `pnl.rs` | `tests/unit/test_risk_manager.rs`, `tests/unit/test_risk_limits.rs`, `tests/integration/test_stop_loss_integration.rs`, `tests/unit/test_week3_stop_loss_immediate_exit.py` |
| `docs/observability/BACKEND_API.md` | `src/observability/api/main.py`, `routes/*.py`, `websocket_manager.py`, `metrics/*.py` | `tests/observability/test_api.py`, `tests/observability/test_integration.py`, `tests/observability/test_log_streams.py`, `tests/integration/test_observability_integration.py` |
| `docs/observability/OBSERVABILITY_DUCKDB.md` | `src/observability/database/duckdb_manager.py`, `src/observability/storage/duckdb_client.py`, `schemas.py` | `tests/observability/test_duckdb_client.py`, `tests/observability/test_databases.py`, `tests/integration/test_duckdb_storage.rs` |
| `docs/deployment/PRODUCTION_DEPLOYMENT.md` | `docker/docker-compose.yml`, `config/system.production.json`, `scripts/health_check.sh` | `tests/e2e/test_full_system.py`, `tests/integration/test_end_to_end.rs`, `tests/integration/test_performance_load.rs` |
| `rust/docs/SIMD_MIGRATION_*` | `rust/signal-bridge/src/indicators.rs`, `features.rs` | `tests/integration/test_performance_load.rs`, `tests/performance/test_performance.py` |

Quy trình chạy test gợi ý theo mức thay đổi:

- Python-only change: `pytest tests/unit/python -q`
- Rust-only change: `cd rust && cargo test --workspace`
- Cross-service change: `pytest tests/integration -q` + `cd tests && cargo test --tests`
- Observability change: `pytest tests/observability -q`


## Reading Roadmap 90 Phút

Mục tiêu: sau 90 phút, bạn hiểu được kiến trúc, luồng chạy, cách deploy/test, và biết đọc đúng tài liệu canonical.

### 0-10 phút: Định vị dự án

Đọc:

- [README.md](README.md)
- [docs/DOCS_CANONICAL_MAP.md](docs/DOCS_CANONICAL_MAP.md)
- [docs/workspace-structure.md](docs/workspace-structure.md)

Kết quả:

- Hiểu phạm vi dự án và boundary Python vs Rust.
- Biết tài liệu canonical vs legacy.

### 10-25 phút: Setup local và chạy baseline

Đọc:

- [docs/guides/quickstart.md](docs/guides/quickstart.md)
- [docs/setup/DEVELOPMENT.md](docs/setup/DEVELOPMENT.md)
- [docs/guides/ALPACA_INTEGRATION.md](docs/guides/ALPACA_INTEGRATION.md)

Kết quả:

- Nắm yêu cầu môi trường, config chính.
- Biết cách start 4 service cốt lõi.

### 25-45 phút: Hiểu kiến trúc runtime

Đọc:

- [docs/architecture/production-architecture.md](docs/architecture/production-architecture.md)
- [docs/architecture/python-rust-separation.md](docs/architecture/python-rust-separation.md)
- [docs/architecture/python-rust-integration.md](docs/architecture/python-rust-integration.md)

Kết quả:

- Vẽ được luồng dữ liệu end-to-end.
- Hiểu điểm tích hợp ONNX/ZMQ/PyO3.

### 45-60 phút: Production operations mindset

Đọc:

- [docs/deployment/PRODUCTION_DEPLOYMENT.md](docs/deployment/PRODUCTION_DEPLOYMENT.md)
- [docs/operations/OPERATIONS_RUNBOOK.md](docs/operations/OPERATIONS_RUNBOOK.md)
- [docs/operations/DISASTER_RECOVERY.md](docs/operations/DISASTER_RECOVERY.md)

Kết quả:

- Biết deploy mode và startup order.
- Biết checklist vận hành, backup/restore, RTO/RPO.

### 60-75 phút: API + observability

Đọc:

- [docs/api/ALPACA_API.md](docs/api/ALPACA_API.md)
- [docs/api/ZMQ_PROTOCOL.md](docs/api/ZMQ_PROTOCOL.md)
- [docs/observability/BACKEND_API.md](docs/observability/BACKEND_API.md)
- [docs/observability/OBSERVABILITY_DUCKDB.md](docs/observability/OBSERVABILITY_DUCKDB.md)

Kết quả:

- Hiểu contract message nội bộ.
- Hiểu endpoint theo dõi và dữ liệu observability.

### 75-90 phút: Testing + performance + research context

Đọc:

- [tests/docs/COMPREHENSIVE_TESTING_STRATEGY.md](tests/docs/COMPREHENSIVE_TESTING_STRATEGY.md)
- [rust/docs/SIMD_MIGRATION_RESEARCH.md](rust/docs/SIMD_MIGRATION_RESEARCH.md)
- [rust/docs/SIMD_MIGRATION_QUICK_GUIDE.md](rust/docs/SIMD_MIGRATION_QUICK_GUIDE.md)
- Chọn 2-3 bài trong `medium/` theo chủ đề bạn quan tâm.

Kết quả:

- Biết tiêu chuẩn kiểm thử khi thay đổi code.
- Nắm hướng tối ưu hiệu năng trong signal pipeline.
- Có bối cảnh nghiên cứu để đề xuất chiến lược mới.

## Hướng Phát Triển Tiếp Theo

Ngắn hạn:

- củng cố integration và observability production,
- mở rộng test coverage cho critical paths,
- hardening risk controls và reconciliation.

Dài hạn:

- mở rộng multi-asset/multi-exchange,
- nâng cấp execution algorithms,
- tăng năng lực phân tán và HA.

## License

Dự án dùng Apache License 2.0. Xem [LICENSE](LICENSE).

## Author

**Davi Castro Samora**

- GitHub: [@SamoraDC](https://github.com/SamoraDC)

## Tài Liệu Liên Quan

- [README.md](README.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [docs/README.md](docs/README.md)
- [docs/index.md](docs/index.md)

## Support

- Issues: [GitHub Issues](https://github.com/SamoraDC/RustAlgorithmTrading/issues)
- Discussions: [GitHub Discussions](https://github.com/SamoraDC/RustAlgorithmTrading/discussions)
- Docs: [docs/](docs/)
