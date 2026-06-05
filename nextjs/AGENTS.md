# Next.js Agent

> **Scope**: `nextjs/` only. Do NOT read files outside this directory.

## Ownership

| Path | Purpose |
|---|---|
| `app/` | App Router pages, server actions, auth, i18n routes |
| `components/` | UI, admin, telemetry, config, layout components |
| `lib/` | Shared utilities, Firebase client, API helpers |
| `prisma/` | Prisma schema and generated client |
| `hooks/` | Custom React hooks |
| `i18n/`, `messages/` | Internationalization config and translations |
| `public/` | Static assets |
| `firebase/` | Firebase config and rules |
| `types/` | TypeScript type definitions |

## Read First

- `package.json` for dependencies
- `prisma/schema.prisma` for data model
- `types/` for shared TypeScript types
- `DESIGN.md` — ONLY for UI/styling tasks (21KB, skip for non-UI)

## Validate

```bash
cd nextjs && yarn typecheck
```

Tech: Next.js App Router · TypeScript strict · Tailwind CSS · Auth.js + Firebase · Prisma · Vercel

## Common Tasks

| Task | Do this | Don't |
|---|---|---|
| Add page | Grep `app/` for similar route | Read all of `app/` |
| Add component | Grep `components/` for similar | Read full tree |
| Auth change | Grep `auth\|session` in `lib/` | Read Firebase docs inline |
| Prisma change | Read `prisma/schema.prisma` only | Read Prisma node_modules |
| i18n string | Read specific `messages/<locale>.json` | Read all locales |
| UI/styling | Read `DESIGN.md` + `tailwind.config.ts` | Guess tokens |

## Forbidden Reads

```
node_modules/         # 1.3GB
.next/                # 1.3GB build output
yarn.lock             # 413KB
tsconfig.tsbuildinfo  # 861KB
.vercel/              # Vercel cache
.idea/                # IDE config
*.pem                 # Private keys
skills-lock.json      # AI skills lock
.DS_Store             # macOS
```

## Forbidden Writes

Lock files · Build output · Generated Prisma client · node_modules · Secret keys

## Cross-Domain Triggers

- Changing API consumption → also read `go/AGENTS.md`
- Changing deployment → also read `ops/AGENTS.md`

## Standalone Rules

### Risk

| Level | Action |
|---|---|
| Low (docs, UI text, style) | Execute directly |
| Medium (component, page, hook) | Plan if ≥3 files |
| High (auth, Prisma schema, API, i18n) | Plan + rollback note |
| Critical (secrets, Firebase rules, payments) | Plan + user approval |

### Planning (≥3 files)

1. Grep first · Step format: `Step N: [ACTION] [PATH]` — What + Why
2. Max 3 steps (medium) · 5 (high) · 8 (critical)
3. ❌ No explore/review steps · ❌ No scope creep · ❌ No unrequested tests/docs
4. Order: Schema → Logic → Component → Wiring · Execute immediately

### Grep-Before-Read

Files >120 lines: grep first → read 50-200 lines around match.
Files <120 lines: may read full file.
Never open files "to explore." Use `package.json` for deps, not `yarn.lock`.

### Output

1. Diff only — no full rewrites, no unchanged code
2. Keep files <500 lines — split when larger
3. Server components by default — client only when needed
4. No pre-summaries — just execute

### Response

- **Changed**: files · **Why**: 1-line · **Validated**: cmd + result · **Risk**: level
