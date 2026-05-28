# RustAlgorithmTrading

RustAlgorithmTrading là workspace giao dịch thuật toán được tách rõ theo domain:

- `rust/` sở hữu runtime low-latency.
- `python/` sở hữu research, backtesting, strategies, và Python tests.
- `go/` sở hữu telemetry/control-plane API.
- `nextjs/` sở hữu web UI cho dashboard và cấu hình runtime sau này.
- `ops/` chỉ giữ runtime config, Docker image definitions, và một bộ script local tối thiểu.

Cây ops đã được làm gọn. Docker Compose, Grafana, Prometheus, Alertmanager, staging bundle, và các script autonomous/bootstrap cũ đã được bỏ. Phần theo dõi và cấu hình cho user sẽ đi qua Go/Next.js web layer thay vì nằm trong ops.

## Khởi Động Nhanh

### 1) Cài dependencies

```bash
cd python && uv sync
cd ../rust && cargo check --workspace
cd ../go && go test ./...
```

### 2) Cấu hình runtime

1. Tạo `.env` từ secure template nội bộ.
2. Rà soát `ops/config/system.json` và `ops/config/risk_limits.toml`.
3. Kiểm tra môi trường local:

```bash
bash ops/scripts/check_dependencies.sh
```

### 3) Chạy services local

```bash
bash ops/scripts/start_services.sh
```

```bash
bash ops/scripts/health_check.sh
```

```bash
bash ops/scripts/stop_services.sh
```

## Docker Images

Ví dụ build Rust service:

```bash
docker build -f ops/deployment/Dockerfile --build-arg BIN=market-data -t trading/market-data:local .
```

Build Go control-plane:

```bash
docker build -f ops/deployment/go.Dockerfile -t trading/go-control-plane:local .
```

## Luồng Runtime

1. `rust/market-data`: ingest và normalize market events.
2. `rust/signal-bridge`: sinh tín hiệu kỹ thuật/ML.
3. `rust/risk-manager`: thực thi risk và safety policy.
4. `rust/execution-engine`: định tuyến và quản lý lifecycle lệnh.
5. `go/`: expose telemetry/control-plane API cho web.
6. `nextjs/`: sở hữu web UI và surface cấu hình runtime sau này.

## Hub Tài Liệu

Đọc theo thứ tự:

1. `docs/DOCS_CANONICAL_MAP.md`
2. `docs/DOCUMENTATION_INDEX.md`
3. `docs/index.md`
4. `PLAYBOOK.md`

## Hub Scripts

Script runtime/data/backtest được index trong `ops/scripts/README.md`.

## Cấu Trúc Repo

```text
[REPO_ROOT]/
├── python/              # Python source, packaging, tests
├── rust/                # Rust workspace and Rust tests
├── go/                  # Go telemetry/control-plane API
├── nextjs/              # Next.js web app and user config surface
├── ios/                 # iOS SwiftUI app
├── android/             # Android Kotlin/Compose app
├── ops/                 # Runtime config, Docker images, script tối thiểu
├── development/         # Local-only scratch space tối giản
├── docs/                # Tài liệu active, research, testing reports
└── data/                # Dữ liệu runtime/research
```
