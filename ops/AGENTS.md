# Ops Agent

Owns operational runtime files in `ops/`.

Use this agent for:

- `ops/config`: runtime config, risk limits, environment-specific settings
- `ops/scripts`: service lifecycle, data download, validation, maintenance
- `ops/deployment`: Docker, Compose, monitoring, staging, production

Validate shell changes with `bash -n` and the nearest dry run where available.

Coordinate config changes with all runtime agents.
