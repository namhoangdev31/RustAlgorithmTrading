# Workspace Agent Router

This repository is organized as a multi-domain workspace. The root agent coordinates work across folders and delegates to the nearest domain `AGENTS.md`.

## Canonical Layout

| Folder | Agent owner | Scope |
|---|---|---|
| `python/` | Python Agent | Research, backtesting, strategy logic, Python tests |
| `rust/` | Rust Agent | Low-latency runtime crates, shared protocol types, Rust integration tests |
| `go/` | Go Agent | Observability control plane, HTTP/WS API, DuckDB/Postgres adapters |
| `nextjs/` | Next.js Agent | Web app, user-facing telemetry/config UI, Prisma, Firebase/Auth.js |
| `ios/` | iOS Agent | SwiftUI app and AdaptiveSwiftUi package |
| `android/` | Android Agent | Android/Kotlin/Compose app |
| `ops/` | Ops Agent | Runtime config, Docker image definitions, minimal local scripts |
| `development/` | Development Agent | Bootstrap helpers and analysis utilities |
| `docs/` | Docs Agent | Canonical docs, research notes, testing documentation |
| `data/` | Data Agent | Local datasets, sample historical data, runtime database artifacts |

## Routing Rules

1. Read `docs/DOCS_CANONICAL_MAP.md`, `README_VI.md`, and `PLAYBOOK.md` before non-trivial edits.
2. Work inside the owning folder whenever possible.
3. If a task crosses folders, coordinate through this root agent and update each touched domain together.
4. Do not create working files in the repository root.
5. Keep secrets and runtime outputs untracked.
6. Prefer nearest tests first:
   - Python: `cd python && python -m pytest tests -q`
   - Rust: `cd rust && cargo test --workspace`
   - Go: `cd go && go test ./...`
   - Next.js: `cd nextjs && yarn typecheck`
7. Cross-runtime message contracts must update Python/Rust/Go together.

## Agent Collaboration

Folder agents are peers. The root agent owns orchestration only:

- Python <-> Rust: strategy, backtest, feature parity, ZMQ contracts.
- Rust <-> Go: metrics, runtime health, storage contracts.
- Go <-> Next.js: telemetry API and user-facing config contract.
- iOS/Android <-> Go: product/runtime manifest alignment.
- Ops <-> all domains: config, deployment, service startup, CI.

## Root Safety

Allowed root files are project-level coordination files such as `README.md`, `README_VI.md`, `PLAYBOOK.md`, `AGENTS.md`, `LICENSE`, `CONTRIBUTING.md`, `.gitignore`, `.github/`, and `.git/`. Everything else should live in a domain folder.
