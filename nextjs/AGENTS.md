# Next.js Agent

> **Scope**: `nextjs/` only. Do NOT read files outside this directory.

## Ownership

| Path | Purpose |
|---|---|
| `app/` | App Router pages, server actions, auth handlers, i18n routes |
| `components/` | UI, admin, telemetry, config, layout components |
| `lib/` | Shared utilities, Firebase client, API helpers |
| `prisma/` | Prisma schema and generated client |
| `hooks/` | Custom React hooks |
| `i18n/` | Internationalization config |
| `messages/` | Translation files (JSON) |
| `public/` | Static assets (images, fonts) |
| `firebase/` | Firebase config and rules |
| `types/` | TypeScript type definitions |

## Tech Stack

Next.js App Router · TypeScript · Tailwind CSS · Auth.js + Firebase · Prisma · Vercel

## Validate

```bash
cd nextjs && yarn typecheck
```

## Style

- TypeScript strict mode
- Components: functional with hooks
- Styling: Tailwind CSS utilities (see `tailwind.config.ts` for custom tokens)
- Data: Server components by default, client components only when needed
- Forms: Server actions preferred

## Common Tasks

| Task | Do this | Don't do this |
|---|---|---|
| Add page | Read `app/` → find similar route → follow pattern | Read all of `app/` |
| Add component | Read `components/` → grep for similar | Read full components tree |
| Auth change | Read `lib/` → grep `auth\|session` | Read Firebase docs inline |
| Prisma change | Read `prisma/schema.prisma` only | Read Prisma node_modules |
| i18n string | Read `messages/<locale>.json` | Read all locale files |
| UI/styling | Read `DESIGN.md` + `tailwind.config.ts` | Guess design tokens |

## Design Reference

Read `DESIGN.md` (21KB) ONLY when doing UI/styling work. It contains: colors, typography, spacing, component specs. For non-UI tasks, skip it entirely.

## Forbidden Paths (NEVER read)

```
node_modules/         # Dependency tree — never read
.next/                # Build output
yarn.lock             # 413KB — zero useful context
tsconfig.tsbuildinfo  # 861KB — TS incremental build cache
.vercel/              # Vercel cache
.DS_Store             # macOS metadata
.idea/                # IDE config
*.pem                 # Private keys (security!)
skills-lock.json      # AI skills lock
```

## Cross-Domain (only when task requires)

- **Next.js↔Go API**: Changing API consumption → also read `go/AGENTS.md`
- **Next.js↔Ops deploy**: Changing deployment → also read `ops/AGENTS.md`

## Anti-Patterns

- ❌ Do NOT scan sibling directories (`python/`, `rust/`, `go/`, etc.)
- ❌ Do NOT read `PLAYBOOK.md` or root `AGENTS.md` for single-domain tasks
- ❌ Do NOT read `DESIGN.md` (21KB) unless doing UI/styling work
- ❌ Do NOT read `yarn.lock` (413KB) or `node_modules/`
- ❌ Do NOT read `tsconfig.tsbuildinfo` (861KB)
- ❌ Do NOT read `.pem` files (security risk)
- ❌ Do NOT `ls -R nextjs/` — navigate to the specific folder

## Standalone Rules (when root AGENTS.md is not available)

### Risk Classification

| Level | Examples | Action |
|---|---|---|
| Low | Docs, comments, UI text, style fix | Execute directly |
| Medium | Component logic, page change, hook | Plan if ≥3 files |
| High | Auth, Prisma schema, API contracts, i18n structure | Plan + impacted files + rollback note |
| Critical | Secrets, Firebase rules, payment flows | Plan + user approval required |

### Planning (≥3 files)

1. **Grep first** to verify files exist before planning
2. Each step: `Step N: [ACTION] [EXACT_PATH]` with What + Why
3. Max 5 steps (single domain) · Max 8 steps (new feature)
4. ❌ No "explore/read/review" steps · ❌ No scope creep · ❌ No unrequested tests/docs
5. Order: Schema → Logic → Interface → Wiring
6. Execute immediately after plan (unless destructive)

### Token Discipline

#### Reading Rules
1. **Grep before read** — find exact file+line first, never explore
2. **Max 200 lines per read** — use StartLine/EndLine for large files
3. **Never read**: `yarn.lock` (413KB), `node_modules/`, `.next/`, `tsconfig.tsbuildinfo` (861KB), `.pem`
4. **No assumptions** — verify package versions in `package.json`, types in `types/`, schema in `prisma/`

#### Writing / Coding Rules
1. **Respond concisely**: Do not restate unchanged code. Show only the diff or modified parts.
2. **Keep files small**: Limit modules to ~500 lines. Split logic early to minimize future read tokens.
3. **Targeted edits only**: Modify only the lines needed for the fix. Avoid formatting unrelated code.
4. **No full-file overwrites**: Use precise block replacements instead of rewriting entire files.
5. **Reuse existing helpers**: Check if utility functions exist before implementing new ones.

### Response Format

- **Changed**: files list · **Why**: 1-line purpose · **Validated**: command + result · **Risk**: level + rollback if High/Critical
