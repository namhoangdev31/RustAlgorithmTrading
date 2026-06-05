# Root Agent — Router

> **Rule 1**: Read ONLY the nearest domain `AGENTS.md`. Come here ONLY when 2+ domains.

## Route

| Domain | AGENTS | Validate |
|---|---|---|
| `python/` | `python/AGENTS.md` | `cd python && python -m pytest tests -q` |
| `rust/` | `rust/AGENTS.md` | `cd rust && cargo test --workspace` |
| `go/` | `go/AGENTS.md` | `cd go && go test ./...` |
| `nextjs/` | `nextjs/AGENTS.md` | `cd nextjs && yarn typecheck` |
| `ios/` | `ios/AGENTS.md` | Xcode build |
| `android/` | `android/AGENTS.md` | `cd android && ./gradlew test` |
| `ops/` | `ops/AGENTS.md` | `bash -n` + dry run |

## AGENTS Loading Policy

Read the smallest possible context:

- **Single-domain**: Read ONLY that domain's `AGENTS.md`. Nothing else.
- **Cross-domain**: Read this file + only the affected domain `AGENTS.md` files.
- **PLAYBOOK.md**: Read ONLY when task is explicitly cross-domain or architectural.
- **Never**: Read all domain AGENTS files at once.

## Cross-Domain Trigger Matrix

Read another domain's `AGENTS.md` ONLY when the change affects:

| Trigger | Also read |
|---|---|
| API request/response shape | Consumer domain |
| Backend endpoint behavior | Frontend/mobile domain |
| Database schema/migration | All domains using that DB |
| Environment variables | `ops/` + consuming domain |
| Auth/authorization | All client domains |
| Shared types or generated clients | All importing domains |
| Docker/deploy/CI | `ops/` + deployed domain |
| Python↔Rust ZMQ bridge | `python/` + `rust/` |
| Rust↔Go metrics/health | `rust/` + `go/` |
| Go↔Next.js telemetry API | `go/` + `nextjs/` |
| iOS/Android manifest/deeplink | `ios/` + `android/` |

Do NOT read unrelated domain AGENTS files.

## Risk Classification

| Level | Examples | Action |
|---|---|---|
| **Low** | Docs, comments, UI text | Execute directly |
| **Medium** | Logic in one domain, isolated bug | Plan if ≥3 files |
| **High** | API contracts, DB schema, auth, deploy | Plan + rollback note |
| **Critical** | Secrets, production infra, migrations | Plan + user approval |

## Planning

**Skip plan**: ≤2 files, obvious fix, "add X like Y".

**Create plan** (≥3 files or unclear scope):

1. Grep to verify files exist BEFORE planning
2. Format: `Step N: [ACTION] [EXACT_PATH]` — What + Why
3. Limits: Low=no plan · Medium=max 3 steps · High=max 5 · Critical=max 8
4. Order: Schema → Logic → Interface → Wiring
5. Execute immediately (unless destructive)

**Forbidden steps**: ❌ Explore/read/review · ❌ Add tests unless asked · ❌ Refactor unrelated code · ❌ Update docs unless asked · ❌ Vague "update the component"

## Grep-Before-Read — STRICT

Before opening any source file >120 lines:

1. Use `grep`/`ripgrep` to locate exact symbol, function, type, config key, or error
2. Read ONLY 50-200 lines around the match
3. Default window: 50 lines · Max: 200 lines
4. Full-file read ONLY if file <120 lines or task explicitly requires it

**Forbidden**: Opening multiple files "to understand" · Reading unrelated examples · Inspecting wrong domains

## Forbidden Reads (NEVER open)

```
*.lock, go.sum            # Lock files — zero useful context
target/, build/, .next/   # Build artifacts
node_modules/, .gradle/   # Dependencies/cache
.kotlin/, __pycache__/    # Language cache
.idea/, .vercel/, .git/   # IDE/deploy/git internals
*.db, *.rvf, .DS_Store    # Binary/database files
*.tsbuildinfo             # TS build cache (861KB)
*.pem, *.key, .env*       # Secrets
CONTRIBUTING.md           # 36KB — read only if user asks
```

## Forbidden Writes (NEVER modify unless user explicitly asks)

Lock files · Generated files · Build artifacts · Binary files · Secrets · Database files · Vendor/dependency directories

## Output Discipline

1. **No pre-summaries** — just do it
2. **No full-file rewrites** — output only the changed block
3. **No repeating unchanged code** — diff only
4. **No explaining obvious steps** — be concise
5. **Skip confirmation** for obvious tasks — ask only when genuinely ambiguous

## Response Format

- **Changed**: files list
- **Why**: 1-line purpose
- **Validated**: command + result
- **Risk**: level + rollback if High/Critical

## Dependency Rules

Do NOT add dependencies unless: (1) existing deps can't solve it, (2) no duplication, (3) response explains why needed. Never update lock files unless task requires installation.

## Hard Rules

1. Stay in your domain — no cross-boundary reads/writes
2. No `find .` or `ls -R` from root — one directory level at a time
3. No exploratory reads — read only when you know why
4. Secrets stay untracked — never commit `.env`, keys, tokens
