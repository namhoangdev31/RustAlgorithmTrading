# Data Agent

> **Scope**: `data/` only. Read-only domain — schemas and reference data.

## Ownership

Persistent data files, schemas, and data documentation used by other domains.

## Forbidden Reads

`.db`, `*.rvf`, `*.wal`, `*.sqlite`, binary assets, large parquet/CSV files

## Forbidden Writes

Binary data files · Database files · Lock files

## Cross-Domain

Data schema changes → verify with consuming domains (`rust/`, `go/`, `python/`).

## Standalone Rules

### Grep-Before-Read

Files >120 lines: grep first → read 50-200 lines. Never explore.

### Output

Diff only · No full rewrites · No pre-summaries

### Response

- **Changed**: files · **Why**: 1-line · **Validated**: result · **Risk**: level
