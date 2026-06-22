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
- Managed Redis - External Multi-AZ route/cache backbone supplied through `REDIS_URL`.

Only `edge-gateway` publishes host ports. `nextjs-frontend` is reachable only through the private network so public traffic cannot bypass edge WAF, service identity, or certificate handling.

## Images

- `Dockerfile` - Generic Rust service image builder. Use `BIN` to choose `market-data`, `risk-manager`, `execution-engine`, or `signal-bridge`.
- `go.Dockerfile` - Go observability/control-plane image.
- `edge-gateway.Dockerfile` - Go edge gateway image.
- `nextjs.Dockerfile` - Next.js SaaS portal image.

## Required Runtime Secrets

Set these core secrets in the orchestrator secret store before rendering `ops/docker-compose.yml`:

- `DATABASE_URL` - Managed PostgreSQL for the SaaS portal and Go control plane.
- `REDIS_URL` - TLS-enabled managed Redis endpoint with replication/failover.
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

The `database-migrate` one-shot service runs `prisma migrate deploy` before `nextjs-frontend` starts. A production release must include tracked files under `nextjs/prisma/migrations/`; the current repository has the migration path configured but no tracked migration files.

Enable trader services only when broker credentials, billing, and risk controls are ready:

```bash
COMPOSE_PROFILES=trading docker-compose -f ops/docker-compose.yml up -d
```

## Validation

- Docker syntax: `docker-compose -f ops/docker-compose.yml config`
- Next.js production build: `cd nextjs && yarn build`
- Rust metrics binding: `cd rust && cargo test -p common`
- Go image/runtime contract: `cd go && go test ./...`
- Next.js image/runtime contract: `cd nextjs && yarn typecheck`

## Rollback

Rollback is file-level: restore the previous `ops/docker-compose.yml`, deployment Dockerfiles, Next.js config, and runtime config from git, then redeploy the prior image tag with `IMAGE_TAG=<previous-tag>`. Database migrations require a forward-fix migration or an explicitly reviewed Prisma rollback procedure; image rollback alone does not revert schema changes.
