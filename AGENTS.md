# Root Agent — Routing & Token Discipline

> **First Rule**: Read ONLY the nearest domain `AGENTS.md`. Come here ONLY when the task spans 2+ domains.

## Route Table

| Task in… | Read ONLY | Validate |
|---|---|---|
| `python/` | `python/AGENTS.md` | `cd python && python -m pytest tests -q` |
| `rust/` | `rust/AGENTS.md` | `cd rust && cargo test --workspace` |
| `go/` | `go/AGENTS.md` | `cd go && go test ./...` |
| `nextjs/` | `nextjs/AGENTS.md` | `cd nextjs && yarn typecheck` |
| `ios/` | `ios/AGENTS.md` | Xcode build |
| `android/` | `android/AGENTS.md` | `cd android && ./gradlew test` |
| `ops/` | `ops/AGENTS.md` | `bash -n` + dry run |
| 2+ domains | This file + each domain's `AGENTS.md` | Each domain's validate |

## Cross-Domain Contracts

| Contract | Domains |
|---|---|
| Python↔Rust ZMQ signal | `python/`, `rust/` |
| Rust↔Go metrics/health | `rust/`, `go/` |
| Go↔Next.js telemetry API | `go/`, `nextjs/` |
| iOS/Android↔Go manifest | `ios/` or `android/`, `go/` |
| Ops config → all | `ops/` + affected domain |

## Risk Classification — MANDATORY

Before modifying files, classify the task:

| Level | Examples | Requirements |
|---|---|---|
| **Low** | Docs, comments, UI text, isolated style fix | Execute directly |
| **Medium** | Logic in one domain, local refactor, isolated bug | Plan if ≥3 files |
| **High** | API contracts, DB schema, auth, telemetry, deploy, shared config | Must include: impacted domains, files to inspect, validation cmd, rollback note |
| **Critical** | Secrets, production infra, migrations, permissions, payment/auth flows | Same as High + explicit user approval before execution |

## Impact Check — Before Editing

If ANY of these are affected, read the related domain's `AGENTS.md` before changing:

- API request/response shape → consumer domains
- Database schema/migration → all domains using that DB
- Environment variables → ops + consuming domains
- Auth/authorization → all client domains
- Shared types or generated clients → all importing domains
- Build/deploy process → ops + deployed domains

## No Silent Assumptions

Never assume without verifying in source:

- Package manager → check `pyproject.toml`, `Cargo.toml`, `go.mod`, `package.json`
- Runtime version → check config files
- API contract shape → grep for actual usage
- Database schema → read schema file
- Environment variable names → grep for actual references
- Auth provider behavior → read auth config

If uncertain, inspect the smallest reliable source first (config file, schema file, or existing usage).

## Dependency Change Rules

Do NOT add new dependencies unless:

1. Existing project dependencies cannot solve the task
2. The dependency does not duplicate existing functionality
3. The final response explains why the dependency is needed

Never update lock files unless the task explicitly requires dependency installation.

## Task Planning Protocol — MANDATORY

### When NOT to plan

Skip planning entirely and just execute when:

- Task changes ≤ 2 files AND you already know which files
- Task is a simple bug fix with a clear error message
- Task is "add X similar to existing Y" — just grep for Y and replicate

### When to plan

Create a plan ONLY when:

- Task changes ≥ 3 files or creates new files
- Task involves new feature with unclear scope
- User explicitly asks for a plan

### Plan creation rules

1. **Verify before plan.** BEFORE writing any plan:
   - Grep to confirm target files/functions EXIST
   - Check if the feature ALREADY exists (avoid re-implementation)
   - Identify the EXACT files that need changes (paths, not guesses)

2. **Plan format.** Every step MUST have:

   ```
   Step N: [ACTION] [EXACT_FILE_PATH]
   - What: [one line — what changes]
   - Why: [one line — why this step is needed]
   ```

3. **Size limits.**
   - Simple task (1 domain): MAX 5 steps
   - Medium task (1 domain, new feature): MAX 8 steps
   - Complex task (cross-domain): MAX 12 steps
   - If you need more steps, the task should be split into smaller tasks

4. **Forbidden plan steps.**
   - ❌ "Read/explore file X to understand Y" — do this BEFORE planning, not as a step
   - ❌ "Refactor/improve existing code" — unless user explicitly asked
   - ❌ "Add comprehensive error handling" — unless user explicitly asked
   - ❌ "Add tests" — unless user explicitly asked or it's a test task
   - ❌ "Update documentation" — unless user explicitly asked
   - ❌ "Review/audit" as a step — that's not a plan step, it's procrastination
   - ❌ Vague steps like "update the component" — WHICH component? WHICH file?

5. **Step ordering.**

   ```
   1. Data/schema changes FIRST (models, types, DB)
   2. Core logic SECOND (business logic, services)
   3. Interface THIRD (UI, API endpoints, CLI)
   4. Wiring LAST (imports, routing, config)
   ```

6. **No scope creep.** Plan ONLY what the user asked. Never add:
   - Performance optimizations the user didn't request
   - Code cleanup/refactoring beyond the task scope
   - "Nice to have" features
   - Extra tests/docs beyond what's needed

### Plan anti-patterns (NEVER do)

```
❌ BAD PLAN:
  Step 1: Read src/ directory to understand project structure
  Step 2: Analyze existing patterns
  Step 3: Create a design document
  Step 4: Implement the feature
  Step 5: Add comprehensive error handling
  Step 6: Write unit tests
  Step 7: Write integration tests
  Step 8: Update documentation
  Step 9: Refactor related code
  Step 10: Final review

✅ GOOD PLAN:
  Step 1: ADD python/src/api/binance_client.py
  - What: New Binance API client following alpaca_client.py pattern
  - Why: User needs Binance support

  Step 2: EDIT python/src/api/__init__.py
  - What: Export BinanceClient
  - Why: Make it importable

  Step 3: EDIT python/src/strategies/router.py
  - What: Add Binance to broker routing switch
  - Why: Connect new client to strategy execution
```

### Execution rules

1. **Execute immediately after plan.** Don't wait for approval unless the plan has destructive actions (deleting files, dropping tables, etc.)
2. **One file at a time.** Complete each file change fully before moving to the next.
3. **Validate after each logical group.** Don't wait until the end to test.
4. **If a step fails, stop and report.** Don't continue with a broken foundation.

### Definition of Done

A task is complete ONLY when:

1. Changes stay within declared ownership scope
2. No forbidden paths were read or modified
3. Smallest relevant validation command was run (or reason for skipping stated)
4. Cross-domain contracts checked if APIs/configs/schemas/auth/deploy were touched

### Final Response Standard

Every task response must include:

- **Changed**: list of files changed
- **Why**: purpose of the change (1 line)
- **Validated**: command run and result
- **Risk**: Low/Medium/High/Critical + rollback note if High/Critical

Keep responses concise. No long explanations unless the task requires it.

## Token Discipline — MANDATORY

### Reading Rules

1. **Grep before read.** Use `grep`/`ripgrep` to find the exact file+line FIRST. Never open a file "to explore."
2. **Max 200 lines per read.** If a file is larger, read only the section you need (use StartLine/EndLine).
3. **Never read lock files.** `Cargo.lock`, `uv.lock`, `yarn.lock`, `package-lock.json`, `go.sum` — ZERO useful context.
4. **Never read build artifacts.** `target/`, `build/`, `.next/`, `node_modules/`, `.gradle/`, `.kotlin/`, `__pycache__/`.
5. **Never read binary files.** Compiled binaries, `.db`, `.rvf`, `.DS_Store`.
6. **Never read generated files.** `tsconfig.tsbuildinfo`, coverage reports, `.idea/`.
7. **One directory level at a time.** Use `ls <specific-folder>/`, never `ls -R` or `find . -type f`.

### Writing Rules

1. **Respond concisely.** Don't re-state unchanged code. Show only the diff or the new/changed part.
2. **No summaries of what you're about to do.** Just do it.
3. **Skip confirmation for obvious tasks.** Ask only when genuinely ambiguous.
4. **Targeted tests.** Run the specific test file, not the full suite, unless asked.

### Decision Flowchart

```
Task received →
  1. Which domain folder? → Read ONLY that domain's AGENTS.md
  2. Classify risk level (Low/Medium/High/Critical)
  3. Need to find a symbol/function? → grep/ripgrep first
  4. Found the file? → Read ONLY the relevant 50-200 lines
  5. Simple task (≤2 files)? → Skip planning, just execute
  6. Complex task (≥3 files)? → Create plan (follow Planning Protocol)
  7. Need cross-domain? → Read this root file + other domain's AGENTS.md
  8. Execute → Validate → Report (Changed/Why/Validated/Risk)
```

## Global Forbidden Paths (NEVER read)

```
*.lock               # Cargo.lock, uv.lock, yarn.lock, go.sum
target/              # Rust build
build/               # Android/Gradle build
.next/               # Next.js build
node_modules/        # npm/yarn
.gradle/             # Gradle cache
.kotlin/             # Kotlin cache
__pycache__/         # Python cache
.idea/               # JetBrains IDE
.vercel/             # Vercel cache
.git/                # Git internals
*.db                 # Database files
*.rvf                # Agent DB files
.DS_Store            # macOS
*.tsbuildinfo        # TS build info
CONTRIBUTING.md      # 36KB — too large, read only if user asks about contributing
```

## Hard Rules

1. **Stay in your domain.** Do not read/write files outside the task's domain folder.
2. **No full-tree scans.** Never `find .` or `ls -R` from root.
3. **No exploratory reads.** Read a file only when you know why you need it.
4. **Root is coordination only.** Allowed root files: `README.md`, `README_VI.md`, `PLAYBOOK.md`, `AGENTS.md`, `LICENSE`, `.gitignore`, `.github/`.
5. **Secrets stay untracked.** Never commit `.env`, `.env.local`, keys, tokens.
