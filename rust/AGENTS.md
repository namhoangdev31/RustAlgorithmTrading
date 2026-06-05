# Rust Agent

> **Scope**: `rust/` only. Do NOT read files outside this directory.

## Ownership

| Crate | Purpose |
|---|---|
| `common` | Shared types, config, errors, messaging, health |
| `market-data` | Alpaca websocket ingest, orderbook, aggregation |
| `signal-bridge` | Low-latency indicators, features, PyO3 bridge, backtest runtime |
| `risk-manager` | Limits, stops, PnL, circuit breaker |
| `execution-engine` | Routing, retry, slippage, stop-loss execution |
| `database` | Storage models, schema, migrations, queries |
| `tests` | Integration, unit, property, benchmark tests |

## Read First

- Crate's `Cargo.toml` for dependencies
- Crate's `src/lib.rs` or `src/main.rs` for entry point
- `common/src/` for shared types

## Validate

```bash
cd rust && cargo test --workspace
```

Targeted: `cargo test -p <crate>` or `cargo test <test_fn>`
Style: `cargo fmt --all` · Lint: `cargo clippy --workspace -- -D warnings`

## Common Tasks

| Task | Do this | Don't |
|---|---|---|
| Add type/struct | Grep `common/src/` for similar | Read all crates |
| Fix crate bug | Grep error → read specific crate | Scan workspace |
| Add test | Read crate's `#[cfg(test)]` | Run full suite first |
| PyO3 binding | Read `signal-bridge/src/` `#[pyclass]` | Guess Python API |
| Config change | Read `common/src/config.rs` | Read ops/ directly |

## Forbidden Reads

```
Cargo.lock       # 142KB
target/          # Build artifacts (3.2GB)
.idea/           # IDE config
docs/            # Generated docs
```

## Forbidden Writes

Lock files · Build artifacts · Generated docs · Binary files

## Cross-Domain Triggers

- Changing `signal-bridge` ZMQ → also read `python/AGENTS.md`
- Changing `common` health/metrics → also read `go/AGENTS.md`

## Standalone Rules

### Risk

| Level | Action |
|---|---|
| Low (docs, comments) | Execute directly |
| Medium (logic, bug fix) | Plan if ≥3 files |
| High (API, DB, shared types) | Plan + rollback note |
| Critical (secrets, migrations) | Plan + user approval |

### Planning (≥3 files)

1. Grep first · Step format: `Step N: [ACTION] [PATH]` — What + Why
2. Max 3 steps (medium) · 5 (high) · 8 (critical)
3. ❌ No explore/review steps · ❌ No scope creep · ❌ No unrequested tests/docs
4. Order: Schema → Logic → Interface → Wiring · Execute immediately

### Grep-Before-Read

Files >120 lines: grep first → read 50-200 lines around match.
Files <120 lines: may read full file.
Never open files "to explore."

### Output

1. Diff only — no full rewrites, no unchanged code
2. Keep files <500 lines — split when larger
3. Reuse helpers — check `common/` before writing new utils
4. No pre-summaries — just execute

### Response

- **Changed**: files · **Why**: 1-line · **Validated**: cmd + result · **Risk**: level
