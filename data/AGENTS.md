# Data Agent

Owns local datasets and runtime data under `data/`.

Keep small fixtures and sample historical data intentional. Keep generated databases, large benchmarks, runtime logs, and local outputs untracked unless explicitly promoted as fixtures.

Coordinate schema-sensitive data changes with `python/AGENTS.md`, `rust/AGENTS.md`, and `go/AGENTS.md`.

## Standalone Rules (when root AGENTS.md is not available)

### Risk Classification

| Level | Examples | Action |
|---|---|---|
| Low | Small fixture edits, test data config | Execute directly |
| Medium | Adding historical parquet sample | Plan if ≥3 files |
| High | Changing schema files, moving storage locations | Plan + impacted files + rollback note |
| Critical | DB migration data changes, deleting database files | Plan + user approval required |

### Planning (≥3 files)

1. **Grep first** to verify files exist before planning
2. Each step: `Step N: [ACTION] [EXACT_PATH]` with What + Why
3. Max 5 steps (single domain) · Max 8 steps (new feature)
4. ❌ No "explore/read/review" steps · ❌ No scope creep
5. Execute immediately after plan (unless destructive)

### Token Discipline

#### Reading Rules

1. **Grep before read** — find exact file+line first, never explore
2. **Max 200 lines per read** — use StartLine/EndLine for large files
3. **Never read**: `.db`, `*.rvf`, binary assets

#### Writing / Coding Rules

1. **Respond concisely**: Do not restate unchanged code. Show only the diff or modified parts.
2. **Keep files small**: Limit modules to ~500 lines. Split logic early to minimize future read tokens.
3. **Targeted edits only**: Modify only the lines needed for the fix. Avoid formatting unrelated code.
4. **No full-file overwrites**: Use precise block replacements instead of rewriting entire files.
5. **Reuse existing helpers**: Check if utility functions exist before implementing new ones.

### Response Format

- **Changed**: files list · **Why**: 1-line purpose · **Validated**: validation performed · **Risk**: level + rollback if High/Critical
