# Staging Deployment Guide
## Rust Algorithmic Trading System

**Version**: 2.0.0 (Phase 3.5 Hardened)
**Last Updated**: May 11, 2026
**Environment**: 🧪 **STAGING (Paper Trading)**
**Goal**: Validate strategies and system stability before production cutover.

---

## 1. Staging Environment Overview

The staging environment is a 1:1 replica of production but configured for **Alpaca Paper Trading**.

### Key Differences from Production
- `PAPER_TRADING=true`
- `ALPACA_API_URL=https://paper-api.alpaca.markets`
- Lower risk limits (e.g., $10k max position vs $100k)
- Debug logging enabled for detailed trace analysis

---

## 2. Quick Setup

```bash
# 1. Create Staging Environment
cp .env.example .env.staging
# Edit .env.staging with Paper Trading Keys

# 2. Deploy with Staging Profile
docker compose -f ops/deployment/docker-compose.yml -f ops/deployment/docker-compose.staging.yml up -d
```

---

## 3. Verification Checklist

### 3.1 Connectivity
- [ ] Go Control Plane reachable at `http://localhost:8081`
- [ ] Alpaca Paper WebSocket connected (check `market_data` logs)
- [ ] Rust services emitting metrics to Go scraper

### 3.2 Strategy Validation
- [ ] Run a 1-hour "Dry Run" strategy
- [ ] Verify orders appear in Alpaca Paper Dashboard
- [ ] Check DuckDB for correct metric ingestion

---

## 4. Troubleshooting Staging

### Resetting Data
To start fresh in staging:
```bash
docker compose down -v
rm data/*.db data/*.duckdb
docker compose up -d
```

### Mocking Market Data
If the exchange is closed, use the `ops/scripts/mock_market_data.py` to feed the ZMQ pipeline.

---

**Architect**: Antigravity AI
**Documentation Version**: 2.0.0