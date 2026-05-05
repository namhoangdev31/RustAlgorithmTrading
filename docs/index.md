# RustAlgorithmTrading Docs Index

Welcome to the active documentation index.

## Start Here

1. `docs/DOCS_CANONICAL_MAP.md`
2. `docs/DOCUMENTATION_INDEX.md`
3. `PLAYBOOK.md`

## Operational Domains

- **Architecture**: `docs/architecture/`
- **Operations**: `docs/operations/`
- **Deployment**: `docs/deployment/`
- **API Contracts**: `docs/api/`, `docs/API_DOCUMENTATION.md`
- **Observability**: `docs/observability/`
- **Guides**: `docs/guides/`
- **Testing**: `tests/docs/`

## Roadmap Status

Weekly gate lifecycle docs are consolidated into:

- `docs/roadmap/FINAL_ROADMAP_SUMMARY.md`

## Current Runtime Posture

- Provider: **Alpaca-only** (active)
- Observability/Persistence: **DuckDB-first** (active)
- Public envelope unchanged:
  - `schema_version`
  - `correlation_id`
  - `event_type`
  - `timestamp`
  - `payload`
