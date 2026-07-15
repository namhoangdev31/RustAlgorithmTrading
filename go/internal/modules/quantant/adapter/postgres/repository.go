package postgres

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"

	"trading/control-gateway/internal/modules/quantant/application"
	domain "trading/control-gateway/internal/modules/quantant/contract"
)

type Repository struct{ db *sql.DB }

func New(db *sql.DB) *Repository { return &Repository{db: db} }

func (r *Repository) Accounts(ctx context.Context, operatorID string) ([]domain.AccountSummary, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT a.id, a.display_name, a.provider, a.base_currency
		FROM quant_broker_accounts a
		JOIN quant_operator_grants g ON g.account_id=a.id
		WHERE g.operator_id=$1 AND g.revoked_at IS NULL AND a.is_enabled=true
		ORDER BY a.display_name`, operatorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []domain.AccountSummary{}
	for rows.Next() {
		var item domain.AccountSummary
		if err := rows.Scan(&item.ID, &item.DisplayName, &item.Provider, &item.BaseCurrency); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) ListInstruments(ctx context.Context, query string, limit int, cursor string) ([]domain.Instrument, string, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, provider, provider_symbol, canonical_symbol, display_name, asset_class,
		       exchange, currency, timezone, price_scale, quantity_scale,
		       market_data_level, execution_level, capabilities
		FROM quant_instruments
		WHERE is_active = true AND ($1 = '' OR canonical_symbol ILIKE '%' || $1 || '%' OR display_name ILIKE '%' || $1 || '%')
		  AND ($2 = '' OR canonical_symbol > $2)
		ORDER BY canonical_symbol LIMIT $3`, query, cursor, limit+1)
	if err != nil {
		return nil, "", err
	}
	defer rows.Close()
	items := make([]domain.Instrument, 0, limit)
	for rows.Next() {
		var item domain.Instrument
		if err := rows.Scan(&item.ID, &item.Provider, &item.ProviderSymbol, &item.CanonicalSymbol, &item.DisplayName, &item.AssetClass,
			&item.Exchange, &item.Currency, &item.Timezone, &item.PriceScale, &item.QuantityScale,
			&item.MarketDataLevel, &item.ExecutionLevel, &item.Capabilities); err != nil {
			return nil, "", err
		}
		items = append(items, item)
	}
	page, next := paginateInstruments(items, limit)
	return page, next, rows.Err()
}

func paginateInstruments(items []domain.Instrument, limit int) ([]domain.Instrument, string) {
	if len(items) <= limit {
		return items, ""
	}
	next := items[limit-1].CanonicalSymbol
	return items[:limit], next
}

func (r *Repository) Instrument(ctx context.Context, id string) (domain.Instrument, error) {
	var item domain.Instrument
	err := r.db.QueryRowContext(ctx, `
		SELECT id, provider, provider_symbol, canonical_symbol, display_name, asset_class,
		       exchange, currency, timezone, price_scale, quantity_scale,
		       market_data_level, execution_level, capabilities
		FROM quant_instruments WHERE id = $1 AND is_active = true`, id).Scan(
		&item.ID, &item.Provider, &item.ProviderSymbol, &item.CanonicalSymbol, &item.DisplayName, &item.AssetClass,
		&item.Exchange, &item.Currency, &item.Timezone, &item.PriceScale, &item.QuantityScale,
		&item.MarketDataLevel, &item.ExecutionLevel, &item.Capabilities,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return item, application.ErrNotFound
	}
	return item, err
}

func (r *Repository) ListOrders(ctx context.Context, accountID string, limit int, cursor string) ([]domain.Order, string, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT o.id, o.account_id, o.instrument_id, i.canonical_symbol, o.client_order_id,
		       o.broker_order_id, o.mode, o.side, o.order_type, o.time_in_force,
		       o.quantity::text, o.limit_price::text, o.stop_price::text,
		       o.take_profit_price::text, o.stop_loss_price::text, o.trail_value::text,
		       o.status, o.version, o.created_at
		FROM quant_orders o JOIN quant_instruments i ON i.id = o.instrument_id
		WHERE o.account_id = $1 AND ($2 = '' OR o.created_at < $2::timestamptz)
		ORDER BY o.created_at DESC LIMIT $3`, accountID, cursor, limit+1)
	if err != nil {
		return nil, "", err
	}
	defer rows.Close()
	items := make([]domain.Order, 0, limit)
	for rows.Next() {
		var item domain.Order
		if err := rows.Scan(&item.ID, &item.AccountID, &item.InstrumentID, &item.Symbol, &item.ClientOrderID,
			&item.BrokerOrderID, &item.Mode, &item.Side, &item.OrderType, &item.TimeInForce,
			&item.Quantity, &item.LimitPrice, &item.StopPrice, &item.TakeProfitPrice, &item.StopLossPrice,
			&item.TrailValue, &item.Status, &item.Version, &item.CreatedAt); err != nil {
			return nil, "", err
		}
		items = append(items, item)
	}
	if len(items) <= limit {
		return items, "", rows.Err()
	}
	next := items[limit-1].CreatedAt.UTC().Format(time.RFC3339Nano)
	return items[:limit], next, rows.Err()
}

func (r *Repository) ListPositions(ctx context.Context, accountID string) ([]domain.Position, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT p.id, p.account_id, p.instrument_id, i.canonical_symbol, p.mode,
		       p.quantity::text, p.average_price::text, p.realized_pnl::text, p.reconciled_at
		FROM quant_positions p JOIN quant_instruments i ON i.id = p.instrument_id
		WHERE p.account_id = $1 AND p.quantity <> 0 ORDER BY abs(p.quantity) DESC`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []domain.Position{}
	for rows.Next() {
		var item domain.Position
		if err := rows.Scan(&item.ID, &item.AccountID, &item.InstrumentID, &item.Symbol, &item.Mode,
			&item.Quantity, &item.AveragePrice, &item.RealizedPnL, &item.ReconciledAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) ListRecords(ctx context.Context, kind, accountID string, limit int, cursor string) ([]domain.Record, string, error) {
	query, err := recordQuery(kind)
	if err != nil {
		return nil, "", err
	}
	rows, err := r.db.QueryContext(ctx, query, accountID, cursor, limit+1)
	if err != nil {
		return nil, "", err
	}
	defer rows.Close()
	items := make([]domain.Record, 0, limit)
	for rows.Next() {
		var item domain.Record
		if err := rows.Scan(&item.ID, &item.Status, &item.Name, &item.Payload, &item.CreatedAt); err != nil {
			return nil, "", err
		}
		items = append(items, item)
	}
	if len(items) <= limit {
		return items, "", rows.Err()
	}
	next := items[limit-1].CreatedAt.UTC().Format(time.RFC3339Nano)
	return items[:limit], next, rows.Err()
}

func recordQuery(kind string) (string, error) {
	switch kind {
	case "strategies":
		return `SELECT s.id, s.lifecycle::text, s.name, json_build_object('template_key', s.template_key, 'current_version_id', s.current_version_id), s.created_at FROM quant_strategies s WHERE s.account_id = $1 AND ($2 = '' OR s.created_at < $2::timestamptz) ORDER BY s.created_at DESC LIMIT $3`, nil
	case "backtests":
		return `SELECT b.id, b.status, '', json_build_object('strategy_version_id', b.strategy_version_id, 'progress_percent', b.progress_percent::text, 'result', b.result, 'error', b.error), b.created_at FROM quant_backtest_runs b JOIN quant_strategy_versions v ON v.id=b.strategy_version_id JOIN quant_strategies s ON s.id=v.strategy_id WHERE s.account_id = $1 AND ($2 = '' OR b.created_at < $2::timestamptz) ORDER BY b.created_at DESC LIMIT $3`, nil
	case "deployments":
		return `SELECT d.id, d.status, '', json_build_object('strategy_id', d.strategy_id, 'strategy_version_id', d.strategy_version_id, 'mode', d.mode, 'desired_state', d.desired_state, 'actual_state', d.actual_state, 'version', d.version), d.created_at FROM quant_deployments d WHERE d.account_id = $1 AND ($2 = '' OR d.created_at < $2::timestamptz) ORDER BY d.created_at DESC LIMIT $3`, nil
	case "alerts":
		return `SELECT a.id, a.severity, a.title, json_build_object('type', a.type, 'message', a.message, 'payload', a.payload, 'acknowledged_at', a.acknowledged_at, 'resolved_at', a.resolved_at), a.created_at FROM quant_alerts a WHERE (a.account_id = $1 OR a.account_id IS NULL) AND ($2 = '' OR a.created_at < $2::timestamptz) ORDER BY a.created_at DESC LIMIT $3`, nil
	case "audit-events":
		return `SELECT e.id, e.action, e.aggregate_type, json_build_object('aggregate_id', e.aggregate_id, 'correlation_id', e.correlation_id, 'step_up', e.step_up, 'before', e.before, 'after', e.after, 'occurred_at', e.occurred_at), e.created_at FROM quant_audit_events e WHERE (e.account_id = $1 OR e.account_id IS NULL) AND ($2 = '' OR e.created_at < $2::timestamptz) ORDER BY e.created_at DESC LIMIT $3`, nil
	default:
		return "", application.ErrInvalid
	}
}

func (r *Repository) RiskSnapshot(ctx context.Context, accountID string) ([]byte, string, error) {
	var policy []byte
	var hash string
	err := r.db.QueryRowContext(ctx, `
		SELECT policy, policy_hash FROM quant_risk_policy_versions
		WHERE account_id = $1 AND status = 'active' AND effective_at <= now()
		ORDER BY version DESC LIMIT 1`, accountID).Scan(&policy, &hash)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, "", application.ErrUnavailable
	}
	return policy, hash, err
}

func (r *Repository) ValidateLiveSession(ctx context.Context, operatorID, accountID, token string, now time.Time) (time.Time, error) {
	digest := sha256.Sum256([]byte(token))
	var expiresAt time.Time
	err := r.db.QueryRowContext(ctx, `
		SELECT expires_at FROM quant_live_sessions
		WHERE operator_id=$1 AND account_id=$2 AND session_token_hash=$3
		  AND revoked_at IS NULL AND expires_at > $4
		ORDER BY expires_at DESC LIMIT 1`, operatorID, accountID, hex.EncodeToString(digest[:]), now).Scan(&expiresAt)
	if errors.Is(err, sql.ErrNoRows) {
		return time.Time{}, application.ErrForbidden
	}
	if err != nil {
		return time.Time{}, err
	}
	return expiresAt, nil
}

func (r *Repository) CreateOrder(ctx context.Context, params application.CreateOrderParams) (domain.Order, bool, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return domain.Order{}, false, err
	}
	defer tx.Rollback()
	claimed, existing, err := claimIdempotency(ctx, tx, params.OperatorID, params.IdempotencyKey, params.RequestHash)
	if err != nil || !claimed {
		return existing, !claimed, err
	}
	order := domain.Order{
		ID: uuid.NewString(), AccountID: params.Request.AccountID, InstrumentID: params.Request.InstrumentID,
		Symbol: params.Instrument.CanonicalSymbol, ClientOrderID: params.ClientOrderID,
		Mode: params.Request.Mode, Side: params.Request.Side, OrderType: params.Request.OrderType,
		TimeInForce: params.Request.TimeInForce, Quantity: params.Request.Quantity,
		LimitPrice: params.Request.LimitPrice, StopPrice: params.Request.StopPrice,
		TakeProfitPrice: params.Request.TakeProfitPrice, StopLossPrice: params.Request.StopLossPrice,
		TrailValue: params.Request.TrailValue, Status: "pending", Version: 1, CreatedAt: time.Now().UTC(),
	}
	_, err = tx.ExecContext(ctx, `
		INSERT INTO quant_orders
		(id, account_id, instrument_id, client_order_id, idempotency_key, mode, side, order_type,
		 time_in_force, quantity, limit_price, stop_price, trail_value, take_profit_price,
		 stop_loss_price, status, version, strategy_version_hash, risk_snapshot, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::numeric,$11::numeric,$12::numeric,$13::numeric,$14::numeric,$15::numeric,'pending',1,$16,$17::jsonb,$18,$18)`,
		order.ID, order.AccountID, order.InstrumentID, order.ClientOrderID, params.IdempotencyKey,
		order.Mode, order.Side, order.OrderType, order.TimeInForce, order.Quantity,
		order.LimitPrice, order.StopPrice, order.TrailValue, order.TakeProfitPrice, order.StopLossPrice,
		params.Request.StrategyVersionHash, string(params.RiskSnapshot), order.CreatedAt)
	if err != nil {
		return domain.Order{}, false, err
	}
	payload, _ := json.Marshal(params.Command)
	if err := appendOutboxAndAudit(ctx, tx, params.ClientOrderID, "execution.command.created", payload, params.OperatorID, params.Request.AccountID, string(params.Request.Mode), "order.submit", params.CorrelationID, params.LiveExpiresAt != nil); err != nil {
		return domain.Order{}, false, err
	}
	response, _ := json.Marshal(order)
	if _, err := tx.ExecContext(ctx, `UPDATE quant_idempotency_keys SET status_code=202, response=$1::jsonb, updated_at=now() WHERE operator_id=$2 AND key=$3`, string(response), params.OperatorID, params.IdempotencyKey); err != nil {
		return domain.Order{}, false, err
	}
	return order, false, tx.Commit()
}

func claimIdempotency(ctx context.Context, tx *sql.Tx, operatorID, key, requestHash string) (bool, domain.Order, error) {
	result, err := tx.ExecContext(ctx, `
		INSERT INTO quant_idempotency_keys (id, operator_id, key, request_hash, locked_until, expires_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,now()+interval '30 seconds',now()+interval '24 hours',now(),now())
		ON CONFLICT (operator_id,key) DO NOTHING`, uuid.NewString(), operatorID, key, requestHash)
	if err != nil {
		return false, domain.Order{}, err
	}
	count, _ := result.RowsAffected()
	if count == 1 {
		return true, domain.Order{}, nil
	}
	var existingHash string
	var response []byte
	if err := tx.QueryRowContext(ctx, `SELECT request_hash, response FROM quant_idempotency_keys WHERE operator_id=$1 AND key=$2`, operatorID, key).Scan(&existingHash, &response); err != nil {
		return false, domain.Order{}, err
	}
	if existingHash != requestHash {
		return false, domain.Order{}, application.ErrConflict
	}
	var order domain.Order
	if len(response) == 0 || json.Unmarshal(response, &order) != nil {
		return false, domain.Order{}, application.ErrConflict
	}
	return false, order, nil
}

func (r *Repository) CreateSafetyCommand(ctx context.Context, params application.SafetyCommandParams) (domain.ExecutionCommand, error) {
	payload := map[string]any{}
	if params.Type == "cancel_order" {
		if params.Request.OrderID == nil {
			return domain.ExecutionCommand{}, application.ErrInvalid
		}
		payload["order_id"] = *params.Request.OrderID
	} else {
		if params.Request.Symbol == nil {
			return domain.ExecutionCommand{}, application.ErrInvalid
		}
		payload["symbol"], payload["quantity"] = *params.Request.Symbol, params.Request.Quantity
	}
	raw, _ := json.Marshal(payload)
	digest := sha256.Sum256([]byte(params.OperatorID + ":" + params.IdempotencyKey))
	command := domain.ExecutionCommand{SchemaVersion: 1, CommandID: hex.EncodeToString(digest[:]), CorrelationID: params.CorrelationID, Type: params.Type, Payload: raw}
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return command, err
	}
	defer tx.Rollback()
	commandRaw, _ := json.Marshal(command)
	if err := appendOutboxAndAudit(ctx, tx, command.CommandID, "execution.safety-command.created", commandRaw, params.OperatorID, params.Request.AccountID, "", "order."+params.Type, params.CorrelationID, false); err != nil {
		return command, err
	}
	return command, tx.Commit()
}

func appendOutboxAndAudit(ctx context.Context, tx *sql.Tx, aggregateID, eventType string, payload []byte, operatorID, accountID, mode, action, correlationID string, stepUp bool) error {
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO quant_outbox_events (id, aggregate_type, aggregate_id, sequence, type, schema_version, payload, occurred_at, attempts, created_at)
		VALUES ($1,'execution_command',$2,1,$3,1,$4::jsonb,now(),0,now())
		ON CONFLICT (aggregate_type,aggregate_id,sequence) DO NOTHING`, uuid.NewString(), aggregateID, eventType, string(payload)); err != nil {
		return err
	}
	_, err := tx.ExecContext(ctx, `
		INSERT INTO quant_audit_events
		(id, operator_id, account_id, mode, action, aggregate_type, aggregate_id, correlation_id, step_up, occurred_at, created_at)
		VALUES ($1,$2,$3,NULLIF($4,'')::"QuantTradingMode",$5,'execution_command',$6,$7,$8,now(),now())`,
		uuid.NewString(), operatorID, accountID, mode, action, aggregateID, correlationID, stepUp)
	return err
}

func (r *Repository) MarkPublished(ctx context.Context, aggregateID string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE quant_outbox_events SET published_at=now(), attempts=attempts+1 WHERE aggregate_id=$1 AND published_at IS NULL`, aggregateID)
	return err
}

func (r *Repository) MarkAttempt(ctx context.Context, aggregateID string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE quant_outbox_events SET attempts=attempts+1 WHERE aggregate_id=$1 AND published_at IS NULL`, aggregateID)
	return err
}

func (r *Repository) PendingCommands(ctx context.Context, limit int) ([]domain.ExecutionCommand, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT payload FROM quant_outbox_events
		WHERE published_at IS NULL AND attempts < 20 AND aggregate_type='execution_command'
		ORDER BY created_at LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	commands := []domain.ExecutionCommand{}
	for rows.Next() {
		var raw []byte
		if err := rows.Scan(&raw); err != nil {
			return nil, err
		}
		var command domain.ExecutionCommand
		if json.Unmarshal(raw, &command) == nil && command.CommandID != "" {
			commands = append(commands, command)
		}
	}
	return commands, rows.Err()
}

func (r *Repository) Close() error { return nil }

var _ application.Repository = (*Repository)(nil)
