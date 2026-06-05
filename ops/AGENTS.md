# Ops Agent

> **Scope**: `ops/` only. Do NOT read files outside this directory.

## Ownership

| Path | Purpose |
|---|---|
| `config/` | Runtime config, risk limits, env settings |
| `scripts/` | Service lifecycle, data download, validation |
| `deployment/` | Docker image definitions |

## Read First

- Specific config file for the task
- Specific script for the task

## Validate

`bash -n <script>` + nearest dry run.

## Common Tasks

| Task | Do this | Don't |
|---|---|---|
| Edit config | Read specific config file | Read all configs |
| Edit script | Read specific script | Scan all scripts |
| Docker change | Read specific Dockerfile | Read Docker docs |

## Forbidden Reads

Secrets (`.env*`, `*.pem`, `*.key`) · IDE config (`.idea/`) · Sibling domain source code

## Forbidden Writes

Secrets · Lock files · Sibling domain files · Production infra without approval

## Banned Unless Requested

❌ Docker Compose · ❌ Grafana · ❌ Prometheus · ❌ Alertmanager

## Cross-Domain Triggers

Config changes → read affected domain's `AGENTS.md` to verify impact.

## Standalone Rules

### Risk

| Level | Action |
|---|---|
| Low (script comment, config formatting) | Execute directly |
| Medium (script logic, config value) | Plan if ≥3 files |
| High (Docker, deploy, shared config) | Plan + impacted domains + rollback |
| Critical (secrets, production deploy, infra) | Plan + user approval |

### Planning (≥3 files)

1. Grep first · Step format: `Step N: [ACTION] [PATH]` — What + Why
2. Max 3 steps (medium) · 5 (high) · 8 (critical)
3. ❌ No explore/review steps · ❌ No scope creep
4. Execute immediately (unless destructive)

### Grep-Before-Read

Files >120 lines: grep first → read 50-200 lines around match.
Files <120 lines: may read full file.

### Output

1. Diff only — no full rewrites, no unchanged code
2. Keep scripts <500 lines — split when larger
3. No pre-summaries — just execute

### Response

- **Changed**: files · **Why**: 1-line · **Validated**: cmd + result · **Risk**: level
