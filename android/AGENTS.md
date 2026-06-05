# Android Agent

> **Scope**: `android/` only. Do NOT read files outside this directory.

## Ownership

| Path | Purpose |
|---|---|
| `app/` | Main application module (Kotlin source, Compose UI, resources) |
| `gradle/` | Gradle wrapper and version catalog |
| `build.gradle.kts` | Root build script |
| `settings.gradle.kts` | Module settings |
| `gradle.properties` | Build properties |

## Tech Stack

Kotlin · Jetpack Compose · Gradle (Kotlin DSL) · Material 3

## Validate

```bash
cd android && ./gradlew test
```

Targeted: `./gradlew :app:testDebugUnitTest --tests "com.example.TestClass"`

## Common Tasks

| Task | Do this | Don't do this |
|---|---|---|
| Add screen | Read `app/src/main/` → grep for similar composable | Read entire app |
| Add dependency | Read `build.gradle.kts` or `gradle/libs.versions.toml` | Read `.gradle/` cache |
| Fix build | Read Gradle error → open specific file | Scan full project |
| Add resource | Read `app/src/main/res/` → specific resource type | Read all resources |

## Forbidden Paths (NEVER read)

```
build/                # Gradle build output
.gradle/              # Gradle cache
.kotlin/              # Kotlin cache
.idea/                # IDE config
local.properties      # Local SDK path (machine-specific)
gradlew               # Wrapper script (8.7KB boilerplate)
gradlew.bat           # Windows wrapper
.gitignore            # Already known
```

## Cross-Domain (only when task requires)

- **Android↔iOS manifest**: Changing runtime capabilities → also read `ios/AGENTS.md`
- **Android↔Go API**: Changing API consumption → also read `go/AGENTS.md`

## Anti-Patterns

- ❌ Do NOT scan sibling directories (`ios/`, `nextjs/`, `python/`, etc.)
- ❌ Do NOT read `PLAYBOOK.md` or root `AGENTS.md` for single-domain tasks
- ❌ Do NOT read `build/`, `.gradle/`, or `.kotlin/` directories
- ❌ Do NOT read `local.properties` (contains local SDK path only)
- ❌ Do NOT read `gradlew` or `gradlew.bat` (boilerplate wrapper scripts)

## Standalone Rules (when root AGENTS.md is not available)

### Risk Classification

| Level | Examples | Action |
|---|---|---|
| Low | Docs, comments, UI text, string resource | Execute directly |
| Medium | Composable logic, ViewModel, navigation | Plan if ≥3 files |
| High | API contracts, auth, Gradle config, manifest | Plan + impacted files + rollback note |
| Critical | Secrets, signing config, permissions, ProGuard | Plan + user approval required |

### Planning (≥3 files)

1. **Grep first** to verify files exist before planning
2. Each step: `Step N: [ACTION] [EXACT_PATH]` with What + Why
3. Max 5 steps (single domain) · Max 8 steps (new feature)
4. ❌ No "explore/read/review" steps · ❌ No scope creep · ❌ No unrequested tests/docs
5. Order: Model → ViewModel/Repository → UI → Navigation/DI
6. Execute immediately after plan (unless destructive)

### Token Discipline

#### Reading Rules
1. **Grep before read** — find exact file+line first, never explore
2. **Max 200 lines per read** — use StartLine/EndLine for large files
3. **Never read**: `build/`, `.gradle/`, `.kotlin/`, `gradlew`, `local.properties`
4. **No assumptions** — verify deps in `build.gradle.kts` or `libs.versions.toml`

#### Writing / Coding Rules
1. **Respond concisely**: Do not restate unchanged code. Show only the diff or modified parts.
2. **Keep files small**: Limit modules to ~500 lines. Split logic early to minimize future read tokens.
3. **Targeted edits only**: Modify only the lines needed for the fix. Avoid formatting unrelated code.
4. **No full-file overwrites**: Use precise block replacements instead of rewriting entire files.
5. **Reuse existing helpers**: Check if utility functions exist before implementing new ones.

### Response Format

- **Changed**: files list · **Why**: 1-line purpose · **Validated**: command + result · **Risk**: level + rollback if High/Critical
