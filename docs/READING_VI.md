# README Tiếng Việt - RustAlgorithmTrading (RustAlgorithmTrading)

Tài liệu này là bản tóm tắt tiếng Việt giúp bạn nắm toàn bộ dự án nhanh, kèm **reading roadmap 90 phút** để onboard có hệ thống.

## 1) Dự án này là gì?

`RustAlgorithmTrading` là hệ thống giao dịch thuật toán hybrid:

- **Python (offline)**: nghiên cứu chiến lược, backtesting, tối ưu tham số, huấn luyện ML.
- **Rust (online)**: nhận dữ liệu thị trường real-time, kiểm soát rủi ro, gửi lệnh tốc độ thấp độ trễ.
- **Cầu nối Python-Rust**: ZeroMQ, shared contracts, và cấu hình chia sẻ.

Mục tiêu kiến trúc:

- Tăng tốc vòng đời nghiên cứu bằng Python.
- Đảm bảo runtime production an toàn và nhanh bằng Rust.
- Duy trì khả năng mở rộng và quan sát hệ thống (observability).

---

## 2) Kiến trúc tổng quan

Luồng runtime chính:

1. `market-data` (Rust) nhận dữ liệu Alpaca.
2. `signal-bridge` (Rust + ML) tạo tín hiệu.
3. `risk-manager` (Rust) kiểm tra hạn mức, circuit breaker.
4. `execution-engine` (Rust) gửi lệnh đến Alpaca.

Luồng nghiên cứu:

1. Python backtest/ML với dữ liệu lịch sử.
2. Export model sang ONNX.
3. Runtime Rust load ONNX để suy luận real-time.

Tài liệu kiến trúc quan trọng:

- `docs/architecture/SYSTEM_ARCHITECTURE.md`
- `docs/architecture/python-rust-separation.md`
- `docs/architecture/integration-layer.md`
- `docs/architecture/component-interfaces.md`

---

## 3) Cấu trúc repo cần biết

- `python/src/`: Python core (API, data, strategies, backtesting, simulations, observability).
- `rust/`: Rust workspace (common, market-data, signal-bridge, risk-manager, execution-engine, database).
- `tests/`: test Python/Rust/integration/e2e/perf.
- `docs/`: tài liệu kỹ thuật, vận hành, triển khai.
- `docs/research/`: bài nghiên cứu/insight chiến lược (tham khảo tư duy, không phải runbook vận hành).

---

## 4) Thành phần cốt lõi

### Python side

- `python/src/api/alpaca_client.py`: giao tiếp Alpaca.
- `python/src/data/fetcher.py`, `python/src/data/preprocessor.py`: ingest + tiền xử lý dữ liệu.
- `python/src/strategies/`: chiến lược (momentum, mean reversion, MA crossover...).
- `python/src/backtesting/engine.py`: backtest engine.
- `python/src/simulations/monte_carlo.py`: mô phỏng rủi ro.
- `python/src/observability/`: backend API + lưu trữ metric + dashboard.

### Rust side

- `rust/market-data`: ingest market data.
- `rust/signal-bridge`: tính chỉ báo + inference.
- `rust/risk-manager`: pre-trade risk checks + circuit breaker.
- `rust/execution-engine`: gửi lệnh, retry, rate-limit.
- `rust/common`: type/messaging/config dùng chung.

---

## 5) Cách chạy nhanh (dev)

## Điều kiện

- Python 3.11+ (khuyến nghị)
- Rust stable (khuyến nghị >= 1.70)
- Alpaca paper trading account
- ZeroMQ system libs

## Setup cơ bản

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

## Cấu hình

1. Tạo `.env` từ template.
2. Cấu hình Alpaca key.
3. Tạo/chỉnh `ops/config/system.json`.

Tham khảo:

- `docs/setup/DEVELOPMENT.md`
- `docs/guides/ALPACA_INTEGRATION.md`

## Chạy 4 service chính

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

---

## 6) Observability, vận hành, production

Khối tài liệu production chính:

- Deploy: `docs/deployment/PRODUCTION_DEPLOYMENT.md`
- Operations/DR: `docs/operations/OPERATIONS_GUIDE.md`
- Observability backend API: `docs/observability/BACKEND_API.md`
- DuckDB observability storage: `docs/observability/STORAGE_OPERATIONS.md`

Lưu ý: một số tài liệu cũ vẫn nói PostgreSQL là mặc định observability; trạng thái mới cho observability metrics hiện thiên về DuckDB (xem tài liệu observability).

---

## 7) Kiểm thử và chất lượng

Tài liệu chiến lược test tổng:

- `docs/testing/strategy/COMPREHENSIVE_TESTING_STRATEGY.md`

Bạn sẽ thấy đầy đủ:

- Unit test (Python + Rust)
- Integration test (ZMQ/WebSocket/API)
- E2E flow
- Performance benchmark
- Stress/failure testing

Chạy nhanh:

```bash
# Python
pytest -q

# Rust
cd rust && cargo test --workspace
```

---

## 8) Reading Roadmap 90 Phút (đề xuất)

Mục tiêu roadmap: sau 90 phút bạn hiểu được kiến trúc, luồng vận hành, nơi sửa code, nơi kiểm thử, và cách đọc đúng tài liệu.

### 0-10 phút: Định vị dự án

Đọc:

- `README.md`
- `docs/DOCS_CANONICAL_MAP.md`
- `PLAYBOOK.md`

Kết quả cần đạt:

- Biết Python làm gì, Rust làm gì.
- Biết tài liệu nào canonical, tài liệu nào legacy/history.

### 10-25 phút: Chạy được local ở mức cơ bản

Đọc:

- `docs/setup/DEVELOPMENT.md`
- `docs/guides/ALPACA_INTEGRATION.md`

Kết quả cần đạt:

- Nắm prerequisites.
- Biết file config quan trọng.
- Biết cách start 4 service.

### 25-45 phút: Hiểu kiến trúc runtime

Đọc:

- `docs/architecture/SYSTEM_ARCHITECTURE.md` (ưu tiên)
- `docs/architecture/python-rust-separation.md`
- `docs/architecture/integration-layer.md`

Kết quả cần đạt:

- Hiểu luồng `market-data -> signal-bridge -> risk-manager -> execution-engine`.
- Hiểu biên giới Python offline vs Rust online.
- Hiểu trạng thái integration (ONNX ready, phần nào chưa hoàn thiện).

### 45-60 phút: Vận hành và production mindset

Đọc:

- `docs/deployment/PRODUCTION_DEPLOYMENT.md`
- `docs/operations/OPERATIONS_GUIDE.md`

Kết quả cần đạt:

- Biết 3 mode deploy (native/docker/k8s).
- Biết checklist pre/intra/post-market.
- Biết RTO/RPO và quy trình backup/restore.

### 60-75 phút: API + observability + data flow

Đọc:

- `docs/api/ALPACA_API.md`
- `docs/api/ZMQ_PROTOCOL.md`
- `docs/observability/BACKEND_API.md`
- `docs/observability/STORAGE_OPERATIONS.md`

Kết quả cần đạt:

- Hiểu định dạng message ZMQ.
- Hiểu endpoint health/metrics/trades.
- Hiểu lớp lưu trữ observability hiện tại.

### 75-90 phút: Testing + hiệu năng + research context

Đọc:

- `docs/testing/strategy/COMPREHENSIVE_TESTING_STRATEGY.md`
- `rust/docs/SIMD_MIGRATION_RESEARCH.md`
- `rust/docs/SIMD_MIGRATION_QUICK_GUIDE.md`
- Chọn 2-3 bài trong `docs/research/` theo chủ đề bạn quan tâm.

Kết quả cần đạt:

- Biết cách đánh giá độ tin cậy khi sửa code.
- Biết trạng thái tối ưu SIMD ở `signal-bridge`.
- Có ngữ cảnh nghiên cứu để mở rộng chiến lược.

---

## 9) Gợi ý lộ trình theo vai trò (sau 90 phút)

### Nếu bạn là Backend/Rust Engineer

Ưu tiên:

- `rust/common`, `rust/market-data`, `rust/risk-manager`, `rust/execution-engine`
- docs kiến trúc + runbook + ZMQ protocol

Mục tiêu tuần đầu:

- Chạy integration test
- Đo latency cơ bản
- Kiểm tra luồng risk rejection/end-to-end order

### Nếu bạn là Quant/ML Engineer

Ưu tiên:

- `python/src/backtesting`, `python/src/strategies`, `python/src/simulations`, `python/src/data`
- docs backtesting + strategy-development + ONNX integration

Mục tiêu tuần đầu:

- Thiết kế 1 chiến lược baseline
- Chạy walk-forward + Monte Carlo
- Export ONNX và test inference path

### Nếu bạn là SRE/DevOps

Ưu tiên:

- docs ops/deployment/operations/DR/observability
- health metrics, alerting, backup scripts

Mục tiêu tuần đầu:

- Dựng staging
- Chạy playbook incident giả lập
- Xác thực backup/restore + reconciliation

---

## 10) Các điểm cần nhớ khi đọc docs

1. `docs/DOCS_CANONICAL_MAP.md` là điểm bắt đầu để tránh nhiễu.
2. Tài liệu lịch sử đã được loại khỏi active tree; không dùng lại làm operational truth.
3. Nếu có xung đột giữa tài liệu cũ và mã nguồn hiện tại, ưu tiên:
   - cấu hình đang chạy
   - code hiện tại
   - tài liệu canonical mới hơn.

---

## 11) Checklist tự đánh giá sau khi đọc xong

- Tôi có thể mô tả luồng E2E market-data -> execution bằng 1 phút.
- Tôi biết đâu là điểm vào để thêm/chỉnh một strategy.
- Tôi biết file/config nào kiểm soát risk limit và circuit breaker.
- Tôi biết cách chạy test nhanh Python và Rust.
- Tôi biết runbook sự cố nằm ở đâu.
- Tôi biết tài liệu nào là canonical vs legacy.

Nếu bạn check được hầu hết mục trên, bạn đã có nền tảng đủ tốt để bắt đầu đóng góp code.
