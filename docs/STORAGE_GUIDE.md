# DuckDB Storage Implementation Guide

## Overview

This project uses a dual-database architecture for optimal performance:

- **DuckDB**: Time-series analytics (OLAP) - Blazing fast aggregations
- **PostgreSQL**: Operational data (OLTP) - ACID transactions

## Why DuckDB?

DuckDB is perfect for trading analytics:

- ⚡ **10-100x faster** than PostgreSQL for analytics queries
- 📦 **Embedded** - No server needed, zero configuration
- 🔥 **Columnar storage** - Optimized for time-series aggregations
- 🆓 **100% FREE** - Open source, no licensing costs
- 🚀 **Modern SQL** - Window functions, time bucketing, JSON support

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Go control-plane Application                │
├─────────────────────────────────────────────────┤
│          StorageManager (integration.py)        │
├──────────────────────┬──────────────────────────┤
│   DuckDBClient       │   PostgresClient           │
│  (Analytics/OLAP)    │  (Operations/OLTP)       │
├──────────────────────┼──────────────────────────┤
│ • Metrics            │ • Trade Log              │
│ • Candles (OHLCV)    │ • System Events          │
│ • Performance        │ • Operational Metadata   │
└──────────────────────┴──────────────────────────┘
```

## File Structure

```
python/src/observability/storage/
├── __init__.py              # Package exports
├── schemas.py               # Data models & SQL schemas
├── duckdb_client.py         # DuckDB time-series client
├── postgres_client.py         # PostgreSQL operational client
└── integration.py           # Control-plane integration (Go primary, legacy compatibility (retired)) helpers

python/tests/observability/
├── test_duckdb_client.py    # DuckDB tests with benchmarks
└── test_postgres_client.py    # PostgreSQL tests
```

## Quick Start

### 1. Install Dependencies

```bash
pip install duckdb>=0.9.0 asyncpg>=0.19.0
```

### 2. Initialize Storage

```python
from observability.storage import DuckDBClient, PostgresClient

# DuckDB for analytics
duckdb = DuckDBClient("data/metrics.duckdb")
await duckdb.initialize()

# PostgreSQL for operations
PostgreSQL = PostgresClient("data/postgresql://localhost:5432/trading")
await PostgreSQL.initialize()
```

### 3. Go control-plane Integration

```python
from go-control-plane import Go control-plane, Depends
from observability.storage.integration import (
    storage_lifespan,
    get_storage,
    StorageManager
)

# Initialize app with storage
app = Go control-plane(lifespan=storage_lifespan)

@app.get("/metrics/{metric_name}")
async def get_metrics(
    metric_name: str,
    storage: StorageManager = Depends(get_storage)
):
    return await storage.get_recent_metrics(metric_name, minutes=60)
```

## Usage Examples

### Recording Metrics

```python
from observability.storage.schemas import MetricRecord
from datetime import datetime

# Single metric
metric = MetricRecord(
    timestamp=datetime.utcnow(),
    metric_name="order_latency_ms",
    value=42.5,
    symbol="BTC/USD",
    labels={"exchange": "alpaca"}
)
await duckdb.insert_metric(metric)

# Batch insert (high performance)
metrics = [
    MetricRecord(
        timestamp=datetime.utcnow(),
        metric_name="price",
        value=50000.0 + i,
        symbol="BTC/USD"
    )
    for i in range(1000)
]
await duckdb.insert_metrics(metrics)  # <1ms for 1000 records
```

### Recording Candles

```python
from observability.storage.schemas import CandleRecord

candle = CandleRecord(
    timestamp=datetime.utcnow(),
    symbol="ETH/USD",
    open=3000.0,
    high=3050.0,
    low=2980.0,
    close=3020.0,
    volume=1000000
)
await duckdb.insert_candle(candle)
```

### Querying Time-Series Data

```python
from datetime import timedelta

# Get metrics for last hour
metrics = await duckdb.get_metrics(
    metric_name="order_latency_ms",
    start_time=datetime.utcnow() - timedelta(hours=1),
    symbol="BTC/USD"
)

# Get candles with time bucketing
candles = await duckdb.get_candles(
    symbol="BTC/USD",
    interval=TimeInterval.MINUTE,  # 1m, 1h, 1d
    start_time=datetime.utcnow() - timedelta(hours=24),
    limit=1000
)

# Get aggregated metrics (avg, sum, min, max)
aggregated = await duckdb.get_aggregated_metrics(
    metric_name="price",
    interval=TimeInterval.HOUR,
    start_time=datetime.utcnow() - timedelta(days=7),
    aggregation="avg"  # avg, sum, min, max, count
)
```

### Performance Summary

```python
# Get portfolio performance
summary = await duckdb.get_performance_summary(
    start_time=datetime.utcnow() - timedelta(days=30)
)

# Returns:
# {
#     "start_value": 100000.0,
#     "end_value": 105000.0,
#     "total_pnl": 5000.0,
#     "return_pct": 5.0,
#     "avg_sharpe": 2.5,
#     "worst_drawdown": -0.05
# }
```

### Logging Trades

```python
# Log trade execution
trade_id = await PostgreSQL.log_trade(
    timestamp=datetime.utcnow(),
    symbol="BTC/USD",
    side="buy",
    quantity=0.5,
    price=50000.0,
    order_id="alpaca-order-123",
    status="executed",
    metadata={"strategy": "momentum"}
)

# Get trade history
trades = await PostgreSQL.get_trades(
    start_time=datetime.utcnow() - timedelta(days=7),
    symbol="BTC/USD"
)
```

### Logging System Events

```python
# Log system event
await PostgreSQL.log_event(
    event_type="order",
    severity="error",
    message="Order failed: insufficient funds",
    details={"order_id": "123", "symbol": "BTC/USD"}
)

# Query events
events = await PostgreSQL.get_events(
    start_time=datetime.utcnow() - timedelta(hours=1),
    severity="error"
)
```

## Performance Characteristics

### DuckDB Benchmarks

- **Insert**: <1ms per 1000 records
- **Query**: <50ms for 1M records
- **Aggregation**: Blazing fast with columnar storage
- **Throughput**: >10,000 records/sec

### PostgreSQL Benchmarks

- **Insert**: <1ms per record
- **Query**: <10ms for most operational queries
- **ACID**: Full transaction support

## Time Intervals

Supported intervals for time-bucketing:

```python
from observability.storage.schemas import TimeInterval

TimeInterval.SECOND  # "1s"
TimeInterval.MINUTE  # "1m"
TimeInterval.HOUR    # "1h"
TimeInterval.DAY     # "1d"
TimeInterval.WEEK    # "1w"
TimeInterval.MONTH   # "1mo"
```

## Optimization Tips

### 1. Batch Operations

```python
# ✅ GOOD: Batch insert
await duckdb.insert_metrics(metrics_batch)

# ❌ BAD: Individual inserts
for metric in metrics_batch:
    await duckdb.insert_metric(metric)
```

### 2. Regular Optimization

```python
# Run periodically (e.g., daily)
await duckdb.optimize()  # VACUUM and CHECKPOINT
```

### 3. Connection Management

```python
# Use context managers
async with duckdb_session("data/metrics.duckdb") as client:
    metrics = await client.get_metrics(...)
```

### 4. Query Limits

```python
# Always use limits for large tables
metrics = await duckdb.get_metrics(
    "price",
    start_time=...,
    limit=10000  # Prevent OOM
)
```

## Testing

Run comprehensive tests with benchmarks:

```bash
# Run all tests
pytest python/tests/observability/

# Run with verbose output
pytest python/tests/observability/ -v -s

# Run specific tests
pytest python/tests/observability/test_duckdb_client.py::TestPerformanceBenchmarks
```

## Monitoring

Get database statistics:

```python
# DuckDB stats
stats = await duckdb.get_table_stats()
# {
#     "trading_metrics": {
#         "row_count": 1000000,
#         "min_timestamp": ...,
#         "max_timestamp": ...
#     }
# }

# PostgreSQL size
size_bytes = await PostgreSQL.get_db_size()
```

## Web Integration

DuckDB metrics should be exposed through the Go control-plane and consumed by the web UI:

1. **Custom API**: Expose query-backed endpoints through Go.
2. **WebSocket snapshots**: Stream live telemetry to the Next.js UI.
3. **Parquet exports**: Export research snapshots when needed.

Example API response shape:

```python
{
    "metric": "latency_ms",
    "points": [
        {"timestamp": "2026-05-28T00:00:00Z", "value": 0.42}
    ]
}
```

## Troubleshooting

### "Database is locked"

PostgreSQL: Ensure WAL mode is enabled (done automatically in `initialize()`)

### "Out of memory"

DuckDB: Adjust memory limit in `duckdb_client.py`:
```python
self._conn.execute("PRAGMA memory_limit='2GB'")
```

### Slow queries

1. Check indexes are created (done in schemas)
2. Use `EXPLAIN` to analyze query plans
3. Consider adding more indexes for specific queries

## Best Practices

1. ✅ **Use DuckDB for analytics** (aggregations, time-series)
2. ✅ **Use PostgreSQL for transactions** (trade logs, events)
3. ✅ **Batch insert when possible** (10-100x faster)
4. ✅ **Always use time range filters** (prevent full table scans)
5. ✅ **Set query limits** (prevent memory issues)
6. ✅ **Close connections properly** (use context managers)
7. ✅ **Run optimization periodically** (daily VACUUM)

## Migration from Other Databases

### From PostgreSQL

```python
# Export from PostgreSQL
import psycopg2
conn = psycopg2.connect(...)
df = pd.read_sql("SELECT * FROM metrics", conn)

# Import to DuckDB
import duckdb
conn = duckdb.connect("metrics.duckdb")
conn.register('df', df)
conn.execute("CREATE TABLE metrics AS SELECT * FROM df")
```

### From CSV/Parquet

```python
# DuckDB can read directly
conn.execute("""
    CREATE TABLE metrics AS
    SELECT * FROM read_csv_auto('metrics.csv')
""")
```

## Future Enhancements

- [ ] Automatic data retention policies
- [ ] Streaming inserts with buffering
- [ ] Real-time aggregation views
- [ ] Web-managed telemetry and runtime config
- [ ] S3/cloud storage backends
- [ ] Multi-database sharding

## Support

For issues or questions:
1. Check tests for usage examples
2. Review DuckDB docs: https://duckdb.org/docs/
3. PostgreSQL docs: https://www.PostgreSQL.org/docs.html
