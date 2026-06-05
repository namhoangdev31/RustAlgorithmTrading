# Development Agent

> **Scope**: `development/` only. Scratch/dev tools and experiments.

## Ownership

Scratch scripts, development utilities, experiment files.

## Forbidden Reads

`.git/`, test report caches, generated logs, binary files

## Forbidden Writes

Production code in other domains · Lock files · Build artifacts

## Standalone Rules

### Grep-Before-Read

Files >120 lines: grep first → read 50-200 lines. Never explore.

### Output

Diff only · No full rewrites · No pre-summaries

### Response

- **Changed**: files · **Why**: 1-line · **Validated**: result · **Risk**: level
