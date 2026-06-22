# Runtime Config

`ops/config/` contains checked-in runtime defaults only. Secrets stay in environment variables or platform secret stores.

## Files

- `system.json` - Active checked-in staging profile for tests and non-live defaults.
- `system.staging.json` - Managed SaaS staging profile with paper trading.
- `system.production.json` - Managed SaaS production profile with live trading safeguards.
- `risk_limits.toml` - Shared risk limits and circuit-breaker settings.
- `data_download.json` - Default historical data download request.

## Service Profile

The deployment stack mounts the selected profile as `/workspace/ops/config/system.json`:

```bash
TRADING_CONFIG_PROFILE=system.staging.json docker-compose -f ops/docker-compose.yml config
TRADING_CONFIG_PROFILE=system.production.json docker-compose -f ops/docker-compose.yml config
```

Production defaults to `system.production.json` when `TRADING_CONFIG_PROFILE` is not set. The `trading` Compose profile controls whether live trading services start; the web/control-plane core can serve developer and regular users without broker credentials.

The config metadata declares the managed SaaS posture, multi-tenant mode, supported audiences, public entrypoints, and private service roles.

## Network Assumptions

- ZMQ publishers bind on `0.0.0.0` inside their containers.
- ZMQ subscribers use Compose service DNS such as `market-data:5555`.
- Redis is an external managed dependency supplied through `REDIS_URL`; no single-instance Redis container is part of the production stack.
- Trading credentials are loaded from environment variables, not JSON.
- User-editable settings should be managed through the Go/Next.js control plane, then projected into runtime config by deployment automation.

## Production Gates

- `system.production.json` uses Alpaca SIP (`v2/sip`); the production account must have SIP data entitlement.
- The fields mapped by `rust/risk-manager/src/reload.rs` must match between `system*.json` and `risk_limits.toml`.
- `risk_limits.toml` is the reload source of truth, while `system.json` is the startup source of truth. A release is blocked if their mapped values diverge.

## Policy

- Do not commit API keys, broker account secrets, database URLs, auth secrets, or billing keys.
- Do not add Grafana, Prometheus, or dashboard config here.
- Do not make production config user-editable through direct file changes in a running service.
