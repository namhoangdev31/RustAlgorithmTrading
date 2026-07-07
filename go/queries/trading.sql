-- name: GetUser :one
SELECT id, username, email, password_hash, status, created_at, updated_at
FROM users
WHERE id = $1 AND deleted_at IS NULL LIMIT 1;

-- name: CreateUser :one
INSERT INTO users (username, email, password_hash, status)
VALUES ($1, $2, $3, $4)
RETURNING id, username, email, status, created_at;

-- name: GetActiveSession :one
SELECT id, user_id, token_hash, ip_address, user_agent, is_valid, expires_at
FROM sessions
WHERE token_hash = $1 AND is_valid = TRUE AND expires_at > NOW() LIMIT 1;

-- name: GetAccount :one
SELECT id, user_id, account_number, broker_name, currency, balance, status, version
FROM accounts
WHERE id = $1 AND deleted_at IS NULL LIMIT 1;

-- name: UpdateAccountBalance :one
UPDATE accounts
SET balance = $1, version = version + 1, updated_at = NOW()
WHERE id = $2 AND version = $3
RETURNING id, balance, version;

-- name: GetPosition :one
SELECT id, account_id, symbol, quantity, average_entry_price, realized_pnl, version
FROM positions
WHERE account_id = $1 AND symbol = $2 LIMIT 1;

-- name: UpdatePosition :one
UPDATE positions
SET quantity = $1, average_entry_price = $2, realized_pnl = $3, version = version + 1, updated_at = NOW()
WHERE id = $4 AND version = $5
RETURNING id, quantity, average_entry_price, realized_pnl, version;

-- name: GetOrder :one
SELECT id, account_id, symbol, client_order_id, side, type, price, quantity, filled_quantity, remaining_quantity, status, time_in_force, version, submitted_at
FROM orders
WHERE id = $1 AND deleted_at IS NULL LIMIT 1;

-- name: InsertOrder :one
INSERT INTO orders (account_id, symbol, client_order_id, side, type, price, quantity, status, time_in_force)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, remaining_quantity, status, version;

-- name: UpdateOrderStatus :one
UPDATE orders
SET status = $1, filled_quantity = $2, version = version + 1, updated_at = NOW()
WHERE id = $3 AND version = $4
RETURNING id, remaining_quantity, status, version;

-- name: InsertFill :one
INSERT INTO fills (order_id, broker_order_id, fill_id, price, quantity, fee)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, total_value, filled_at;

-- name: InsertEventStore :one
INSERT INTO event_store (event_id, stream_id, aggregate_type, aggregate_id, aggregate_version, event_type, event_version, schema_version, command_id, causation_id, correlation_id, payload, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
RETURNING event_id, aggregate_version, created_at;

-- name: GetProjectionOffset :one
SELECT projection_name, consumer_group, stream_id, last_seen_version, last_event_id, last_sequence, last_schema_version, last_error, rebuild_started_at, updated_at
FROM projection_offsets
WHERE projection_name = $1 AND consumer_group = $2 AND stream_id = $3 LIMIT 1;

-- name: UpdateProjectionOffset :exec
INSERT INTO projection_offsets (projection_name, consumer_group, stream_id, last_seen_version, last_event_id, last_sequence, last_schema_version, last_error, rebuild_started_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
ON CONFLICT (projection_name, consumer_group, stream_id) DO UPDATE
SET last_seen_version = EXCLUDED.last_seen_version,
    last_event_id = EXCLUDED.last_event_id,
    last_sequence = EXCLUDED.last_sequence,
    last_schema_version = EXCLUDED.last_schema_version,
    last_error = EXCLUDED.last_error,
    rebuild_started_at = EXCLUDED.rebuild_started_at,
    updated_at = NOW();

-- name: CheckIdempotencyKey :one
SELECT shard_key, key, endpoint, request_hash, status, response_status, response_body, expires_at, locked_until
FROM idempotency_keys
WHERE shard_key = $1 AND key = $2 LIMIT 1;

-- name: InsertIdempotencyKey :one
INSERT INTO idempotency_keys (shard_key, key, endpoint, request_hash, status, expires_at, locked_until)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING shard_key, key, status;
