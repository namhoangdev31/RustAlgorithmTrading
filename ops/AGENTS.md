# Ops Agent

Owns operational runtime files in `ops/`.

Use this agent for:

- `ops/config`: runtime config, risk limits, environment-specific settings
- `ops/scripts`: minimal service lifecycle, data download, validation, backtest helpers
- `ops/deployment`: Docker image definitions only

Validate shell changes with `bash -n` and the nearest dry run where available.

Coordinate config changes with all runtime agents.

Do not reintroduce Docker Compose, Grafana, Prometheus, or Alertmanager here unless explicitly requested.
