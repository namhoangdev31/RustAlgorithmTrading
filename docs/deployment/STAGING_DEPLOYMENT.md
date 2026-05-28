# Staging Deployment

Staging is now image-first and paper-trading only. The old staging Docker Compose bundle was removed with the ops cleanup.

## Build Images

```bash
docker build -f ops/deployment/Dockerfile --build-arg BIN=market-data -t trading/market-data:staging .
docker build -f ops/deployment/Dockerfile --build-arg BIN=signal-bridge -t trading/signal-bridge:staging .
docker build -f ops/deployment/Dockerfile --build-arg BIN=risk-manager -t trading/risk-manager:staging .
docker build -f ops/deployment/Dockerfile --build-arg BIN=execution-engine -t trading/execution-engine:staging .
docker build -f ops/deployment/go.Dockerfile -t trading/go-control-plane:staging .
```

## Configuration

- Use `ops/config/system.staging.json`.
- Keep `paper_trading=true`.
- Inject Alpaca paper credentials through the deployment platform, not checked-in files.

## Verification

```bash
bash ops/scripts/check_dependencies.sh
cd go && go test ./...
cd rust && cargo test --workspace
```

Local native fallback:

```bash
TRADING_ENV=staging bash ops/scripts/start_services.sh
bash ops/scripts/health_check.sh
bash ops/scripts/stop_services.sh
```
