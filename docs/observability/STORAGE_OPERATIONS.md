# Storage Operations Guide (DuckDB & SQLite)

## Overview

The platform uses a hybrid storage model:
- **DuckDB**: Columnar storage for high-frequency time-series metrics.
- **SQLite**: Transactional storage for trade history, configuration, and audit logs.

## 1. Database Locations

| Database | Filesystem Path | Usage |
|:---|:---|:---|
| **Metrics** | `data/observability.duckdb` | Metric history, analytics |
| **Trades** | `data/trades.db` | Order history, position state |
| **Metadata** | `data/system.db` | Operational metadata |

## 2. Maintenance Tasks

### DuckDB Optimization
DuckDB handles high-speed inserts but benefits from periodic vacuuming:
```sql
-- Connect via DuckDB CLI
duckdb data/observability.duckdb

-- Manual vacuum
VACUUM;
-- Analyze for query optimization
ANALYZE;
```

### Automated Backups
Run the project backup script daily:
```bash
bash scripts/backup_storage.sh
```
*Backups are stored in `backups/` with a 7-day retention policy.*

## 3. Common Queries

### Querying Metrics via DuckDB CLI
```sql
-- Find average latency for last hour
SELECT symbol, AVG(value)
FROM metrics
WHERE name = 'order_routing_latency_us'
AND timestamp > now() - INTERVAL 1 HOUR
GROUP BY symbol;
```

### Inspecting Trade History via SQLite CLI
```bash
sqlite3 data/trades.db "SELECT * FROM trades ORDER BY timestamp DESC LIMIT 10;"
```

## 4. Troubleshooting

### Database Locked (SQLite)
If you see `database is locked`, ensure only one process is writing. The Go Control-Plane should be the primary writer for trades in production.

### Corruption Check (DuckDB)
If DuckDB fails to open:
1. Try `duckdb data/observability.duckdb "PRAGMA integrity_check;"`
2. If corrupted, restore from the last nightly backup in `backups/`.

---
**Maintained By**: Trading Infrastructure Team
**Status**: Production Standard
