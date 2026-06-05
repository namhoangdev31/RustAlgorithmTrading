# Rust Agent

> **Scope**: `rust/` only. Do NOT read files outside this directory.

## Crates

| Crate | Purpose |
|---|---|
| `common` | Shared types, config, errors, messaging, health |
| `market-data` | Alpaca websocket ingest, orderbook, aggregation |
| `signal-bridge` | Low-latency indicators, features, PyO3 bridge, backtest runtime |
| `risk-manager` | Limits, stops, PnL, circuit breaker |
| `execution-engine` | Routing, retry, slippage, stop-loss execution |
| `database` | Storage models, schema, migrations, queries |
| `tests` | Integration, unit, property, benchmark tests |

## Validate

```bash
cd rust && cargo test --workspace
```

Targeted: `cargo test -p <crate-name>` or `cargo test <test_function_name>`

## Style

- Format: `cargo fmt --all`
- Lint: `cargo clippy --workspace --all-targets -- -D warnings` (zero warnings)
- Errors: `thiserror` for library errors, `anyhow` for application errors
- Async: `tokio` runtime, never block in async context
- Docs: All public items must have `///` doc comments
- Modules: Keep under 500 lines, split when larger

## Common Tasks

| Task | Do this | Don't do this |
|---|---|---|
| Add type/struct | Check `common/src/` first → grep for similar types | Read all crates |
| Fix crate bug | Read the specific crate's `src/lib.rs` → grep error | Scan full workspace |
| Add test | Read `tests/` or the crate's `#[cfg(test)]` module | Run full `cargo test` first |
| PyO3 binding | Read `signal-bridge/src/` → follow `#[pyclass]` pattern | Guess Python API |
| Config change | Read `common/src/config.rs` → coordinate with `ops/AGENTS.md` | Read ops/ directly |

## Forbidden Paths (NEVER read)

```
Cargo.lock            # 142KB — never useful for AI context
target/               # Build artifacts (can be gigabytes)
.idea/                # IDE config
docs/                 # Rust docs — use `cargo doc` if needed
config                # Runtime config file (9 bytes placeholder)
```

## Cross-Domain (only when task requires)

- **Rust↔Python ZMQ**: Changing `signal-bridge` → also read `python/AGENTS.md`
- **Rust↔Go metrics**: Changing `common` health/metrics → also read `go/AGENTS.md`

## Anti-Patterns

- ❌ Do NOT scan sibling directories (`python/`, `go/`, `nextjs/`, etc.)
- ❌ Do NOT read `PLAYBOOK.md` or root `AGENTS.md` for single-domain tasks
- ❌ Do NOT read `Cargo.lock` (142KB) — use `Cargo.toml` for dependency info
- ❌ Do NOT list `target/` — it contains build artifacts only
- ❌ Do NOT read entire crate source — grep for the function/type first

## Standalone Rules (when root AGENTS.md is not available)

### Risk Classification

| Level | Examples | Action |
|---|---|---|
| Low | Docs, comments, style fix | Execute directly |
| Medium | Logic change, bug fix | Plan if ≥3 files |
| High | API contracts, DB schema, shared types | Plan + impacted files + rollback note |
| Critical | Secrets, migrations, permissions | Plan + user approval required |

### Planning (≥3 files)

1. **Grep first** to verify files exist before planning
2. Each step: `Step N: [ACTION] [EXACT_PATH]` with What + Why
3. Max 5 steps (single domain) · Max 8 steps (new feature)
4. ❌ No "explore/read/review" steps · ❌ No scope creep · ❌ No unrequested tests/docs
5. Order: Schema → Logic → Interface → Wiring
6. Execute immediately after plan (unless destructive)

### Token Discipline

#### Reading Rules
1. **Grep before read** — find exact file+line first, never explore
2. **Max 200 lines per read** — use StartLine/EndLine for large files
3. **Never read**: `Cargo.lock`, `target/`, binaries, generated files, `.idea/`
4. **No assumptions** — verify crate names, types, API shapes in `Cargo.toml` and source

#### Writing / Coding Rules
1. **Respond concisely**: Do not restate unchanged code. Show only the diff or modified parts.
2. **Keep files small**: Limit modules to ~500 lines. Split logic early to minimize future read tokens.
3. **Targeted edits only**: Modify only the lines needed for the fix. Avoid formatting unrelated code.
4. **No full-file overwrites**: Use precise block replacements instead of rewriting entire files.
5. **Reuse existing helpers**: Check if utility functions exist before implementing new ones.

### Response Format

- **Changed**: files list · **Why**: 1-line purpose · **Validated**: command + result · **Risk**: level + rollback if High/Critical
