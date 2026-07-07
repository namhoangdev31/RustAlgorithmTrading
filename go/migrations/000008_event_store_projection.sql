CREATE TABLE event_streams (
    id VARCHAR(255) PRIMARY KEY,
    stream_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE event_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id VARCHAR(255) NOT NULL REFERENCES event_streams(id) ON DELETE RESTRICT,
    last_version BIGINT NOT NULL,
    snapshot_state JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE event_schema_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    schema_definition TEXT NOT NULL
);

CREATE TABLE command_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE command_results (
    command_id UUID PRIMARY KEY REFERENCES command_requests(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL,
    response_payload JSONB,
    error_message TEXT
);

CREATE TABLE projection_offsets (
    projection_name VARCHAR(255) NOT NULL,
    consumer_group VARCHAR(255) NOT NULL,
    stream_id VARCHAR(255) NOT NULL REFERENCES event_streams(id) ON DELETE RESTRICT,
    last_seen_version BIGINT NOT NULL,
    last_event_id UUID,
    last_sequence BIGINT,
    last_schema_version VARCHAR(50),
    last_error TEXT,
    rebuild_started_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (projection_name, consumer_group, stream_id)
);

CREATE TABLE projection_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projection_name VARCHAR(255) NOT NULL,
    stream_id VARCHAR(255) NOT NULL,
    failed_version BIGINT NOT NULL,
    error_message TEXT NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE read_model_versions (
    model_name VARCHAR(255) PRIMARY KEY,
    schema_version VARCHAR(50) NOT NULL
);

CREATE TABLE replay_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id VARCHAR(255) NOT NULL,
    start_version BIGINT NOT NULL,
    end_version BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
);

CREATE TABLE inbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id VARCHAR(255) NOT NULL UNIQUE,
    payload JSONB NOT NULL,
    is_processed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Event Store Parent (Partitioned)
CREATE TABLE event_store (
    event_id UUID NOT NULL,
    stream_id VARCHAR(255) NOT NULL REFERENCES event_streams(id) ON DELETE RESTRICT,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    aggregate_version BIGINT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_version INTEGER NOT NULL,
    schema_version VARCHAR(50) NOT NULL,
    command_id UUID,
    causation_id UUID,
    correlation_id UUID,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (created_at, event_id),
    CONSTRAINT unique_event_stream_version UNIQUE (stream_id, aggregate_version, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE outbox_events (
    id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (created_at, id)
) PARTITION BY RANGE (created_at);
