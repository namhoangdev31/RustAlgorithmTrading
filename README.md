# RustAlgorithmTrading — Production-First Hybrid Trading Platform

RustAlgorithmTrading is a production-focused algorithmic trading platform that separates:

- **Python offline workloads** (research, feature engineering, backtesting, diagnostics)
- **Rust online workloads** (market data, signal bridge, risk checks, execution path)

The repository now follows a **static operations documentation model** (no weekly gate artifacts in active docs).

## Current Rollout Status (Phase 3)

- Go control-plane implementation is in place and functional parity gates have been executed with real artifacts.
- Current verdict remains **NO-GO** for full production cutover.
- Active blockers:
  - DuckDB compatibility issue on Go read path (`duckdb_unavailable` / deserialize error).
  - Hard-gate completion pending for soak and rollback drill.

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
2. Review `config/` risk limits and runtime settings.
3. Validate local environment:

```bash
bash scripts/check_dependencies.sh
```

### 3) Start services

```bash
bash scripts/start_trading_system.sh
```

Alternative runtime paths are documented in:

- `scripts/autonomous_trading_system.sh`
- `scripts/start_trading.sh`
- `scripts/start_services.sh`

### 4) Observe health

```bash
bash scripts/health_check.sh
```

```bash
bash scripts/start_observability.sh
```

## Runtime Architecture Snapshot

Core flow:

1. `rust/market-data` ingests and normalizes market events.
2. `rust/signal-bridge` computes technical/ML signals.
3. `rust/risk-manager` enforces risk and safety controls.
4. `rust/execution-engine` routes and manages execution lifecycle.
5. Python modules in `src/` provide research, orchestration, and observability layers.

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

Roadmap lifecycle has been consolidated to one static summary:

- `docs/roadmap/FINAL_ROADMAP_SUMMARY.md`
- `docs/roadmap/PHASE3_GO_NO_GO_EVIDENCE.md`

## Phase 3 Gate Commands

```bash
python -m pytest tests/observability/test_go_parity.py -q
python -m pytest tests/observability -q
python -m pytest tests/integration/test_observability_integration.py -q
```

## Scripts Hub

Runtime and maintenance scripts are indexed here:

- `scripts/README.md`

## Repository Layout

```text
[REPO_ROOT]/
├── src/                  # Python source code
├── rust/                 # Rust workspace
├── tests/                # Python + Rust tests
├── scripts/              # Runtime / maintenance scripts
├── config/               # Runtime configs
├── docs/                 # Active operational docs
└── data/                 # Runtime and research data
```

## Notes

- Public envelope contract remains unchanged:
  - `schema_version`
  - `correlation_id`
  - `event_type`
  - `timestamp`
  - `payload`
- This cleanup intentionally removes weekly governance artifacts from active tree to keep operations docs concise and maintainable.
