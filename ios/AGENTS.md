# iOS Agent

> **Scope**: `ios/` only. Do NOT read files outside this directory.

## Ownership

| Path | Purpose |
|---|---|
| `iosApp/` | Main SwiftUI app (views, services, models, navigation) |
| `Configuration/` | Build configuration and settings |
| `iosApp.xcodeproj/` | Xcode project (read `project.pbxproj` only when fixing build) |

## Read First

- `iosApp/` structure for views and services
- `Package.swift` or SPM config for dependencies

## Validate

Build and test via Xcode scheme or `swift test` for package targets.
Tech: SwiftUI · Swift Package Manager · iOS 17+

## Common Tasks

| Task | Do this | Don't |
|---|---|---|
| Add view | Grep `iosApp/` for similar view | Read entire app |
| Add service | Grep `Service\|Manager` in `iosApp/` | Scan all files |
| Fix build | Read Xcode error → open specific file | Open project.pbxproj |

## Forbidden Reads

```
iosApp.xcodeproj/     # Binary-ish project file
ruvector.db           # 1.5MB database
agentdb.rvf           # Agent DB
agentdb.rvf.lock      # Lock file
DerivedData/          # Xcode build artifacts
.idea/                # IDE config
.DS_Store             # macOS
```

## Forbidden Writes

Database files · Lock files · Xcode project (unless fixing build config) · IDE config

## Cross-Domain Triggers

- Changing runtime capabilities → also read `android/AGENTS.md`
- Changing API consumption → also read `go/AGENTS.md`

## Standalone Rules

### Risk

| Level | Action |
|---|---|
| Low (docs, UI text) | Execute directly |
| Medium (view logic, service, navigation) | Plan if ≥3 files |
| High (API, auth, build config, capabilities) | Plan + rollback note |
| Critical (secrets, keychain, entitlements) | Plan + user approval |

### Planning (≥3 files)

1. Grep first · Step format: `Step N: [ACTION] [PATH]` — What + Why
2. Max 3 steps (medium) · 5 (high) · 8 (critical)
3. ❌ No explore/review steps · ❌ No scope creep · ❌ No unrequested tests/docs
4. Order: Model → Service → View → Navigation · Execute immediately

### Grep-Before-Read

Files >120 lines: grep first → read 50-200 lines around match.
Files <120 lines: may read full file.
Never open files "to explore."

### Output

1. Diff only — no full rewrites, no unchanged code
2. Keep files <500 lines — split when larger
3. Reuse helpers — check existing services before writing new
4. No pre-summaries — just execute

### Response

- **Changed**: files · **Why**: 1-line · **Validated**: build/test result · **Risk**: level
