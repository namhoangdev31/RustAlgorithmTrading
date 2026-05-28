# RustAlgorithmTrading — Production-First Hybrid Trading Platform

RustAlgorithmTrading is a production-focused algorithmic trading platform that separates:

- **Python offline workloads** (research, feature engineering, backtesting, diagnostics)
- **Rust online workloads** (market data, signal bridge, risk checks, execution path)

The repository now follows a **static operations documentation model** (no weekly gate artifacts in active docs).

## Current Rollout Status (Phase 3.5)

- Rust execution kernel, Go control-plane, and Python research layer are in place.
- Current verdict is **PRODUCTION READY** for the completed migration scope.
- Active migration lifecycle is closed; ongoing work is LTS maintenance and strategy optimization.

## Quick Start

### 1) Install dependencies

```bash
uv sync
```

```bash
cd rust && cargo check --workspace
```

### 2) Configure runtime

1. Create `.env` from your secure template.
2. Review `ops/config/` risk limits and runtime settings.
3. Validate local environment:

```bash
bash ops/scripts/check_dependencies.sh
```

### 3) Start services

```bash
bash ops/scripts/start_trading_system.sh
```

Alternative runtime paths are documented in:

- `ops/scripts/autonomous_trading_system.sh`
- `ops/scripts/start_trading.sh`
- `ops/scripts/start_services.sh`

### 4) Observe health

```bash
bash ops/scripts/health_check.sh
```

```bash
bash ops/scripts/start_observability.sh
```

## Runtime Architecture Snapshot

Core flow:

1. `rust/market-data` ingests and normalizes market events.
2. `rust/signal-bridge` computes technical/ML signals.
3. `rust/risk-manager` enforces risk and safety controls.
4. `rust/execution-engine` routes and manages execution lifecycle.
5. Python modules in `python/src/` provide research, orchestration, and observability layers.

Provider posture:

- **Broker/API provider**: Alpaca (active)
- **Observability/persistence posture**: DuckDB-first for analytics/telemetry workloads

## Risk Controls (Operational Highlights)

- Pre-trade limits and circuit breakers
- Position and exposure enforcement
- Kill-switch and rollback readiness workflows
- Correlation-first event tracking (`correlation_id`)

## Documentation Hub

Read in this order:

1. `docs/DOCS_CANONICAL_MAP.md`
2. `docs/DOCUMENTATION_INDEX.md`
3. `docs/index.md`
4. `PLAYBOOK.md`

Roadmap lifecycle has been consolidated to one static completion report:

- `docs/roadmap/COMPLETION_REPORT.md`

## Phase 3 Gate Commands

```bash
cd python && python -m pytest tests/observability/test_go_parity.py -q
cd python && python -m pytest tests/observability -q
cd python && python -m pytest tests/integration/test_observability_integration.py -q
```

## Scripts Hub

Runtime and maintenance scripts are indexed here:

- `ops/scripts/README.md`

## Repository Layout

```text
[REPO_ROOT]/
├── python/              # Python source, packaging, and tests
├── rust/                # Rust workspace and Rust tests
├── go/                  # Go observability control plane
├── nextjs/              # Next.js dashboard/web app
├── ios/                 # iOS SwiftUI app
├── android/             # Android Kotlin/Compose app
├── ops/                 # Runtime config, scripts, deployment
├── development/         # Local bootstrap and analysis utilities
├── docs/                # Active docs, research, testing reports
└── data/                # Runtime and research data
```

## Notes

- Public envelope contract remains unchanged:
  - `schema_version`
  - `correlation_id`
  - `event_type`
  - `timestamp`
  - `payload`
- This cleanup intentionally removes weekly governance artifacts from active tree to keep operations docs concise and maintainable.
