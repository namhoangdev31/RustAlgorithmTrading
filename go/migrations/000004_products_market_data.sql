CREATE TABLE products (
    symbol VARCHAR(50) PRIMARY KEY,
    asset_class VARCHAR(50) NOT NULL,
    base_currency VARCHAR(10) NOT NULL,
    quote_currency VARCHAR(10) NOT NULL,
    min_size NUMERIC(20, 8) NOT NULL DEFAULT 0.00000001,
    size_increment NUMERIC(20, 8) NOT NULL DEFAULT 0.00000001,
    price_increment NUMERIC(20, 8) NOT NULL DEFAULT 0.00000001,
    is_tradable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE product_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(50) NOT NULL REFERENCES products(symbol) ON DELETE RESTRICT,
    provider_name VARCHAR(100) NOT NULL,
    provider_symbol VARCHAR(100) NOT NULL,
    CONSTRAINT unique_provider_alias UNIQUE (provider_name, provider_symbol)
);

CREATE TABLE market_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(50) NOT NULL REFERENCES products(symbol) ON DELETE RESTRICT,
    session_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC'
);

CREATE TABLE corporate_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(50) NOT NULL REFERENCES products(symbol) ON DELETE RESTRICT,
    action_type VARCHAR(100) NOT NULL,
    ex_date DATE NOT NULL,
    execution_details JSONB NOT NULL
);

CREATE TABLE fx_rates (
    pair VARCHAR(20) PRIMARY KEY,
    rate NUMERIC(20, 8) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE market_data_providers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE market_data_stats (
    symbol VARCHAR(50) PRIMARY KEY REFERENCES products(symbol) ON DELETE RESTRICT,
    volume_24h NUMERIC(20, 8) NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Partitioned Timeseries Tables for Market Data (No foreign keys to maximize write performance)
CREATE TABLE market_data_ticks (
    id BIGSERIAL,
    symbol VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    price NUMERIC(20, 8) NOT NULL,
    size NUMERIC(20, 8) NOT NULL,
    PRIMARY KEY (timestamp, id)
) PARTITION BY RANGE (timestamp);

CREATE TABLE market_quotes (
    id BIGSERIAL,
    symbol VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    bid_price NUMERIC(20, 8) NOT NULL,
    bid_size NUMERIC(20, 8) NOT NULL,
    ask_price NUMERIC(20, 8) NOT NULL,
    ask_size NUMERIC(20, 8) NOT NULL,
    PRIMARY KEY (timestamp, id)
) PARTITION BY RANGE (timestamp);

CREATE TABLE market_bars (
    symbol VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    timeframe VARCHAR(20) NOT NULL,
    open NUMERIC(20, 8) NOT NULL,
    high NUMERIC(20, 8) NOT NULL,
    low NUMERIC(20, 8) NOT NULL,
    close NUMERIC(20, 8) NOT NULL,
    volume NUMERIC(20, 8) NOT NULL,
    PRIMARY KEY (timestamp, symbol, timeframe)
) PARTITION BY RANGE (timestamp);

CREATE TABLE order_book_snapshots (
    id BIGSERIAL,
    symbol VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    bids JSONB NOT NULL,
    asks JSONB NOT NULL,
    PRIMARY KEY (timestamp, id)
) PARTITION BY RANGE (timestamp);

CREATE TABLE mark_prices (
    id BIGSERIAL,
    symbol VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    mark_price NUMERIC(20, 8) NOT NULL,
    PRIMARY KEY (timestamp, id)
) PARTITION BY RANGE (timestamp);
