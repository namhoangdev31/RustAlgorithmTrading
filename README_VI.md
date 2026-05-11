# RustAlgorithmTrading — Nền Tảng Giao Dịch Hybrid Python-Rust (Production-First)

RustAlgorithmTrading là nền tảng giao dịch thuật toán tập trung vận hành production, tách rõ:

- **Python (offline)**: nghiên cứu, orchestration backtest, batch strategy signal generation, công cụ quan sát
- **Rust (runtime)**: market data, signal bridge, risk checks, execution, production backtest core

Kho tài liệu đã chuyển sang mô hình **vận hành tĩnh** (không còn bộ tài liệu tuần trong cây active).

## Trạng thái rollout hiện tại (Phase 3.5)

- Rust execution kernel, Go control-plane, và Python research layer đã vào trạng thái hoàn chỉnh theo phạm vi migration.
- Verdict hiện tại là **PRODUCTION READY** cho phạm vi migration đã hoàn tất.
- Lifecycle migration đã đóng; công việc tiếp theo là LTS maintenance và tối ưu chiến lược.

## Khởi động nhanh

### 1) Cài dependencies

```bash
uv sync
```

```bash
cd rust && cargo check --workspace
```

### 2) Cấu hình môi trường

1. Tạo file `.env` từ template nội bộ an toàn.
2. Rà soát `config/` (risk limits, runtime params).
3. Kiểm tra dependencies:

```bash
bash scripts/check_dependencies.sh
```

### 3) Chạy hệ thống

```bash
bash scripts/start_trading_system.sh
```

Các đường chạy khác:

- `scripts/autonomous_trading_system.sh`
- `scripts/start_trading.sh`
- `scripts/start_services.sh`

### 4) Theo dõi sức khỏe

```bash
bash scripts/health_check.sh
```

```bash
bash scripts/start_observability.sh
```

## Snapshot kiến trúc runtime

Luồng chính:

1. `rust/market-data`: ingest/normalize market events
2. `rust/signal-bridge`: sinh tín hiệu kỹ thuật/ML
3. `rust/risk-manager`: chặn rủi ro và policy safety
4. `rust/execution-engine`: định tuyến và quản lý lifecycle lệnh
5. `src/` (Python): research + orchestration + observability

Chuẩn công nghệ active:

- **Provider**: Alpaca (active)
- **Observability/Persistence**: DuckDB-first cho analytics/telemetry

## Trục kiểm soát rủi ro

- Pre-trade limits và circuit breaker
- Exposure/position controls
- Kill-switch + rollback readiness
- Event correlation theo `correlation_id`

## Hub tài liệu

Đọc theo thứ tự:

1. `docs/DOCS_CANONICAL_MAP.md`
2. `docs/DOCUMENTATION_INDEX.md`
3. `docs/index.md`
4. `PLAYBOOK.md`

Tài liệu roadmap tuần đã được gom về một completion report tĩnh:

- `docs/roadmap/COMPLETION_REPORT.md`

## Lệnh gate cho Phase 3

```bash
python -m pytest tests/observability/test_go_parity.py -q
python -m pytest tests/observability -q
python -m pytest tests/integration/test_observability_integration.py -q
```

## Hub scripts

- `scripts/README.md`

## Cấu trúc repo

```text
[REPO_ROOT]/
├── src/                  # Python source
├── rust/                 # Rust workspace
├── tests/                # Test suites
├── scripts/              # Runtime / maintenance scripts
├── config/               # Config runtime
├── docs/                 # Tài liệu active
└── data/                 # Dữ liệu runtime/research
```

## Ghi chú quan trọng

- Không thay đổi public envelope:
  - `schema_version`
  - `correlation_id`
  - `event_type`
  - `timestamp`
  - `payload`
- Cleanup này ưu tiên codebase gọn, dễ vận hành, dễ bảo trì production.
