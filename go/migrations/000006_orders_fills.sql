CREATE TABLE order_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    symbol VARCHAR(50) NOT NULL REFERENCES products(symbol) ON DELETE RESTRICT,
    side order_side NOT NULL,
    type order_type NOT NULL,
    quantity NUMERIC(20, 8) NOT NULL,
    price NUMERIC(20, 8),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE order_previews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intent_id UUID NOT NULL REFERENCES order_intents(id) ON DELETE RESTRICT UNIQUE,
    estimated_margin NUMERIC(20, 8) NOT NULL,
    estimated_fees NUMERIC(20, 8) NOT NULL,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    validation_errors JSONB
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    symbol VARCHAR(50) NOT NULL REFERENCES products(symbol) ON DELETE RESTRICT,
    client_order_id VARCHAR(100) NOT NULL,
    side order_side NOT NULL,
    type order_type NOT NULL,
    price NUMERIC(20, 8),
    quantity NUMERIC(20, 8) NOT NULL,
    filled_quantity NUMERIC(20, 8) NOT NULL DEFAULT 0.00000000,
    -- Generated Column for remaining quantity computation
    remaining_quantity NUMERIC(20, 8) GENERATED ALWAYS AS (quantity - filled_quantity) STORED,
    status order_status NOT NULL DEFAULT 'received',
    time_in_force VARCHAR(20) NOT NULL DEFAULT 'GTC',
    version BIGINT NOT NULL DEFAULT 1,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
CREATE UNIQUE INDEX idx_orders_client_id ON orders(account_id, client_order_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_active ON orders(account_id, symbol) 
WHERE status IN ('received', 'previewed', 'accepted', 'routed', 'broker_acknowledged', 'partially_filled');

CREATE TABLE order_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    from_status order_status NOT NULL,
    to_status order_status NOT NULL,
    source VARCHAR(100) NOT NULL,
    correlation_id UUID NOT NULL,
    reason_code VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE order_rejections (
    order_id UUID PRIMARY KEY REFERENCES orders(id) ON DELETE RESTRICT,
    reason_code VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    rejected_by VARCHAR(100) NOT NULL,
    error_envelope JSONB NOT NULL
);

CREATE TABLE order_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    route_name VARCHAR(100) NOT NULL,
    latency_ms INTEGER
);

CREATE TABLE broker_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    broker_name VARCHAR(100) NOT NULL,
    broker_ref_id VARCHAR(100) NOT NULL UNIQUE,
    broker_status VARCHAR(50) NOT NULL
);

CREATE TABLE broker_order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_order_id UUID NOT NULL REFERENCES broker_orders(id) ON DELETE RESTRICT,
    raw_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE fills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    broker_order_id UUID REFERENCES broker_orders(id) ON DELETE RESTRICT,
    fill_id VARCHAR(100) NOT NULL UNIQUE,
    price NUMERIC(20, 8) NOT NULL,
    quantity NUMERIC(20, 8) NOT NULL,
    -- Generated Column for calculating total trade value
    total_value NUMERIC(20, 8) GENERATED ALWAYS AS (price * quantity) STORED,
    fee NUMERIC(20, 8) NOT NULL DEFAULT 0.00000000,
    filled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fill_id UUID NOT NULL REFERENCES fills(id) ON DELETE RESTRICT UNIQUE,
    symbol VARCHAR(50) NOT NULL REFERENCES products(symbol) ON DELETE RESTRICT,
    price NUMERIC(20, 8) NOT NULL,
    quantity NUMERIC(20, 8) NOT NULL,
    side order_side NOT NULL,
    matched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE execution_quality (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fill_id UUID NOT NULL REFERENCES fills(id) ON DELETE RESTRICT UNIQUE,
    slippage NUMERIC(20, 8) NOT NULL,
    effective_spread NUMERIC(20, 8) NOT NULL
);
