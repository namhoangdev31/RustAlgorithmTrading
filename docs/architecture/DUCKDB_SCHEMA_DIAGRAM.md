# DuckDB Schema Diagrams

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     TRADING SYSTEM DATABASE SCHEMA                      │
│                            (DuckDB)                                     │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   market_ticks       │         │   ohlcv_bars         │
├──────────────────────┤         ├──────────────────────┤
│ PK tick_id           │         │ PK bar_id            │
│    exchange          │         │    exchange          │
│    symbol            │         │    symbol            │
│    timestamp         │         │    timeframe         │
│    bid_price         │         │    timestamp         │
│    ask_price         │         │    open              │
│    last_price        │         │    high              │
│    volume            │         │    low               │
│    correlation_id    │         │    close             │
│    ingestion_time    │         │    volume            │
└──────────────────────┘         │    vwap              │
                                 │    is_complete       │
                                 └──────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   orders             │         │   trades             │
├──────────────────────┤         ├──────────────────────┤
│ PK order_id          │         │ PK trade_id          │
│    client_order_id   │◄────┐   │ FK order_id          │
│    exchange          │     └───┤    exchange          │
│    symbol            │         │    symbol            │
│    side              │         │    side              │
│    order_type        │         │    quantity          │
│    quantity          │         │    price             │
│    price             │         │    executed_at       │
│    status            │         │    commission        │
│    created_at        │         │    realized_pnl      │
│    filled_at         │         │    correlation_id    │
│    correlation_id    │         └──────────────────────┘
│    strategy_id       │                   │
│    metadata          │                   │
└──────────────────────┘                   │
         │                                 │
         │                                 ▼
         │                    ┌──────────────────────┐
         │                    │   positions          │
         └───────────────────►├──────────────────────┤
                             │ PK position_id       │
                             │    symbol            │
                             │    side              │
                             │    quantity          │
                             │    avg_entry_price   │
                             │    current_price     │
                             │    unrealized_pnl    │
                             │    realized_pnl      │
                             │    snapshot_time     │
                             │    strategy_id       │
                             │    correlation_id    │
                             └──────────────────────┘
                                       │
                                       │
                                       ▼
                             ┌──────────────────────┐
                             │ portfolio_snapshots  │
                             ├──────────────────────┤
                             │ PK snapshot_id       │
                             │    snapshot_time     │
                             │    snapshot_type     │
                             │    cash_balance      │
                             │    portfolio_value   │
                             │    total_pnl         │
                             │    leverage          │
                             │    long_positions    │
                             │    short_positions   │
                             └──────────────────────┘

OBSERVABILITY TABLES:

┌──────────────────────┐         ┌──────────────────────┐
│  system_metrics      │         │  application_logs    │
├──────────────────────┤         ├──────────────────────┤
│ PK metric_id         │         │ PK log_id            │
│    timestamp         │         │    timestamp         │
│    metric_name       │         │    level             │
│    metric_type       │         │    service           │
│    value             │         │    message           │
│    labels (STRUCT)   │         │    event             │
│    quantiles (STRUCT)│         │    context (STRUCT)  │
│    correlation_id    │         │    exception (STRUCT)│
└──────────────────────┘         │    correlation_id    │
                                 └──────────────────────┘

LEGEND:
  PK = Primary Key
  FK = Foreign Key
  ◄─ = References (Foreign Key Relationship)
  STRUCT = DuckDB nested structure type
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Exchanges   │     │   Manual     │     │  Backtests   │
│  (Alpaca,    │     │   Orders     │     │  & Sims      │
│   Binance)   │     │              │     │              │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       │ WebSocket Ticks    │ Order Commands     │ Historical
       │                    │                     │
       └────────────┬───────┴─────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Market Data Layer  │
         │  (Rust Service)     │
         └─────────┬───────────┘
                   │
                   │ Store Ticks
                   ▼
         ┌─────────────────────┐
         │   DuckDB Writer     │
         │  (Connection Pool)  │
         └─────────┬───────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │      DuckDB Database         │
    │  ┌────────────────────────┐  │
    │  │  HOT DATA (0-7 days)   │  │
    │  │  • market_ticks        │  │
    │  │  • ohlcv_bars          │  │
    │  │  • orders              │  │
    │  │  • trades              │  │
    │  │  • positions           │  │
    │  │  In-Memory for speed   │  │
    │  └────────────────────────┘  │
    │                              │
    │  ┌────────────────────────┐  │
    │  │ WARM DATA (7-90 days)  │  │
    │  │  • Aggregated bars     │  │
    │  │  • Historical orders   │  │
    │  │  On-disk DuckDB        │  │
    │  └────────────────────────┘  │
    └───────────┬──────────────────┘
                │
                │ Export
                ▼
    ┌──────────────────────────────┐
    │  COLD STORAGE (>90 days)     │
    │  • Parquet files             │
    │  • ZSTD compression          │
    │  • S3/Blob storage           │
    └──────────────────────────────┘

    ┌─────────────────────────────────┐
    │     QUERY PATH                  │
    └─────────────────────────────────┘

    ┌──────────────┐
    │  Application │
    │  (Trading    │
    │   Strategies)│
    └──────┬───────┘
           │
           │ Query Request
           ▼
    ┌──────────────┐
    │  Repository  │
    │  Layer       │
    └──────┬───────┘
           │
           │ SQL Query
           ▼
    ┌──────────────┐
    │  DuckDB      │
    │  Reader Pool │
    │  (50 conns)  │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Query       │
    │  Execution   │
    │  (Optimized) │
    └──────┬───────┘
           │
           │ Results
           ▼
    ┌──────────────┐
    │  Observability│
    │  Metrics      │
    │  (Latency,    │
    │   Throughput) │
    └───────────────┘
```

## Storage Tier Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      STORAGE TIER ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────┘

TIME                    STORAGE TIER              QUERY PERF    SIZE
─────────────────────────────────────────────────────────────────────────

0-24 hours        ┌───────────────────────┐
(Active Trading)  │   IN-MEMORY DUCKDB    │      <5ms        100MB
                  │   • market_ticks      │
                  │   • current_orders    │
                  │   • positions         │
                  │   Max speed           │
                  └───────────────────────┘

1-7 days          ┌───────────────────────┐
(Recent History)  │   ON-DISK DUCKDB      │      <10ms       500MB
                  │   • market_ticks      │
                  │   • orders            │
                  │   • trades            │
                  │   SSD storage         │
                  └───────────────────────┘

7-90 days         ┌───────────────────────┐
(Warm Archive)    │   PARQUET FILES       │      <50ms       2GB
                  │   • ZSTD compressed   │                (compressed)
                  │   • 10:1 compression  │
                  │   • Local disk        │
                  └───────────────────────┘

>90 days          ┌───────────────────────┐
(Cold Archive)    │   PARQUET in S3       │      <200ms      500MB
                  │   • GLACIER storage   │                (compressed)
                  │   • On-demand query   │
                  │   • 20:1 compression  │
                  └───────────────────────┘

RETENTION POLICY:
  • Tick data: 7 days hot, 90 days warm, 365 days cold
  • OHLCV bars: 90 days hot, infinite cold
  • Orders/Trades: 365 days all tiers
  • Metrics: 7 days hot, 90 days warm
```

## Connection Pool Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   CONNECTION POOL ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────┘

APPLICATION LAYER
─────────────────────────────────────────────────────────────────────────

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Strategy 1  │  │  Strategy 2  │  │  API Server  │  │  Analytics   │
│  (Read-Only) │  │  (Read-Only) │  │  (Read)      │  │  (Read)      │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       └─────────────────┴─────────────────┴─────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  DuckDBConnectionPool  │
                    │  • get_reader()        │
                    │  • get_writer()        │
                    └────────┬───────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│   READER POOL (50)      │    │   WRITER (1)            │
│   ┌───────────────┐     │    │   ┌───────────────┐     │
│   │  Connection 1 │     │    │   │  Connection   │     │
│   ├───────────────┤     │    │   │  (Exclusive)  │     │
│   │  Connection 2 │     │    │   └───────────────┘     │
│   ├───────────────┤     │    │                         │
│   │     ...       │     │    │   RwLock<Connection>    │
│   ├───────────────┤     │    │   • Writes serialized   │
│   │  Connection 50│     │    │   • Transactions ACID   │
│   └───────────────┘     │    └─────────────────────────┘
│                         │
│   Semaphore(50)         │
│   • Limit concurrency   │
│   • Fair scheduling     │
│   • No deadlocks        │
└─────────────────────────┘

DATABASE LAYER
─────────────────────────────────────────────────────────────────────────

              ┌─────────────────────────┐
              │   trading.duckdb        │
              │                         │
              │   • Single file         │
              │   • ACID transactions   │
              │   • WAL enabled         │
              │   • Auto-checkpoint     │
              └─────────────────────────┘

CONCURRENCY MODEL:
  • Multiple readers: ✅ Concurrent
  • Multiple writers: ❌ Serialized via RwLock
  • Reader + Writer: ✅ Readers continue, writer waits
  • Write throughput: 100K inserts/sec
  • Read latency: <10ms (cached) to <50ms (disk)
```

## Partitioning Strategy Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PARTITIONING STRATEGY                               │
└─────────────────────────────────────────────────────────────────────────┘

TABLE: market_ticks
PARTITION BY: (DATE_TRUNC('day', timestamp), symbol)

┌─────────────────────────────────────────────────────────────────────────┐
│  2025-10-21_AAPL  │  2025-10-21_MSFT  │  2025-10-21_GOOGL  │  ...     │
│  ─────────────────│  ─────────────────│  ──────────────────│           │
│  12,543 rows      │  8,921 rows       │  6,832 rows        │           │
│  2.1 MB           │  1.5 MB           │  1.2 MB            │           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  2025-10-20_AAPL  │  2025-10-20_MSFT  │  2025-10-20_GOOGL  │  ...     │
│  ─────────────────│  ─────────────────│  ──────────────────│           │
│  45,123 rows      │  32,456 rows      │  28,932 rows       │           │
│  7.8 MB           │  5.4 MB           │  4.9 MB            │           │
└─────────────────────────────────────────────────────────────────────────┘

QUERY OPTIMIZATION:

SELECT AVG(bid_price)
FROM market_ticks
WHERE symbol = 'AAPL'
  AND timestamp BETWEEN '2025-10-20' AND '2025-10-21';

DuckDB Query Planner:
  ✅ Scan partitions: 2025-10-20_AAPL, 2025-10-21_AAPL
  ❌ Skip partitions: All other dates/symbols
  📊 Reduction: 98% of partitions pruned

PARTITION LIFECYCLE:

Day 0-7:    Keep in DuckDB (hot tier)
Day 7:      Export to Parquet + drop partition
Day 90:     Move Parquet to S3 GLACIER
Day 365:    Delete or archive permanently

AUTOMATION (Cron job):

0 2 * * * /scripts/manage_partitions.py
  ├─ Export partitions older than 7 days
  ├─ Compress with ZSTD level 3
  ├─ Upload to S3 (warm tier)
  └─ DROP old partitions from DuckDB
```

## Migration Path Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│              MIGRATION FROM TIMESCALEDB TO DUCKDB                       │
└─────────────────────────────────────────────────────────────────────────┘

PHASE 1: DUAL-WRITE (Weeks 1-2)
───────────────────────────────────────────────────────────────────────────

┌──────────────┐
│  Application │
└──────┬───────┘
       │
       │ Write Order
       ▼
┌──────────────┐
│  Write Layer │
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│ TimescaleDB │   │   DuckDB    │
│ (Primary)   │   │ (Shadow)    │
└─────────────┘   └─────────────┘

• Write to both databases
• Read from TimescaleDB only
• Compare results for validation
• Monitor DuckDB performance


PHASE 2: GRADUAL READ MIGRATION (Weeks 3-4)
───────────────────────────────────────────────────────────────────────────

┌──────────────┐
│  Application │
└──────┬───────┘
       │
       │ Read Request
       ▼
┌──────────────────┐
│  Feature Flag    │
│  USE_DUCKDB=true │
└──────┬───────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│ TimescaleDB │   │   DuckDB    │
│ (Fallback)  │   │ (Primary)   │
└─────────────┘   └─────────────┘

• Gradually route reads to DuckDB
• Monitor error rates
• A/B testing for performance
• Rollback capability


PHASE 3: FULL MIGRATION (Week 5)
───────────────────────────────────────────────────────────────────────────

┌──────────────┐
│  Application │
└──────┬───────┘
       │
       │ All operations
       ▼
┌─────────────┐   ┌─────────────┐
│   DuckDB    │   │ TimescaleDB │
│ (Primary)   │   │ (Standby)   │
└─────────────┘   └─────────────┘

• 100% of traffic to DuckDB
• TimescaleDB on hot standby
• Monitor for 2 weeks
• No new writes to TimescaleDB


PHASE 4: DECOMMISSION (Week 6+)
───────────────────────────────────────────────────────────────────────────

┌──────────────┐
│  Application │
└──────┬───────┘
       │
       ▼
┌─────────────┐
│   DuckDB    │
│ (Only DB)   │
└─────────────┘

┌─────────────┐
│ TimescaleDB │
│ ARCHIVED    │
│ (Parquet)   │
└─────────────┘

• Export TimescaleDB to Parquet
• Shutdown TimescaleDB instance
• Delete infrastructure
• Cost savings: $150/month
```

---

**Diagrams Legend**:
- `┌─┐` = System/Component boundary
- `│` = Connection/Flow
- `▼` = Data flow direction
- `PK` = Primary Key
- `FK` = Foreign Key
- `✅` = Optimized/Included
- `❌` = Not used/Skipped

**Created by**: Hive Mind Architecture Agent
**Date**: October 21, 2025