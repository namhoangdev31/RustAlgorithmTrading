# Go Agent

> **Scope**: `go/` only. Do NOT read files outside this directory.

## Ownership

| Path | Purpose |
|---|---|
| `cmd/` | Application entry points |
| `internal/` | HTTP routes, WebSocket fanout, health, metrics, DuckDB/Postgres, ZMQ |
| `tests/` | Integration and unit tests |

## Read First

- `go.mod` for dependencies and module path
- `cmd/` for entry points
- `internal/<package>/` for specific logic

## Validate

```bash
cd go && go test ./...
```

Targeted: `go test ./internal/<package>/...`
Style: `gofmt` / `goimports` · Lint: `go vet ./...`

## Common Tasks

| Task | Do this | Don't |
|---|---|---|
| Add API route | Grep `internal/` for similar handler | Read all of `internal/` |
| Add metric | Grep `metrics` in `internal/` | Scan full codebase |
| Fix test | Read failing test file only | Run `go test ./...` first |
| Storage change | Grep `duckdb\|postgres` | Read DB schema from rust/ |

## Forbidden Reads

```
go.sum                # 10KB — checksums only
observability-api     # 184MB compiled binary — NEVER
.idea/                # IDE config
```

## Forbidden Writes

Lock files (`go.sum` auto-managed) · Binary files · IDE config

## Cross-Domain Triggers

- Changing endpoints → also read `nextjs/AGENTS.md`
- Changing metrics → also read `python/AGENTS.md`
- Changing health aggregation → also read `rust/AGENTS.md`
- Changing config loading → also read `ops/AGENTS.md`

## Standalone Rules

### Risk

| Level | Action |
|---|---|
| Low (docs, comments) | Execute directly |
| Medium (logic, bug fix) | Plan if ≥3 files |
| High (API endpoints, health, storage) | Plan + rollback note |
| Critical (secrets, migrations) | Plan + user approval |

### Planning (≥3 files)

1. Grep first · Step format: `Step N: [ACTION] [PATH]` — What + Why
2. Max 3 steps (medium) · 5 (high) · 8 (critical)
3. ❌ No explore/review steps · ❌ No scope creep · ❌ No unrequested tests/docs
4. Order: Schema → Logic → Interface → Wiring · Execute immediately

### Grep-Before-Read

Files >120 lines: grep first → read 50-200 lines around match.
Files <120 lines: may read full file.
Never open files "to explore." Use `go.mod` for deps, not `go.sum`.

### Output

1. Diff only — no full rewrites, no unchanged code
2. Keep files <500 lines — split when larger
3. Errors: wrap with `fmt.Errorf("context: %w", err)` · Context: first param
4. No pre-summaries — just execute

### Response

- **Changed**: files · **Why**: 1-line · **Validated**: cmd + result · **Risk**: level
