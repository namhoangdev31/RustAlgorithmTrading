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

## Go Edge Gateway Build

```bash
docker build -f ops/deployment/edge-gateway.Dockerfile -t trading/edge-gateway:local .
```

## Environment Variables Configuration (No Secrets Committed)

Configure the following environment keys in your production `.env` file or orchestrator:

- `REDIS_URL`: Redis connection URL for gateway routing and cache coordination (e.g., `redis://localhost:6379`).
- `LEPOS_INTERNAL_API_KEY`: API key for secure edge-to-control-plane internal endpoints.
- `LEPOS_CONTROL_PLANE_URL`: URL of the Next.js control plane (default: `http://localhost:3000`).
- `LEPOS_STORAGE_ROOT`: Absolute directory for local static bundle storage and server isolates.
- `GEMINI_API_KEY`: Google Gemini SDK API key for AI diagnostic endpoints.
- `ACME_DIRECTORY`: ACME staging or production directory endpoint for SSL/domain certificate provisioning.
- `LEPOS_FAILOVER_TARGETS`: Failover server/gateway routing coordinates (comma-separated).
- `LEPOS_SERVICE_ID`: Service identity used by the Go edge gateway when calling control-plane APIs.
- `LEPOS_SERVICE_SECRET`: Shared secret bound to the registered service identity for phased zero-trust rollout.
- `LEPOS_IPFS_GATEWAY_URL`: Preferred gateway base URL for `ipfs://` artifact mirror resolution.
- `LEPOS_ARWEAVE_GATEWAY_URL`: Preferred gateway base URL for `ar://` artifact mirror resolution.
- `LEPOS_CONTROL_PLANE_TLS_CERT`, `LEPOS_CONTROL_PLANE_TLS_KEY`, `LEPOS_CONTROL_PLANE_TLS_CA`: Optional client certificate, private key, and trust bundle used for mTLS between gateway and control-plane.

## Policy

- Do not add Compose orchestration back into this folder unless the project explicitly reintroduces it.
- Do not add Grafana/Prometheus config here. User-facing monitoring and configuration should be handled by the web/control-plane layer.
- Runtime config remains in `ops/config/`.
