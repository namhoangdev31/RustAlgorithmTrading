-- 1. Register Range Partitions with pg_partman
SELECT partman.create_parent(
    p_parent_table := 'public.market_data_ticks',
    p_control := 'timestamp',
    p_type := 'native',
    p_interval := 'daily',
    p_premake := 3
);

SELECT partman.create_parent(
    p_parent_table := 'public.market_quotes',
    p_control := 'timestamp',
    p_type := 'native',
    p_interval := 'daily',
    p_premake := 3
);

SELECT partman.create_parent(
    p_parent_table := 'public.event_store',
    p_control := 'created_at',
    p_type := 'native',
    p_interval := 'monthly',
    p_premake := 2
);

SELECT partman.create_parent(
    p_parent_table := 'public.outbox_events',
    p_control := 'created_at',
    p_type := 'native',
    p_interval := 'monthly',
    p_premake := 2
);

SELECT partman.create_parent(
    p_parent_table := 'public.audit_events',
    p_control := 'created_at',
    p_type := 'native',
    p_interval := 'monthly',
    p_premake := 2
);

-- Retention Policy Catalog for automated partitions cleanup
CREATE TABLE partition_retention_policies (
    table_name VARCHAR(255) PRIMARY KEY,
    retention_period INTERVAL NOT NULL,
    archive_to_s3 BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO partition_retention_policies (table_name, retention_period, archive_to_s3) VALUES
('market_data_ticks', INTERVAL '90 days', TRUE),
('market_quotes', INTERVAL '90 days', TRUE),
('metric_samples', INTERVAL '30 days', FALSE),
('audit_events', INTERVAL '7 years', TRUE);

-- 2. Realtime Materialized Views for Dashboards
CREATE MATERIALIZED VIEW mv_realtime_daily_pnl AS
SELECT 
    account_id,
    SUM(realized_pnl) AS total_realized_pnl,
    NOW() AS calculated_at
FROM positions
GROUP BY account_id;
CREATE UNIQUE INDEX idx_mv_pnl_acc ON mv_realtime_daily_pnl(account_id);

-- 3. Advanced Indexes
CREATE INDEX idx_ticks_symbol_time ON market_data_ticks (symbol, timestamp DESC);
CREATE INDEX idx_quotes_symbol_time ON market_quotes (symbol, timestamp DESC);

CREATE INDEX idx_ticks_brin ON market_data_ticks USING brin (timestamp);
CREATE INDEX idx_quotes_brin ON market_quotes USING brin (timestamp);
CREATE INDEX idx_event_store_brin ON event_store USING brin (created_at);

-- Dedicated index on event_store for fast global event lookups
CREATE INDEX idx_event_store_id ON event_store (event_id);

-- GIN Indexes for deep JSONB searches
CREATE INDEX idx_event_store_payload_gin ON event_store USING gin (payload);
CREATE INDEX idx_broker_order_payload_gin ON broker_order_events USING gin (raw_payload);
CREATE INDEX idx_strategy_weights_gin ON strategy_weight_sets USING gin (weights);
