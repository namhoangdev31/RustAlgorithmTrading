# Development Agent

Owns local-only scratch utilities under `development/`.

This folder is intentionally sparse after the ops cleanup. Use it only for temporary developer-only helpers that do not belong to production runtime, Docker images, or domain code.

Do not put production runtime scripts here; those belong in `ops/`.

## Standalone Rules (when root AGENTS.md is not available)

### Risk Classification

| Level | Examples | Action |
|---|---|---|
| Low | Modifying a scratch tool for formatting | Execute directly |
| Medium | Modifying local test helper logic | Plan if ≥3 files |
| High | Scratch scripts interacting with remote testnets/prod | Plan + rollback note |
| Critical | Anything dealing with actual API tokens/secrets | Plan + user approval required |

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
3. **Never read**: `.git/`, test report caches, generated test logs

#### Writing / Coding Rules
1. **Respond concisely**: Do not restate unchanged code. Show only the diff or modified parts.
2. **Keep files small**: Limit modules to ~500 lines. Split logic early to minimize future read tokens.
3. **Targeted edits only**: Modify only the lines needed for the fix. Avoid formatting unrelated code.
4. **No full-file overwrites**: Use precise block replacements instead of rewriting entire files.
5. **Reuse existing helpers**: Check if utility functions exist before implementing new ones.

### Response Format

- **Changed**: files list · **Why**: 1-line purpose · **Validated**: validation performed · **Risk**: level + rollback if High/Critical
