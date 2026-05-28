# Deployment Guide: Docker-First Workspace

**Status:** Active ops standard after cleanup

## Overview

The repository no longer stores Docker Compose, Grafana, Prometheus, or Alertmanager bundles. Deployment is image-first:

1. Build Rust service images from `ops/deployment/Dockerfile`.
2. Build the Go control-plane image from `ops/deployment/go.Dockerfile`.
3. Wire orchestration outside this repo, or through the future web-managed deployment/config surface.

## Services

| Service | Runtime | Image source |
|---|---|---|
| Market Data | Rust | `ops/deployment/Dockerfile` with `BIN=market-data` |
| Signal Bridge | Rust | `ops/deployment/Dockerfile` with `BIN=signal-bridge` |
| Risk Manager | Rust | `ops/deployment/Dockerfile` with `BIN=risk-manager` |
| Execution Engine | Rust | `ops/deployment/Dockerfile` with `BIN=execution-engine` |
| Go Control Plane | Go | `ops/deployment/go.Dockerfile` |

## Build Examples

```bash
docker build -f ops/deployment/Dockerfile --build-arg BIN=market-data -t trading/market-data:local .
docker build -f ops/deployment/Dockerfile --build-arg BIN=signal-bridge -t trading/signal-bridge:local .
docker build -f ops/deployment/Dockerfile --build-arg BIN=risk-manager -t trading/risk-manager:local .
docker build -f ops/deployment/Dockerfile --build-arg BIN=execution-engine -t trading/execution-engine:local .
docker build -f ops/deployment/go.Dockerfile -t trading/go-control-plane:local .
```

## Runtime Config

- Config files live in `ops/config/`.
- Secrets come from environment variables or platform secret stores.
- User-facing configuration should be implemented in the Go/Next.js web layer, not as ops-side monitoring/config bundles.

## Local Native Fallback

For local development only:

```bash
bash ops/scripts/start_services.sh
bash ops/scripts/health_check.sh
bash ops/scripts/stop_services.sh
```
