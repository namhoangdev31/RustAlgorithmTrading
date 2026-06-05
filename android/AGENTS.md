# Android Agent

> **Scope**: `android/` only. Do NOT read files outside this directory.

## Ownership

| Path | Purpose |
|---|---|
| `app/` | Main module (Kotlin, Compose UI, resources) |
| `gradle/` | Gradle wrapper and version catalog |
| `build.gradle.kts` | Root build script |
| `settings.gradle.kts` | Module settings |

## Read First

- `build.gradle.kts` or `gradle/libs.versions.toml` for dependencies
- `app/src/main/` for source code

## Validate

```bash
cd android && ./gradlew test
```

Targeted: `./gradlew :app:testDebugUnitTest --tests "com.example.TestClass"`
Tech: Kotlin · Jetpack Compose · Gradle (Kotlin DSL) · Material 3

## Common Tasks

| Task | Do this | Don't |
|---|---|---|
| Add screen | Grep `app/src/main/` for similar composable | Read entire app |
| Add dependency | Read `build.gradle.kts` or `libs.versions.toml` | Read `.gradle/` |
| Fix build | Read Gradle error → open specific file | Scan full project |
| Add resource | Read specific `app/src/main/res/` type | Read all resources |

## Forbidden Reads

```
build/                # Gradle build output
.gradle/              # Gradle cache
.kotlin/              # Kotlin cache
.idea/                # IDE config
local.properties      # Local SDK path
gradlew, gradlew.bat  # Wrapper boilerplate
.gitignore            # Already known
```

## Forbidden Writes

Build output · Gradle cache · IDE config · Wrapper scripts · Lock files

## Cross-Domain Triggers

- Changing runtime capabilities → also read `ios/AGENTS.md`
- Changing API consumption → also read `go/AGENTS.md`

## Standalone Rules

### Risk

| Level | Action |
|---|---|
| Low (docs, UI text, string resource) | Execute directly |
| Medium (composable, ViewModel, navigation) | Plan if ≥3 files |
| High (API, auth, Gradle config, manifest) | Plan + rollback note |
| Critical (secrets, signing, permissions, ProGuard) | Plan + user approval |

### Planning (≥3 files)

1. Grep first · Step format: `Step N: [ACTION] [PATH]` — What + Why
2. Max 3 steps (medium) · 5 (high) · 8 (critical)
3. ❌ No explore/review steps · ❌ No scope creep · ❌ No unrequested tests/docs
4. Order: Model → ViewModel/Repository → UI → Navigation/DI · Execute immediately

### Grep-Before-Read

Files >120 lines: grep first → read 50-200 lines around match.
Files <120 lines: may read full file.
Never open files "to explore." Use `build.gradle.kts` for deps, not `.gradle/`.

### Output

1. Diff only — no full rewrites, no unchanged code
2. Keep files <500 lines — split when larger
3. Reuse helpers — check existing utils before writing new
4. No pre-summaries — just execute

### Response

- **Changed**: files · **Why**: 1-line · **Validated**: cmd + result · **Risk**: level
