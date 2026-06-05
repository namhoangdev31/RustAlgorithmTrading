# Python Agent

> **Scope**: `python/` only. Do NOT read files outside this directory.

## Ownership

| Path | Purpose |
|---|---|
| `src/api/` | Alpaca clients, API adapters, rate-limit |
| `src/data/` | Historical data, preprocessing, indicators, features |
| `src/strategies/` | Strategy contracts, signal logic, router |
| `src/backtesting/` | Backtest orchestration, metrics, portfolio, risk parity |
| `src/bridge/` | Python↔Rust ZMQ handoff |
| `tests/` | Unit, integration, e2e, benchmark tests |

## Read First

- `pyproject.toml` for dependencies and build config
- `.ruff.toml` for linter config
- `src/<module>/__init__.py` for module exports

## Validate

```bash
cd python && python -m pytest tests -q
```

Targeted: `pytest tests/unit/test_<module>.py -q`
Style: `black` (line-length 100) · Lint: `ruff` · Types: `mypy`

## Common Tasks

| Task | Do this | Don't |
|---|---|---|
| Add API endpoint | Grep `src/api/` for similar client | Read all of `src/` |
| Add indicator | Grep `src/data/` for similar | Read `src/strategies/` |
| Fix test | Read failing test file only | Run full suite first |
| Add strategy | Read `src/strategies/base.py` interface | Scan entire `src/` |
| Bridge change | Read `src/bridge/` + `rust/AGENTS.md` | Guess ZMQ protocol |

## Forbidden Reads

```
uv.lock              # 507KB
__pycache__/          # Python cache
.venv/                # Virtual environment
*.egg-info/           # Build artifacts
.coverage             # Coverage data
.ruff_cache/          # Linter cache
```

## Forbidden Writes

Lock files · Build artifacts · Generated files · `.venv/` · Coverage data

## Cross-Domain Triggers

- Changing `src/bridge/` → also read `rust/AGENTS.md`
- Changing observability code → also read `go/AGENTS.md`

## Standalone Rules

### Risk

| Level | Action |
|---|---|
| Low (docs, comments) | Execute directly |
| Medium (logic, bug fix) | Plan if ≥3 files |
| High (API, auth, config) | Plan + rollback note |
| Critical (secrets, migrations) | Plan + user approval |

### Planning (≥3 files)

1. Grep first · Step format: `Step N: [ACTION] [PATH]` — What + Why
2. Max 3 steps (medium) · 5 (high) · 8 (critical)
3. ❌ No explore/review steps · ❌ No scope creep · ❌ No unrequested tests/docs
4. Order: Schema → Logic → Interface → Wiring · Execute immediately

### Grep-Before-Read

Files >120 lines: grep first → read 50-200 lines around match.
Files <120 lines: may read full file.
Never open files "to explore." Use `pyproject.toml` for deps, not `uv.lock`.

### Output

1. Diff only — no full rewrites, no unchanged code
2. Keep files <500 lines — split when larger
3. Reuse helpers — check existing utils before writing new
4. No pre-summaries — just execute

### Response

- **Changed**: files · **Why**: 1-line · **Validated**: cmd + result · **Risk**: level
