# Documentation Hub (Production-First)

This directory contains active operational documentation for RustAlgorithmTrading.

## What Changed

- Weekly roadmap artifacts were removed from active docs.
- Historical legacy docs were removed from active tree.
- Documentation now follows a static operational model.

## Read Order

1. `docs/DOCS_CANONICAL_MAP.md`
2. `docs/DOCUMENTATION_INDEX.md`
3. `docs/index.md`
4. `PLAYBOOK.md`

## Core Areas

- Architecture: `docs/architecture/`
- API and contracts: `docs/api/`, `docs/API_DOCUMENTATION.md`
- Operations: `docs/operations/`
- Deployment: `docs/deployment/`
- Observability: `docs/observability/`
- Guides: `docs/guides/`

## Roadmap Consolidation

All lifecycle weekly documents are consolidated in:

- `docs/roadmap/FINAL_ROADMAP_SUMMARY.md`

## Conventions

- Use `[REPO_ROOT]/...` or repo-relative paths in examples.
- Treat Alpaca as active provider in runtime docs.
- Treat DuckDB-first posture as active observability/persistence stance.
- Mark non-active alternatives explicitly as `future/non-active`.
