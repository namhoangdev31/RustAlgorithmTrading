# Service Deployment

`ops/deployment/` stores production image definitions for the managed trading platform. The stack is intended to run as a hosted service for developers, traders, and regular users, not as a customer-run local project.

## Service Roles

- `nextjs-frontend` - Public SaaS portal, auth, billing, developer dashboard, trader dashboard, regular user experience.
- `edge-gateway` - Public edge ingress, route cache, WAF challenge, artifact routing, telemetry forwarding.
- `go-control-plane` - Private observability and control API for metrics, trades, health, and platform telemetry.
- `market-data` - Private Rust market data ingest and ZMQ publisher.
- `signal-bridge` - Private Rust/Python signal and feature bridge.
- `risk-manager` - Private Rust risk controls and circuit breakers.
- `execution-engine` - Private Rust order routing and execution.
- `redis` - Private route/cache backbone.

Only `nextjs-frontend` and `edge-gateway` publish ports. Everything else stays on the private Compose network and should be exposed only through the web/control-plane layer.

## Images

- `Dockerfile` - Generic Rust service image builder. Use `BIN` to choose `market-data`, `risk-manager`, `execution-engine`, or `signal-bridge`.
- `go.Dockerfile` - Go observability/control-plane image.
- `edge-gateway.Dockerfile` - Go edge gateway image.
- `nextjs.Dockerfile` - Next.js SaaS portal image.

## Required Runtime Secrets

Set these core secrets in the orchestrator secret store before rendering `ops/docker-compose.yml`:

- `DATABASE_URL` - Managed PostgreSQL for the SaaS portal and Go control plane.
- `AUTH_SECRET` - Auth.js/NextAuth signing secret.
- `NEXTAUTH_URL` - Public application URL.
- `APP_SECRETS_MASTER_KEY` - Application secret encryption key.
- `LEPOS_INTERNAL_API_KEY` - Internal API key shared by edge/control-plane calls.
- `LEPOS_SERVICE_SECRET` - Edge gateway service identity secret.
- `LEPOS_NATIVE_TELEMETRY_KEY` - Native telemetry signing key.
- `STRIPE_SECRET_KEY` and `STRIPE_CONNECT_WEBHOOK_SECRET` - Paid plans and billing webhooks.

Trader services run behind the `trading` profile. Set `ALPACA_API_KEY` and `ALPACA_SECRET_KEY` before enabling that profile for managed trader accounts.

Optional integrations include GitHub OAuth/app keys, Firebase public keys, Gemini diagnostics, object storage cache keys, and artifact mirror endpoints.

## Compose Deployment

Render the production stack from the repository root:

```bash
docker-compose -f ops/docker-compose.yml config
docker-compose -f ops/docker-compose.yml build
docker-compose -f ops/docker-compose.yml up -d
```

Use `TRADING_CONFIG_PROFILE=system.staging.json` for staging paper trading. Production defaults to `system.production.json`.

Enable trader services only when broker credentials, billing, and risk controls are ready:

```bash
COMPOSE_PROFILES=trading docker-compose -f ops/docker-compose.yml up -d
```

## Validation

- Docker syntax: `docker-compose -f ops/docker-compose.yml config`
- Rust metrics binding: `cd rust && cargo test -p common`
- Go image/runtime contract: `cd go && go test ./...`
- Next.js image/runtime contract: `cd nextjs && yarn typecheck`

## Rollback

Rollback is file-level: restore the previous `ops/docker-compose.yml`, deployment Dockerfiles, and config profile JSON from git, then redeploy the prior image tag with `IMAGE_TAG=<previous-tag>`.
