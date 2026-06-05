# Python Agent

> **Scope**: `python/` only. Do NOT read files outside this directory.

## Ownership

| Path | Purpose |
|---|---|
| `src/api/` | Alpaca clients, API adapters, rate-limit |
| `src/data/` | Historical data loading, preprocessing, indicators, features |
| `src/strategies/` | Strategy contracts, signal logic, strategy router |
| `src/backtesting/` | Backtest orchestration, metrics, portfolio, risk parity |
| `src/bridge/` | Python↔Rust ZMQ handoff |
| `tests/` | Unit, integration, e2e, benchmark tests |
| `pyproject.toml` | Dependencies and build config |
| `.ruff.toml` | Linter config |

## Validate

```bash
cd python && python -m pytest tests -q
```

Targeted: `pytest tests/unit/test_<module>.py -q`

## Style

- Formatter: `black` (line-length 100)
- Linter: `ruff`
- Types: `mypy` — all functions must have type hints
- Models: Pydantic `BaseModel` for data validation
- Async: `async/await` for I/O, `asyncio.gather` for concurrent

## Common Tasks

| Task | Do this | Don't do this |
|---|---|---|
| Add API endpoint | Read `src/api/` → find similar client → follow pattern | Read all of `src/` |
| Add indicator | Read `src/data/` → grep for similar indicator | Read `src/strategies/` |
| Fix test | Read the failing test file only | Run full test suite first |
| Add strategy | Read `src/strategies/base.py` → follow interface | Scan entire `src/` |
| Bridge change | Read `src/bridge/` + coordinate with `rust/AGENTS.md` | Guess ZMQ protocol |

## Forbidden Paths (NEVER read)

```
uv.lock              # 507KB — zero useful context
__pycache__/          # Python cache
.venv/                # Virtual environment
*.egg-info/           # Build artifacts
.coverage             # Coverage data
.ruff_cache/          # Linter cache
```

## Cross-Domain (only when task requires)

- **Python↔Rust ZMQ**: Changing `src/bridge/` → also read `rust/AGENTS.md`
- **Python↔Go telemetry**: Changing observability code → also read `go/AGENTS.md`

## Anti-Patterns

- ❌ Do NOT scan sibling directories (`rust/`, `go/`, `nextjs/`, etc.)
- ❌ Do NOT read `PLAYBOOK.md` or root `AGENTS.md` for single-domain tasks
- ❌ Do NOT `ls -R python/` — navigate to the specific subfolder
- ❌ Do NOT read `uv.lock` or `requirements.txt` to understand dependencies — read `pyproject.toml`
- ❌ Do NOT read `CONTRIBUTING.md` (36KB) unless user explicitly asks

## Standalone Rules (when root AGENTS.md is not available)

### Risk Classification

| Level | Examples | Action |
|---|---|---|
| Low | Docs, comments, style fix | Execute directly |
| Medium | Logic change, bug fix | Plan if ≥3 files |
| High | API contracts, auth, shared config | Plan + impacted files + rollback note |
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
3. **Never read**: lock files, build artifacts, binaries, generated files, `.idea/`
4. **No assumptions** — verify package manager, versions, API shapes in source

#### Writing / Coding Rules

1. **Respond concisely**: Do not restate unchanged code. Show only the diff or modified parts.
2. **Keep files small**: Limit modules to ~500 lines. Split logic early to minimize future read tokens.
3. **Targeted edits only**: Modify only the lines needed for the fix. Avoid formatting unrelated code.
4. **No full-file overwrites**: Use precise block replacements instead of rewriting entire files.
5. **Reuse existing helpers**: Check if utility functions exist before implementing new ones.

### Response Format

- **Changed**: files list · **Why**: 1-line purpose · **Validated**: command + result · **Risk**: level + rollback if High/Critical
