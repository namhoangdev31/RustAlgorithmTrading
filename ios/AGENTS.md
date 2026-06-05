# iOS Agent

> **Scope**: `ios/` only. Do NOT read files outside this directory.

## Ownership

| Path | Purpose |
|---|---|
| `iosApp/` | Main SwiftUI application (views, services, models, navigation) |
| `Configuration/` | Build configuration and settings |
| `iosApp.xcodeproj/` | Xcode project (read only `project.pbxproj` when needed) |

## Tech Stack

SwiftUI · Swift Package Manager · iOS 17+

## Validate

Build and test via the nearest Xcode scheme or `swift test` for package targets.

## Common Tasks

| Task | Do this | Don't do this |
|---|---|---|
| Add view | Read `iosApp/` → grep for similar view | Read entire app |
| Add service | Read `iosApp/` → grep `Service\|Manager` | Scan all files |
| Fix build | Read Xcode error → open specific file | Open project.pbxproj |

## Forbidden Paths (NEVER read)

```
iosApp.xcodeproj/     # Xcode project — binary-ish, rarely useful to read fully
ruvector.db           # 1.5MB database file
agentdb.rvf           # Agent DB file
agentdb.rvf.lock      # Lock file
.DS_Store             # macOS metadata
.idea/                # IDE config
DerivedData/          # Xcode build artifacts
```

## Cross-Domain (only when task requires)

- **iOS↔Android manifest**: Changing runtime capabilities → also read `android/AGENTS.md`
- **iOS↔Go API**: Changing API consumption → also read `go/AGENTS.md`

## Anti-Patterns

- ❌ Do NOT scan sibling directories (`android/`, `nextjs/`, `python/`, etc.)
- ❌ Do NOT read `PLAYBOOK.md` or root `AGENTS.md` for single-domain tasks
- ❌ Do NOT read `.db` or `.rvf` files
- ❌ Do NOT read `xcodeproj` contents unless fixing build configuration

## Standalone Rules (when root AGENTS.md is not available)

### Risk Classification

| Level | Examples | Action |
|---|---|---|
| Low | Docs, comments, UI text, style fix | Execute directly |
| Medium | View logic, service change, navigation | Plan if ≥3 files |
| High | API contracts, auth, build config, capabilities | Plan + impacted files + rollback note |
| Critical | Secrets, keychain, entitlements, permissions | Plan + user approval required |

### Planning (≥3 files)

1. **Grep first** to verify files exist before planning
2. Each step: `Step N: [ACTION] [EXACT_PATH]` with What + Why
3. Max 5 steps (single domain) · Max 8 steps (new feature)
4. ❌ No "explore/read/review" steps · ❌ No scope creep · ❌ No unrequested tests/docs
5. Order: Model → Service → View → Navigation
6. Execute immediately after plan (unless destructive)

### Token Discipline

#### Reading Rules
1. **Grep before read** — find exact file+line first, never explore
2. **Max 200 lines per read** — use StartLine/EndLine for large files
3. **Never read**: `.db`, `.wal`, `.rvf`, `xcodeproj/`, `DerivedData/`, `.idea/`
4. **No assumptions** — verify Swift package deps, API shapes, build settings in source

#### Writing / Coding Rules
1. **Respond concisely**: Do not restate unchanged code. Show only the diff or modified parts.
2. **Keep files small**: Limit modules to ~500 lines. Split logic early to minimize future read tokens.
3. **Targeted edits only**: Modify only the lines needed for the fix. Avoid formatting unrelated code.
4. **No full-file overwrites**: Use precise block replacements instead of rewriting entire files.
5. **Reuse existing helpers**: Check if utility functions exist before implementing new ones.

### Response Format

- **Changed**: files list · **Why**: 1-line purpose · **Validated**: build/test result · **Risk**: level + rollback if High/Critical
