CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    account_number VARCHAR(100) NOT NULL UNIQUE,
    broker_name VARCHAR(100) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    balance NUMERIC(20, 8) NOT NULL DEFAULT 0.00000000,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE TABLE account_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    credentials_encrypted TEXT NOT NULL,
    connection_status VARCHAR(50) NOT NULL DEFAULT 'disconnected',
    last_ping_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE account_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    permission_level VARCHAR(50) NOT NULL DEFAULT 'read_only',
    CONSTRAINT unique_account_user_perm UNIQUE (account_id, user_id)
);

CREATE TABLE valuation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    triggered_by VARCHAR(100) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'running'
);

CREATE TABLE account_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    snapshot_time TIMESTAMP WITH TIME ZONE NOT NULL,
    balance NUMERIC(20, 8) NOT NULL,
    buying_power NUMERIC(20, 8) NOT NULL,
    equity NUMERIC(20, 8) NOT NULL
);

CREATE TABLE portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    snapshot_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_value NUMERIC(20, 8) NOT NULL,
    unrealized_pnl NUMERIC(20, 8) NOT NULL,
    realized_pnl NUMERIC(20, 8) NOT NULL
);

CREATE TABLE portfolio_valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    valuation_run_id UUID NOT NULL REFERENCES valuation_runs(id) ON DELETE RESTRICT,
    portfolio_value NUMERIC(20, 8) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE portfolio_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    event_type VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    symbol VARCHAR(50) NOT NULL REFERENCES products(symbol) ON DELETE RESTRICT,
    quantity NUMERIC(20, 8) NOT NULL DEFAULT 0.00000000,
    average_entry_price NUMERIC(20, 8) NOT NULL DEFAULT 0.00000000,
    realized_pnl NUMERIC(20, 8) NOT NULL DEFAULT 0.00000000,
    version BIGINT NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_account_position UNIQUE (account_id, symbol)
);

CREATE TABLE position_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE RESTRICT,
    quantity NUMERIC(20, 8) NOT NULL,
    entry_price NUMERIC(20, 8) NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE position_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE RESTRICT,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    change_qty NUMERIC(20, 8) NOT NULL,
    execution_price NUMERIC(20, 8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE position_valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE RESTRICT,
    valuation_run_id UUID NOT NULL REFERENCES valuation_runs(id) ON DELETE RESTRICT,
    market_value NUMERIC(20, 8) NOT NULL,
    unrealized_pnl NUMERIC(20, 8) NOT NULL
);

CREATE TABLE cash_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    currency VARCHAR(10) NOT NULL,
    amount NUMERIC(20, 8) NOT NULL DEFAULT 0.00000000,
    reserved_amount NUMERIC(20, 8) NOT NULL DEFAULT 0.00000000,
    CONSTRAINT unique_account_currency UNIQUE (account_id, currency)
);

CREATE TABLE cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    currency VARCHAR(10) NOT NULL,
    amount NUMERIC(20, 8) NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE pricing_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valuation_run_id UUID NOT NULL REFERENCES valuation_runs(id) ON DELETE RESTRICT,
    symbol VARCHAR(50) NOT NULL REFERENCES products(symbol) ON DELETE RESTRICT,
    price NUMERIC(20, 8) NOT NULL,
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
