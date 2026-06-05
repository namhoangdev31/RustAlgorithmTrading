# PLAYBOOK — Cross-Domain Reference

> **When to read**: ONLY when task spans 2+ domains. Single-domain → read domain `AGENTS.md` only.

## Ownership Quick Ref

| Domain | Key Paths |
|---|---|
| Python | `python/src/{api,data,strategies,backtesting,bridge}`, `python/tests` |
| Rust | `rust/{common,market-data,signal-bridge,risk-manager,execution-engine,database,tests}` |
| Go | `go/{cmd,internal,tests}` |
| Next.js | `nextjs/{app,components,lib,prisma,hooks,types}` |
| iOS | `ios/{iosApp,Configuration}` |
| Android | `android/{app,gradle}` |
| Ops | `ops/{config,scripts,deployment}` |

## Cross-Domain Contracts

| Contract | Validate |
|---|---|
| Python↔Rust ZMQ | `pytest tests/integration/test_backtest_signal_flow.py` + `cargo test -p signal-bridge` |
| Go↔Python telemetry | `go test ./...` + `pytest tests/observability/ -q` |
| Go↔Next.js API | Go tests + `yarn typecheck` |
| Mobile manifest | Platform build for touched app |
| Ops config | `bash ops/scripts/check_dependencies.sh` |

## Rules

1. Cross-domain changes → update all affected domains in one commit.
2. No root-level working files.
3. Secrets, caches, databases → `.gitignore`.
