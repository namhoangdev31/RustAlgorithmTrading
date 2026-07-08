-- QuestDB schema initialization for trading analytics
-- Run once via QuestDB web console (port 9000) or HTTP API
-- All tables use designated timestamp with WAL for concurrent writes

-- =============================================================================
-- trading_metrics: Time-series metrics (PnL, latency, fill rate, etc.)
-- =============================================================================
CREATE TABLE IF NOT EXISTS trading_metrics (
    timestamp TIMESTAMP,
    user_id SYMBOL capacity 256 CACHE,
    metric_name SYMBOL capacity 256 CACHE,
    value DOUBLE,
    symbol SYMBOL capacity 256 CACHE,
    labels VARCHAR
) TIMESTAMP(timestamp) PARTITION BY DAY WAL;

-- =============================================================================
-- performance_history: Portfolio snapshots for strategy performance
-- =============================================================================
CREATE TABLE IF NOT EXISTS performance_history (
    timestamp TIMESTAMP,
    user_id SYMBOL capacity 256 CACHE,
    portfolio_value DOUBLE,
    pnl DOUBLE,
    sharpe_ratio DOUBLE,
    max_drawdown DOUBLE,
    win_rate DOUBLE,
    total_trades INT
) TIMESTAMP(timestamp) PARTITION BY MONTH WAL;

-- =============================================================================
-- trading_candles: OHLCV candle data
-- =============================================================================
CREATE TABLE IF NOT EXISTS trading_candles (
    timestamp TIMESTAMP,
    user_id SYMBOL capacity 256 CACHE,
    symbol SYMBOL capacity 256 CACHE,
    open DOUBLE,
    high DOUBLE,
    low DOUBLE,
    close DOUBLE,
    volume LONG,
    trade_count INT
) TIMESTAMP(timestamp) PARTITION BY MONTH WAL
  DEDUP KEYS(timestamp, symbol, user_id);

-- =============================================================================
-- system_events: Alerts, logs, risk events
-- =============================================================================
CREATE TABLE IF NOT EXISTS system_events (
    timestamp TIMESTAMP,
    user_id SYMBOL capacity 256 CACHE,
    event_type SYMBOL capacity 64 CACHE,
    severity SYMBOL capacity 16 CACHE,
    message VARCHAR,
    details VARCHAR
) TIMESTAMP(timestamp) PARTITION BY DAY WAL;

-- =============================================================================
-- trading_trades: Executed trade details (analytics copy; canonical in PostgreSQL)
-- =============================================================================
CREATE TABLE IF NOT EXISTS trading_trades (
    timestamp TIMESTAMP,
    user_id SYMBOL capacity 256 CACHE,
    trade_id VARCHAR,
    order_id VARCHAR,
    symbol SYMBOL capacity 256 CACHE,
    side SYMBOL capacity 4 CACHE,
    quantity DOUBLE,
    price DOUBLE,
    commission DOUBLE,
    trade_value DOUBLE,
    liquidity SYMBOL capacity 16 CACHE
) TIMESTAMP(timestamp) PARTITION BY MONTH WAL;
