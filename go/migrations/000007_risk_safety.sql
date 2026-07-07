CREATE TABLE risk_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE risk_limit_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    limit_id UUID NOT NULL REFERENCES risk_limits(id) ON DELETE RESTRICT,
    version INTEGER NOT NULL,
    max_notional NUMERIC(20, 8) NOT NULL,
    max_drawdown NUMERIC(20, 8) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE risk_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status risk_decision_status NOT NULL,
    decision_reason VARCHAR(255),
    latency_ms NUMERIC(10, 4) NOT NULL,
    checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE pre_trade_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    limit_version_id UUID REFERENCES risk_limit_versions(id) ON DELETE RESTRICT,
    decision_id UUID NOT NULL REFERENCES risk_decisions(id) ON DELETE RESTRICT,
    check_name VARCHAR(100) NOT NULL,
    passed BOOLEAN NOT NULL
);

CREATE TABLE risk_decision_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES risk_decisions(id) ON DELETE RESTRICT,
    input_key VARCHAR(100) NOT NULL,
    input_value JSONB NOT NULL
);

CREATE TABLE intraday_risk_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    snapshot_time TIMESTAMP WITH TIME ZONE NOT NULL,
    current_drawdown NUMERIC(20, 8) NOT NULL,
    margin_utilization NUMERIC(5, 4) NOT NULL
);

CREATE TABLE post_trade_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID REFERENCES trades(id) ON DELETE RESTRICT,
    review_status VARCHAR(50) NOT NULL,
    violation_details TEXT
);

CREATE TABLE exposure_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    symbol VARCHAR(50) NOT NULL REFERENCES products(symbol) ON DELETE RESTRICT,
    exposure_amount NUMERIC(20, 8) NOT NULL
);

CREATE TABLE margin_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    margin_requirement NUMERIC(20, 8) NOT NULL,
    checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE stop_loss_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE RESTRICT,
    trigger_price NUMERIC(20, 8) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE circuit_breaker_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(50) NOT NULL REFERENCES products(symbol) ON DELETE RESTRICT,
    event_type VARCHAR(100) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE kill_switch_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_type VARCHAR(50) NOT NULL,
    scope_id VARCHAR(100),
    activated_by UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE risk_rule_templates (
    id VARCHAR(50) PRIMARY KEY,
    description TEXT NOT NULL
);
