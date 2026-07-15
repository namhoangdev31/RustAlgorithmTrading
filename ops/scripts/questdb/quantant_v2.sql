-- QuantAnt v2 time-series schema.
-- PostgreSQL/Prisma remains canonical; these tables are read-optimized snapshots.
-- Apply additively through the QuestDB HTTP API or web console.

CREATE TABLE IF NOT EXISTS quant_quotes_v1 (
    timestamp TIMESTAMP,
    received_at TIMESTAMP,
    provider SYMBOL capacity 32 CACHE,
    asset_class SYMBOL capacity 8 CACHE,
    symbol SYMBOL capacity 2048 CACHE,
    bid DOUBLE,
    ask DOUBLE,
    bid_size DOUBLE,
    ask_size DOUBLE,
    last DOUBLE,
    source_sequence LONG,
    is_snapshot BOOLEAN
) TIMESTAMP(timestamp) PARTITION BY DAY WAL
  DEDUP UPSERT KEYS(timestamp, provider, asset_class, symbol);

CREATE TABLE IF NOT EXISTS quant_candles_v2 (
    timestamp TIMESTAMP,
    received_at TIMESTAMP,
    provider SYMBOL capacity 32 CACHE,
    asset_class SYMBOL capacity 8 CACHE,
    symbol SYMBOL capacity 2048 CACHE,
    interval SYMBOL capacity 32 CACHE,
    open DOUBLE,
    high DOUBLE,
    low DOUBLE,
    close DOUBLE,
    volume DOUBLE,
    vwap DOUBLE,
    trade_count LONG,
    source_sequence LONG,
    is_final BOOLEAN
) TIMESTAMP(timestamp) PARTITION BY MONTH WAL
  DEDUP UPSERT KEYS(timestamp, provider, asset_class, symbol, interval);

CREATE TABLE IF NOT EXISTS quant_portfolio_snapshots_v1 (
    timestamp TIMESTAMP,
    received_at TIMESTAMP,
    account_id SYMBOL capacity 64 CACHE,
    broker SYMBOL capacity 16 CACHE,
    mode SYMBOL capacity 4 CACHE,
    currency SYMBOL capacity 16 CACHE,
    equity DOUBLE,
    cash DOUBLE,
    buying_power DOUBLE,
    margin_used DOUBLE,
    realized_pnl DOUBLE,
    unrealized_pnl DOUBLE,
    source_sequence LONG
) TIMESTAMP(timestamp) PARTITION BY MONTH WAL
  DEDUP UPSERT KEYS(timestamp, account_id, broker, mode);

CREATE TABLE IF NOT EXISTS quant_position_snapshots_v1 (
    timestamp TIMESTAMP,
    received_at TIMESTAMP,
    account_id SYMBOL capacity 64 CACHE,
    broker SYMBOL capacity 16 CACHE,
    mode SYMBOL capacity 4 CACHE,
    provider SYMBOL capacity 32 CACHE,
    asset_class SYMBOL capacity 8 CACHE,
    symbol SYMBOL capacity 2048 CACHE,
    quantity DOUBLE,
    average_price DOUBLE,
    market_price DOUBLE,
    market_value DOUBLE,
    unrealized_pnl DOUBLE,
    realized_pnl DOUBLE,
    source_sequence LONG
) TIMESTAMP(timestamp) PARTITION BY MONTH WAL
  DEDUP UPSERT KEYS(timestamp, account_id, broker, mode, symbol);

CREATE TABLE IF NOT EXISTS quant_strategy_snapshots_v1 (
    timestamp TIMESTAMP,
    received_at TIMESTAMP,
    account_id SYMBOL capacity 64 CACHE,
    deployment_id SYMBOL capacity 256 CACHE,
    strategy_id SYMBOL capacity 256 CACHE,
    strategy_version_hash SYMBOL capacity 256 CACHE,
    mode SYMBOL capacity 4 CACHE,
    lifecycle SYMBOL capacity 16 CACHE,
    pnl DOUBLE,
    drawdown DOUBLE,
    exposure DOUBLE,
    signal_count LONG,
    order_count LONG,
    heartbeat_age_ms LONG,
    source_sequence LONG
) TIMESTAMP(timestamp) PARTITION BY MONTH WAL
  DEDUP UPSERT KEYS(timestamp, account_id, deployment_id, strategy_version_hash);

CREATE TABLE IF NOT EXISTS quant_execution_snapshots_v1 (
    timestamp TIMESTAMP,
    received_at TIMESTAMP,
    account_id SYMBOL capacity 64 CACHE,
    broker SYMBOL capacity 16 CACHE,
    mode SYMBOL capacity 4 CACHE,
    client_order_id SYMBOL capacity 1048576 NOCACHE,
    broker_order_id SYMBOL capacity 1048576 NOCACHE,
    provider SYMBOL capacity 32 CACHE,
    asset_class SYMBOL capacity 8 CACHE,
    symbol SYMBOL capacity 2048 CACHE,
    event_type SYMBOL capacity 32 CACHE,
    status SYMBOL capacity 32 CACHE,
    side SYMBOL capacity 8 CACHE,
    order_type SYMBOL capacity 16 CACHE,
    quantity DOUBLE,
    price DOUBLE,
    cumulative_quantity DOUBLE,
    latency_ms LONG,
    source_sequence LONG,
    correlation_id VARCHAR
) TIMESTAMP(timestamp) PARTITION BY MONTH WAL
  DEDUP UPSERT KEYS(timestamp, account_id, client_order_id, event_type, source_sequence);
