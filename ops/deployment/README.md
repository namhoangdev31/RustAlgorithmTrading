# Docker Images

`ops/deployment/` now stores Docker image definitions only. Docker Compose, Grafana, Prometheus, Alertmanager, and staging monitoring bundles were removed to keep operations focused and easy to read.

## Images

- `Dockerfile` - Generic Rust service image builder. Use `BIN` to choose a Rust binary.
- `go.Dockerfile` - Go control-plane image builder.

## Rust Service Build

From the repository root:

```bash
docker build -f ops/deployment/Dockerfile --build-arg BIN=market-data -t trading/market-data:local .
docker build -f ops/deployment/Dockerfile --build-arg BIN=risk-manager -t trading/risk-manager:local .
docker build -f ops/deployment/Dockerfile --build-arg BIN=execution-engine -t trading/execution-engine:local .
docker build -f ops/deployment/Dockerfile --build-arg BIN=signal-bridge -t trading/signal-bridge:local .
```

## Go Control Plane Build

```bash
docker build -f ops/deployment/go.Dockerfile -t trading/go-control-plane:local .
```

## Policy

- Do not add Compose orchestration back into this folder unless the project explicitly reintroduces it.
- Do not add Grafana/Prometheus config here. User-facing monitoring and configuration should be handled by the web/control-plane layer.
- Runtime config remains in `ops/config/`.
