CREATE TABLE strategy_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES strategy_templates(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'inactive',
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE TABLE strategy_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE RESTRICT,
    config_draft JSONB NOT NULL
);

CREATE TABLE strategy_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE RESTRICT,
    version VARCHAR(50) NOT NULL,
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT unique_strategy_version UNIQUE (strategy_id, version)
);

CREATE TABLE strategy_formula_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_version_id UUID NOT NULL REFERENCES strategy_versions(id) ON DELETE RESTRICT,
    formula_dsl TEXT NOT NULL
);

CREATE TABLE strategy_weight_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_version_id UUID NOT NULL REFERENCES strategy_versions(id) ON DELETE RESTRICT,
    weights JSONB NOT NULL
);

CREATE TABLE strategy_universes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_version_id UUID NOT NULL REFERENCES strategy_versions(id) ON DELETE RESTRICT,
    symbols VARCHAR(50)[] NOT NULL
);

CREATE TABLE strategy_risk_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_version_id UUID NOT NULL REFERENCES strategy_versions(id) ON DELETE RESTRICT,
    max_leverage NUMERIC(10, 4) NOT NULL,
    max_drawdown NUMERIC(10, 4) NOT NULL
);

CREATE TABLE strategy_validation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_version_id UUID NOT NULL REFERENCES strategy_versions(id) ON DELETE RESTRICT,
    is_valid BOOLEAN NOT NULL
);

CREATE TABLE backtest_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_version_id UUID NOT NULL REFERENCES strategy_versions(id) ON DELETE RESTRICT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'running'
);

CREATE TABLE backtest_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backtest_id UUID NOT NULL REFERENCES backtest_runs(id) ON DELETE RESTRICT,
    file_path TEXT NOT NULL,
    artifact_type VARCHAR(100) NOT NULL
);

CREATE TABLE backtest_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backtest_id UUID NOT NULL REFERENCES backtest_runs(id) ON DELETE RESTRICT,
    comparison_key VARCHAR(100) NOT NULL,
    comparison_value NUMERIC(20, 8) NOT NULL
);

CREATE TABLE paper_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_version_id UUID NOT NULL REFERENCES strategy_versions(id) ON DELETE RESTRICT,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE paper_session_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES paper_sessions(id) ON DELETE RESTRICT,
    pnl NUMERIC(20, 8) NOT NULL,
    drawdown NUMERIC(20, 8) NOT NULL
);

CREATE TABLE paper_session_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES paper_sessions(id) ON DELETE RESTRICT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    signal_type VARCHAR(50) NOT NULL
);

CREATE TABLE paper_session_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES paper_sessions(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT
);

CREATE TABLE signal_traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backtest_id UUID NOT NULL REFERENCES backtest_runs(id) ON DELETE RESTRICT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    trace_data JSONB NOT NULL
);

CREATE TABLE risk_trace_fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    fixture_data JSONB NOT NULL
);

CREATE TABLE parity_check_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    mismatches_found INTEGER NOT NULL
);

CREATE TABLE strategy_stability_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_version_id UUID NOT NULL REFERENCES strategy_versions(id) ON DELETE RESTRICT,
    score NUMERIC(5, 2) NOT NULL
);

CREATE TABLE strategy_promotion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_version_id UUID NOT NULL REFERENCES strategy_versions(id) ON DELETE RESTRICT,
    requested_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
);

CREATE TABLE strategy_live_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES strategy_promotion_requests(id) ON DELETE RESTRICT,
    approved_by UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE strategy_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_version_id UUID NOT NULL REFERENCES strategy_versions(id) ON DELETE RESTRICT,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'active'
);

CREATE TABLE strategy_activation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES strategy_deployments(id) ON DELETE RESTRICT,
    event_type VARCHAR(100) NOT NULL
);

CREATE TABLE strategy_runtime_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES strategy_deployments(id) ON DELETE RESTRICT,
    host_address VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'running'
);

CREATE TABLE strategy_runtime_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES strategy_runtime_instances(id) ON DELETE RESTRICT,
    snapshot_time TIMESTAMP WITH TIME ZONE NOT NULL,
    snapshot_data JSONB NOT NULL
);

CREATE TABLE strategy_runtime_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES strategy_runtime_instances(id) ON DELETE RESTRICT,
    checkpoint_time TIMESTAMP WITH TIME ZONE NOT NULL,
    checkpoint_data JSONB NOT NULL
);

CREATE TABLE strategy_runtime_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES strategy_runtime_instances(id) ON DELETE RESTRICT,
    lock_key VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE strategy_execution_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_version_id UUID NOT NULL REFERENCES strategy_versions(id) ON DELETE RESTRICT,
    parameter_key VARCHAR(100) NOT NULL,
    parameter_value VARCHAR(255) NOT NULL
);
