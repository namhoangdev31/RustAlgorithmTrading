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
2. Rà soát `ops/config/` (risk limits, runtime params).
3. Kiểm tra dependencies:

```bash
bash ops/scripts/check_dependencies.sh
```

### 3) Chạy hệ thống

```bash
bash ops/scripts/start_trading_system.sh
```

Các đường chạy khác:

- `ops/scripts/autonomous_trading_system.sh`
- `ops/scripts/start_trading.sh`
- `ops/scripts/start_services.sh`

### 4) Theo dõi sức khỏe

```bash
bash ops/scripts/health_check.sh
```

```bash
bash ops/scripts/start_observability.sh
```

## Snapshot kiến trúc runtime

Luồng chính:

1. `rust/market-data`: ingest/normalize market events
2. `rust/signal-bridge`: sinh tín hiệu kỹ thuật/ML
3. `rust/risk-manager`: chặn rủi ro và policy safety
4. `rust/execution-engine`: định tuyến và quản lý lifecycle lệnh
5. `python/src/` (Python): research + orchestration + observability

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
cd python && python -m pytest tests/observability/test_go_parity.py -q
cd python && python -m pytest tests/observability -q
cd python && python -m pytest tests/integration/test_observability_integration.py -q
```

## Hub scripts

- `ops/scripts/README.md`

## Cấu trúc repo

```text
[REPO_ROOT]/
├── python/              # Python source, packaging, tests
├── rust/                # Rust workspace and Rust tests
├── go/                  # Go observability control plane
├── nextjs/              # Next.js dashboard/web app
├── ios/                 # iOS SwiftUI app
├── android/             # Android Kotlin/Compose app
├── ops/                 # Runtime config, scripts, deployment
├── development/         # Local bootstrap and analysis utilities
├── docs/                # Tài liệu active, research, testing reports
└── data/                # Dữ liệu runtime/research
```

## Ghi chú quan trọng

- Không thay đổi public envelope:
  - `schema_version`
  - `correlation_id`
  - `event_type`
  - `timestamp`
  - `payload`
- Cleanup này ưu tiên codebase gọn, dễ vận hành, dễ bảo trì production.
