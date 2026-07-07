CREATE TABLE websocket_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    connection_id VARCHAR(255) NOT NULL UNIQUE,
    connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE websocket_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES websocket_sessions(id) ON DELETE RESTRICT,
    topic VARCHAR(255) NOT NULL,
    CONSTRAINT unique_session_topic UNIQUE (session_id, topic)
);

CREATE TABLE websocket_resume_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES websocket_sessions(id) ON DELETE RESTRICT,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE websocket_ack_offsets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES websocket_sessions(id) ON DELETE RESTRICT,
    topic VARCHAR(255) NOT NULL,
    last_ack_sequence BIGINT NOT NULL,
    CONSTRAINT unique_session_topic_ack UNIQUE (session_id, topic)
);

CREATE TABLE websocket_replay_windows (
    id UUID NOT NULL,
    session_id UUID NOT NULL REFERENCES websocket_sessions(id) ON DELETE RESTRICT,
    requested_topic VARCHAR(255) NOT NULL,
    start_sequence BIGINT NOT NULL,
    end_sequence BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (created_at, id)
) PARTITION BY RANGE (created_at);

CREATE TABLE notification_channels (
    id VARCHAR(50) PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    channel_id VARCHAR(50) NOT NULL REFERENCES notification_channels(id) ON DELETE RESTRICT,
    event_category VARCHAR(100) NOT NULL,
    is_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT unique_user_pref UNIQUE (user_id, channel_id, event_category)
);

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    body_template TEXT NOT NULL
);

CREATE TABLE notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    template_id UUID REFERENCES notification_templates(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE feature_flags (
    id VARCHAR(100) PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE feature_flag_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_id VARCHAR(100) NOT NULL REFERENCES feature_flags(id) ON DELETE RESTRICT,
    rule_type VARCHAR(50) NOT NULL,
    rule_value TEXT NOT NULL
);

CREATE TABLE feature_flag_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_id VARCHAR(100) NOT NULL REFERENCES feature_flags(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    evaluated_value BOOLEAN NOT NULL,
    evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE config_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    namespace VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE config_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_set_id UUID NOT NULL REFERENCES config_sets(id) ON DELETE RESTRICT,
    version INTEGER NOT NULL,
    payload JSONB NOT NULL,
    CONSTRAINT unique_namespace_version UNIQUE (config_set_id, version)
);

CREATE TABLE config_change_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES config_versions(id) ON DELETE RESTRICT,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open'
);

CREATE TABLE incident_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE RESTRICT,
    message TEXT NOT NULL,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE system_components (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'healthy'
);

CREATE TABLE service_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_id VARCHAR(100) NOT NULL REFERENCES system_components(id) ON DELETE RESTRICT,
    is_alive BOOLEAN NOT NULL,
    checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    threshold NUMERIC(20, 8) NOT NULL
);

CREATE TABLE alert_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES alert_rules(id) ON DELETE RESTRICT,
    severity VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE alert_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_event_id UUID NOT NULL REFERENCES alert_events(id) ON DELETE RESTRICT,
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL
);

CREATE TABLE provider_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    raw_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE provider_event_errors (
    event_id UUID PRIMARY KEY REFERENCES provider_events(id) ON DELETE RESTRICT,
    error_message TEXT NOT NULL
);

CREATE TABLE metric_rollups (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    resolution VARCHAR(50) NOT NULL,
    min_value DOUBLE PRECISION NOT NULL,
    max_value DOUBLE PRECISION NOT NULL,
    avg_value DOUBLE PRECISION NOT NULL,
    sample_count BIGINT NOT NULL
);

CREATE TABLE audit_events (
    id UUID NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (created_at, id)
) PARTITION BY RANGE (created_at);

CREATE TABLE metric_samples (
    id BIGSERIAL,
    metric_name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (timestamp, id)
) PARTITION BY RANGE (timestamp);
