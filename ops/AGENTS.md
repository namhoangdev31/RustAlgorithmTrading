# Ops Agent

> **Scope**: `ops/` only. Do NOT read files outside this directory.

## Ownership

| Path | Purpose |
|---|---|
| `config/` | Runtime config, risk limits, env settings |
| `scripts/` | Service lifecycle, data download, validation |
| `deployment/` | Docker image definitions only |

## Validate

`bash -n <script>` + nearest dry run.

## Common Tasks

| Task | Do this | Don't do this |
|---|---|---|
| Edit config | Read specific config file | Read all config files |
| Edit script | Read specific script | Scan all scripts |
| Docker change | Read specific Dockerfile | Read docker docs |

## Banned Unless Requested

❌ Docker Compose · ❌ Grafana · ❌ Prometheus · ❌ Alertmanager

## Cross-Domain

Config changes → coordinate with affected domain's `AGENTS.md`.

## Anti-Patterns

- ❌ Do NOT scan sibling directories
- ❌ Do NOT read root `AGENTS.md` for single-domain tasks

## Standalone Rules (when root AGENTS.md is not available)

### Risk Classification

| Level | Examples | Action |
|---|---|---|
| Low | Script comment, config formatting | Execute directly |
| Medium | Script logic, config value change | Plan if ≥3 files |
| High | Docker config, deploy scripts, shared config | Plan + impacted domains + rollback note |
| Critical | Secrets, production deploy, infra changes | Plan + user approval required |

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
3. **No assumptions** — verify config keys, env vars, script deps in source

#### Writing / Coding Rules
1. **Respond concisely**: Do not restate unchanged code. Show only the diff or modified parts.
2. **Keep files small**: Limit modules/scripts to ~500 lines. Split logic early to minimize future read tokens.
3. **Targeted edits only**: Modify only the lines needed for the fix. Avoid formatting unrelated code.
4. **No full-file overwrites**: Use precise block replacements instead of rewriting entire files.
5. **Reuse existing helpers**: Check if utility functions exist before implementing new ones.

### Response Format

- **Changed**: files list · **Why**: 1-line purpose · **Validated**: command + result · **Risk**: level + rollback if High/Critical
