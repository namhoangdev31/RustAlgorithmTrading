# RustAlgorithmTrading

RustAlgorithmTrading is a multi-domain algorithmic trading workspace with clear ownership boundaries:

- `rust/` owns the low-latency execution kernel.
- `python/` owns research, backtesting, strategies, and Python tests.
- `go/` owns the telemetry/control-plane API.
- `nextjs/` owns the user-facing web surface for dashboards and future configuration.
- `ops/` owns only runtime config, Docker image definitions, and a small set of local scripts.

The ops tree is intentionally lean. Docker Compose, Grafana, Prometheus, Alertmanager, staging bundles, and old autonomous/bootstrap scripts have been removed. Monitoring and user-editable runtime configuration should be exposed through the Go/Next.js web layer instead of living as ops-side dashboards.

## Quick Start

### 1) Install dependencies

```bash
cd python && uv sync
cd ../rust && cargo check --workspace
cd ../go && go test ./...
```

### 2) Configure runtime

1. Create `.env` from your secure internal template.
2. Review `ops/config/system.json` and `ops/config/risk_limits.toml`.
3. Validate the local environment:

```bash
bash ops/scripts/check_dependencies.sh
```

### 3) Run local services

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

Rust service image example:

```bash
docker build -f ops/deployment/Dockerfile --build-arg BIN=market-data -t trading/market-data:local .
```

Go control-plane image:

```bash
docker build -f ops/deployment/go.Dockerfile -t trading/go-control-plane:local .
```

## Runtime Flow

1. `rust/market-data` ingests and normalizes market events.
2. `rust/signal-bridge` computes technical/ML signals.
3. `rust/risk-manager` enforces risk and safety controls.
4. `rust/execution-engine` routes and manages execution lifecycle.
5. `go/` exposes telemetry/control-plane APIs for web consumption.
6. `nextjs/` owns the user-facing web UI and future runtime config surface.

## Documentation Hub

Read in this order:

1. `docs/DOCS_CANONICAL_MAP.md`
2. `docs/DOCUMENTATION_INDEX.md`
3. `docs/index.md`
4. `PLAYBOOK.md`

## Scripts Hub

Runtime and data/backtest helpers are indexed in `ops/scripts/README.md`.

## Repository Layout

```text
[REPO_ROOT]/
├── python/              # Python source, packaging, and tests
├── rust/                # Rust workspace and Rust tests
├── go/                  # Go telemetry/control-plane API
├── nextjs/              # Next.js web app and user config surface
├── ios/                 # iOS SwiftUI app
├── android/             # Android Kotlin/Compose app
├── ops/                 # Runtime config, Docker images, minimal scripts
├── development/         # Sparse local-only scratch space
├── docs/                # Active docs, research, testing reports
└── data/                # Runtime and research data
```
