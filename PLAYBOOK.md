# PLAYBOOK.md - Workspace Routing Map

Updated: 2026-05-28
Scope: Multi-domain Rust/Python/Go/Next.js/iOS/Android trading workspace

## Reading Order

1. `docs/DOCS_CANONICAL_MAP.md`
2. `README_VI.md`
3. `PLAYBOOK.md`
4. The nearest domain `AGENTS.md`

## Domain Map

| Domain | Main path | Agent file | Primary validation |
|---|---|---|---|
| Python research/runtime support | `python/` | `python/AGENTS.md` | `cd python && python -m pytest tests -q` |
| Rust execution kernel | `rust/` | `rust/AGENTS.md` | `cd rust && cargo test --workspace` |
| Go observability control plane | `go/` | `go/AGENTS.md` | `cd go && go test ./...` |
| Next.js web app | `nextjs/` | `nextjs/AGENTS.md` | `cd nextjs && yarn typecheck` |
| iOS app/package | `ios/` | `ios/AGENTS.md` | Xcode build or package CI from `ios/` |
| Android app | `android/` | `android/AGENTS.md` | `cd android && ./gradlew test` |
| Operations/runtime | `ops/` | `ops/AGENTS.md` | script shell checks + targeted service smoke |
| Development utilities | `development/` | `development/AGENTS.md` | utility-specific dry run |
| Documentation/research | `docs/` | `docs/AGENTS.md` | doc link/path review |
| Data artifacts | `data/` | `data/AGENTS.md` | fixture/data integrity checks |

## Ownership

| Area | Owns |
|---|---|
| `python/src/api` | Alpaca clients, API adapters, rate-limit handling |
| `python/src/data` | Historical data loading, preprocessing, indicators, features |
| `python/src/strategies` | Strategy contracts, signal logic, strategy router |
| `python/src/backtesting` | Backtest orchestration, metrics, portfolio state, risk parity |
| `python/src/bridge` | Python side of Rust/ZMQ handoff |
| `python/tests` | Python unit, integration, e2e, benchmark, observability parity tests |
| `rust/common` | Shared Rust types, config, errors, messaging, health |
| `rust/market-data` | Alpaca websocket ingest, orderbook, aggregation |
| `rust/signal-bridge` | Low-latency indicators, features, PyO3 bridge, backtest runtime |
| `rust/risk-manager` | Limits, stops, PnL, circuit breaker |
| `rust/execution-engine` | Routing, retry, slippage, stop-loss execution |
| `rust/database` | Storage models, schema, migrations, queries |
| `rust/tests` | Rust integration, unit, property, benchmark tests |
| `go/internal` | Observability API, health, metrics, storage, websocket fanout |
| `nextjs/app` | App Router routes, server actions, auth handlers |
| `nextjs/components` | UI, admin, dashboard, layout components |
| `nextjs/prisma` | Prisma schema and generated client models |
| `ops/config` | Runtime config and risk limits |
| `ops/scripts` | Runtime, maintenance, validation, data download scripts |
| `ops/deployment` | Docker, Compose, monitoring, staging/prod deployment |
| `development` | Local bootstrap and exploratory analysis tools |
| `docs/research` | Strategy and quant research notes |
| `docs/testing` | Testing reports and strategy docs |

## Cross-Domain Contracts

| Contract | Read first | Validate |
|---|---|---|
| Python-Rust signal handoff | `docs/api/ZMQ_PROTOCOL.md`, `docs/architecture/python-rust-separation.md` | `cd python && python -m pytest tests/integration/test_backtest_signal_flow.py -q`; `cd rust && cargo test -p signal-bridge` |
| Runtime config | `ops/config/README.md`, `docs/deployment/PRODUCTION_DEPLOYMENT.md` | `bash ops/scripts/check_dependencies.sh` |
| Observability API | `docs/observability/OBSERVABILITY_OVERVIEW.md` | `cd go && go test ./...`; `cd python && python -m pytest tests/observability/test_go_parity.py -q` |
| Web dashboard/API | `go/AGENTS.md`, `nextjs/AGENTS.md` | Go API tests + Next.js typecheck |
| Mobile/runtime manifest | `ios/AGENTS.md`, `android/AGENTS.md`, `nextjs/AGENTS.md` | Platform build/test for touched app |

## Maintenance Rules

1. New source, config, script, doc, or test files must be added to this playbook.
2. Do not add root-level working files.
3. Keep generated outputs, caches, local databases, and secrets untracked.
4. If a path moves, update `README.md`, `README_VI.md`, `AGENTS.md`, this playbook, and nearest domain `AGENTS.md`.
5. For cross-runtime edits, update all affected folders in one coordinated change.
