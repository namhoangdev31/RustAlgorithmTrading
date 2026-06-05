# Go Agent

> **Scope**: `go/` only. Do NOT read files outside this directory.

## Ownership

| Path | Purpose |
|---|---|
| `cmd/` | Application entry points |
| `internal/` | HTTP routes, WebSocket fanout, health aggregation, metrics, DuckDB/Postgres storage, rate limiting, ZMQ envelope parsing |
| `tests/` | Integration and unit tests |
| `go.mod` | Dependencies and module path |

## Validate

```bash
cd go && go test ./...
```

Targeted: `go test ./internal/<package>/...`

## Style

- Format: `gofmt` / `goimports`
- Lint: `go vet ./...`
- Naming: exported = `PascalCase`, unexported = `camelCase`
- Errors: wrap with `fmt.Errorf("context: %w", err)`
- Context: always pass `context.Context` as first param

## Common Tasks

| Task | Do this | Don't do this |
|---|---|---|
| Add API route | Read `internal/` → grep for similar handler | Read all of `internal/` |
| Add metric | Read `internal/` → grep `metrics` | Scan full codebase |
| Fix test | Read the failing test file only | Run `go test ./...` first |
| Storage change | Read `internal/` → grep `duckdb\|postgres` | Read database schema from rust/ |

## Forbidden Paths (NEVER read)

```
go.sum                # 10KB — dependency checksums, zero useful context
observability-api     # 184MB compiled binary — NEVER read
.idea/                # IDE config
```

## Cross-Domain (only when task requires)

- **Go↔Next.js API**: Changing endpoints → also read `nextjs/AGENTS.md`
- **Go↔Python telemetry**: Changing metrics → also read `python/AGENTS.md`
- **Go↔Rust health**: Changing health aggregation → also read `rust/AGENTS.md`
- **Go↔Ops config**: Changing config loading → also read `ops/AGENTS.md`

## Anti-Patterns

- ❌ Do NOT scan sibling directories (`python/`, `rust/`, `nextjs/`, etc.)
- ❌ Do NOT read `PLAYBOOK.md` or root `AGENTS.md` for single-domain tasks
- ❌ Do NOT read `go.sum` — use `go.mod` for dependency info
- ❌ Do NOT read the `observability-api` binary (184MB!)
- ❌ Do NOT `ls -R go/` — navigate to the specific package

## Standalone Rules (when root AGENTS.md is not available)

### Risk Classification

| Level | Examples | Action |
|---|---|---|
| Low | Docs, comments, style fix | Execute directly |
| Medium | Logic change, bug fix | Plan if ≥3 files |
| High | API endpoints, health contracts, storage schema | Plan + impacted files + rollback note |
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
3. **Never read**: `go.sum`, `observability-api` binary (184MB!), `.idea/`
4. **No assumptions** — verify module paths, types, API shapes in `go.mod` and source

#### Writing / Coding Rules

1. **Respond concisely**: Do not restate unchanged code. Show only the diff or modified parts.
2. **Keep files small**: Limit modules to ~500 lines. Split logic early to minimize future read tokens.
3. **Targeted edits only**: Modify only the lines needed for the fix. Avoid formatting unrelated code.
4. **No full-file overwrites**: Use precise block replacements instead of rewriting entire files.
5. **Reuse existing helpers**: Check if utility functions exist before implementing new ones.

### Response Format

- **Changed**: files list · **Why**: 1-line purpose · **Validated**: command + result · **Risk**: level + rollback if High/Critical
