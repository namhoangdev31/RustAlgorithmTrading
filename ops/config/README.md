# Runtime Config

`ops/config/` contains checked-in runtime defaults only. Secrets stay in environment variables or platform secret stores.

## Files

- `system.json` - Active local config symlink, currently pointing at development.
- `system.development.json` - Local development profile.
- `system.staging.json` - Paper-trading staging profile.
- `system.production.json` - Production baseline profile.
- `risk_limits.toml` - Shared risk limits and circuit-breaker settings.
- `data_download.json` - Default historical data download request.

## Usage

Rust services read config paths relative to the repository root:

```rust
let config = SystemConfig::from_file("ops/config/system.json")?;
```

Switch local profiles by updating the symlink:

```bash
ln -sf system.development.json ops/config/system.json
ln -sf system.staging.json ops/config/system.json
ln -sf system.production.json ops/config/system.json
```

## Policy

- Do not commit API keys or account-specific secrets.
- Do not add Grafana, Prometheus, or dashboard config here.
- User-editable runtime configuration should move into the Go/Next.js web layer.
