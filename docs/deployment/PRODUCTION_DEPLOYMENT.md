# Production Deployment

Production deployment is now Docker-image-first. The repository no longer stores Docker Compose orchestration, Grafana, Prometheus, or Alertmanager config. Platform orchestration should be managed outside this repo, while user-facing runtime configuration should move into the Go/Next.js web layer.

## Build Images

```bash
docker build -f ops/deployment/Dockerfile --build-arg BIN=market-data -t trading/market-data:prod .
docker build -f ops/deployment/Dockerfile --build-arg BIN=signal-bridge -t trading/signal-bridge:prod .
docker build -f ops/deployment/Dockerfile --build-arg BIN=risk-manager -t trading/risk-manager:prod .
docker build -f ops/deployment/Dockerfile --build-arg BIN=execution-engine -t trading/execution-engine:prod .
docker build -f ops/deployment/go.Dockerfile -t trading/go-control-plane:prod .
```

## Runtime Configuration

- Use `ops/config/system.production.json` and `ops/config/risk_limits.toml` as the checked-in baseline.
- Inject secrets through the production platform secret manager.
- Keep `.env` local-only and untracked.
- Move user-editable config to the web/API layer rather than adding ops-side dashboard/config files.

## Native Fallback

Native local execution remains available for debugging only:

```bash
TRADING_ENV=production bash ops/scripts/start_services.sh
bash ops/scripts/health_check.sh
bash ops/scripts/stop_services.sh
```

## Production Checklist

- [ ] Image tags are immutable.
- [ ] Alpaca credentials are injected through secrets.
- [ ] `paper_trading` is intentionally set for the target environment.
- [ ] `ops/config/risk_limits.toml` has been reviewed.
- [ ] Go control-plane health endpoint is reachable.
- [ ] Rust services emit logs and bind their expected ZMQ ports.
