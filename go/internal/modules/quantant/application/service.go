package application

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/google/uuid"

	domain "trading/control-gateway/internal/modules/quantant/contract"
)

var (
	ErrInvalid     = errors.New("quantant invalid request")
	ErrForbidden   = errors.New("quantant forbidden")
	ErrNotFound    = errors.New("quantant not found")
	ErrConflict    = errors.New("quantant conflict")
	ErrUnavailable = errors.New("quantant unavailable")
	ErrUnsupported = errors.New("quantant unsupported capability")
)

type Config struct {
	Enabled             bool
	LiveEnabled         bool
	StrategyLiveEnabled bool
	LiveSessionTTL      time.Duration
}

type Service struct {
	repository Repository
	market     MarketReader
	publisher  CommandPublisher
	config     Config
	now        func() time.Time
}

func New(repository Repository, market MarketReader, publisher CommandPublisher, config Config) *Service {
	return &Service{repository: repository, market: market, publisher: publisher, config: config, now: time.Now}
}

func (s *Service) Bootstrap(ctx context.Context, operatorID string) (domain.Snapshot, error) {
	accounts, err := s.repository.Accounts(ctx, operatorID)
	if err != nil {
		return domain.Snapshot{}, err
	}
	data := domain.Bootstrap{
		Enabled: s.config.Enabled, DefaultMode: domain.ModePaper,
		LiveEnabled: s.config.LiveEnabled, StrategyLiveEnabled: s.config.StrategyLiveEnabled,
		LiveSessionTTL: int64(s.config.LiveSessionTTL.Seconds()),
		Limits:         map[string]int{"devices": 25, "instruments": 1000, "active_strategies": 20},
		Capabilities: map[string]any{
			"offline_commands": false, "decimal_encoding": "string", "resume_sequence": true,
			"asset_classes": []string{"equity", "crypto", "forex", "index", "commodity_future"},
		},
		Endpoints: map[string]string{"websocket": "/ws/v1/quantant", "api": "/api/v1/quantant"},
		Accounts:  accounts,
	}
	return snapshot(data, s.now()), nil
}

func (s *Service) Instruments(ctx context.Context, query string, limit int, cursor string) (domain.Snapshot, error) {
	items, next, err := s.repository.ListInstruments(ctx, query, clamp(limit), cursor)
	return snapshotWithCursor(items, next, s.now()), err
}

func (s *Service) Instrument(ctx context.Context, id string) (domain.Snapshot, error) {
	item, err := s.repository.Instrument(ctx, id)
	return snapshot(item, s.now()), err
}

func (s *Service) Candles(ctx context.Context, instrumentID, interval string, from, to time.Time, limit int) (domain.Snapshot, error) {
	instrument, err := s.repository.Instrument(ctx, instrumentID)
	if err != nil {
		return domain.Snapshot{}, err
	}
	items, asOf, err := s.market.Candles(ctx, instrument.CanonicalSymbol, interval, from, to, clamp(limit))
	return snapshot(items, asOf), err
}

func (s *Service) Portfolio(ctx context.Context, accountID string, mode domain.TradingMode) (domain.Snapshot, error) {
	value, asOf, err := s.market.Portfolio(ctx, accountID, mode)
	return snapshot(value, asOf), err
}

func (s *Service) Positions(ctx context.Context, accountID string) (domain.Snapshot, error) {
	items, err := s.repository.ListPositions(ctx, accountID)
	return snapshot(items, s.now()), err
}

func (s *Service) Orders(ctx context.Context, accountID string, limit int, cursor string) (domain.Snapshot, error) {
	items, next, err := s.repository.ListOrders(ctx, accountID, clamp(limit), cursor)
	return snapshotWithCursor(items, next, s.now()), err
}

func (s *Service) Records(ctx context.Context, kind, accountID string, limit int, cursor string) (domain.Snapshot, error) {
	items, next, err := s.repository.ListRecords(ctx, kind, accountID, clamp(limit), cursor)
	return snapshotWithCursor(items, next, s.now()), err
}

func (s *Service) SubmitOrder(ctx context.Context, operatorID, idempotencyKey, liveToken, correlationID string, request domain.CreateOrder) (domain.Order, error) {
	if !s.config.Enabled || s.publisher == nil {
		return domain.Order{}, ErrUnavailable
	}
	if _, err := uuid.Parse(operatorID); err != nil || strings.TrimSpace(idempotencyKey) == "" {
		return domain.Order{}, ErrInvalid
	}
	if err := validateOrder(request); err != nil {
		return domain.Order{}, err
	}
	instrument, err := s.repository.Instrument(ctx, request.InstrumentID)
	if err != nil {
		return domain.Order{}, err
	}
	if !supportsMode(instrument.ExecutionLevel, request.Mode) {
		return domain.Order{}, fmt.Errorf("%w: execution.%s", ErrUnsupported, request.Mode)
	}
	if !supportsOrderType(instrument.Capabilities, request.OrderType) {
		return domain.Order{}, fmt.Errorf("%w: order_type.%s", ErrUnsupported, request.OrderType)
	}
	if err := s.market.Fresh(ctx, instrument.CanonicalSymbol, s.now().Add(-5*time.Second)); err != nil {
		return domain.Order{}, fmt.Errorf("%w: stale market data", ErrUnavailable)
	}
	var liveExpiresAt *time.Time
	if request.Mode == domain.ModeLive {
		if !s.config.LiveEnabled || strings.TrimSpace(liveToken) == "" {
			return domain.Order{}, fmt.Errorf("%w: live_session", ErrUnsupported)
		}
		expiresAt, err := s.repository.ValidateLiveSession(ctx, operatorID, request.AccountID, liveToken, s.now())
		if err != nil {
			return domain.Order{}, ErrForbidden
		}
		maximumExpiry := s.now().Add(s.config.LiveSessionTTL)
		if expiresAt.After(maximumExpiry) {
			expiresAt = maximumExpiry
		}
		liveExpiresAt = &expiresAt
	}
	risk, riskHash, err := s.repository.RiskSnapshot(ctx, request.AccountID)
	if err != nil {
		return domain.Order{}, fmt.Errorf("%w: risk policy", ErrUnavailable)
	}
	requestBytes, _ := json.Marshal(request)
	requestDigest := sha256.Sum256(requestBytes)
	clientDigest := sha256.Sum256([]byte(operatorID + ":" + idempotencyKey))
	clientOrderID := hex.EncodeToString(clientDigest[:])
	preview := domain.Order{
		AccountID: request.AccountID, InstrumentID: request.InstrumentID, Symbol: instrument.CanonicalSymbol,
		ClientOrderID: clientOrderID, Mode: request.Mode, Side: request.Side, OrderType: request.OrderType,
		TimeInForce: request.TimeInForce, Quantity: request.Quantity, LimitPrice: request.LimitPrice,
		StopPrice: request.StopPrice, TakeProfitPrice: request.TakeProfitPrice, StopLossPrice: request.StopLossPrice,
		TrailValue: request.TrailValue,
	}
	command, err := orderCommand(preview, riskHash, request.StrategyVersionHash, instrument.CanonicalSymbol, liveExpiresAt, correlationID)
	if err != nil {
		return domain.Order{}, err
	}
	order, replayed, err := s.repository.CreateOrder(ctx, CreateOrderParams{
		Request: request, OperatorID: operatorID, IdempotencyKey: idempotencyKey,
		RequestHash: hex.EncodeToString(requestDigest[:]), CorrelationID: correlationID,
		ClientOrderID: clientOrderID, RiskSnapshot: risk, RiskHash: riskHash,
		Instrument: instrument, LiveExpiresAt: liveExpiresAt, Command: command,
	})
	if err != nil || replayed {
		return order, err
	}
	if err := s.publisher.Publish(ctx, command); err != nil {
		return order, fmt.Errorf("%w: command persisted for retry", ErrUnavailable)
	}
	_ = s.repository.MarkPublished(ctx, order.ClientOrderID)
	return order, nil
}

func (s *Service) SafetyCommand(ctx context.Context, operatorID, idempotencyKey, correlationID, commandType string, request domain.SafetyCommand) error {
	if commandType != "cancel_order" && commandType != "close_position" {
		return ErrInvalid
	}
	if _, err := uuid.Parse(operatorID); err != nil || strings.TrimSpace(idempotencyKey) == "" || strings.TrimSpace(request.AccountID) == "" {
		return ErrInvalid
	}
	command, err := s.repository.CreateSafetyCommand(ctx, SafetyCommandParams{
		Request: request, Type: commandType, OperatorID: operatorID,
		IdempotencyKey: idempotencyKey, CorrelationID: correlationID,
	})
	if err != nil {
		return err
	}
	if err := s.publisher.Publish(ctx, command); err != nil {
		return fmt.Errorf("%w: safety command persisted for retry", ErrUnavailable)
	}
	return s.repository.MarkPublished(ctx, command.CommandID)
}

func (s *Service) RunOutbox(ctx context.Context) error {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			commands, err := s.repository.PendingCommands(ctx, 100)
			if err != nil {
				continue
			}
			for _, command := range commands {
				if s.publisher.Publish(ctx, command) == nil {
					_ = s.repository.MarkPublished(ctx, command.CommandID)
				} else {
					_ = s.repository.MarkAttempt(ctx, command.CommandID)
				}
			}
		}
	}
}

func validateOrder(request domain.CreateOrder) error {
	if request.Mode != domain.ModePaper && request.Mode != domain.ModeLive {
		return ErrInvalid
	}
	if request.Side != "buy" && request.Side != "sell" {
		return ErrInvalid
	}
	quantity, ok := new(big.Rat).SetString(request.Quantity)
	if !ok || quantity.Sign() <= 0 {
		return ErrInvalid
	}
	return nil
}

func supportsMode(level string, mode domain.TradingMode) bool {
	return (mode == domain.ModePaper && (level == "paper" || level == "live")) || (mode == domain.ModeLive && level == "live")
}

func supportsOrderType(raw json.RawMessage, orderType string) bool {
	var capability struct {
		OrderTypes []string `json:"order_types"`
	}
	if json.Unmarshal(raw, &capability) != nil {
		return false
	}
	for _, value := range capability.OrderTypes {
		if value == orderType {
			return true
		}
	}
	return false
}

func orderCommand(order domain.Order, riskHash string, strategyHash *string, symbol string, liveExpiresAt *time.Time, correlationID string) (domain.ExecutionCommand, error) {
	payload, err := json.Marshal(map[string]any{
		"account_id": order.AccountID, "client_order_id": order.ClientOrderID,
		"idempotency_key": order.ClientOrderID, "symbol": symbol, "side": order.Side,
		"order_type": order.OrderType, "quantity": order.Quantity, "limit_price": order.LimitPrice,
		"stop_price": order.StopPrice, "mode": order.Mode, "market_data_observed_at": time.Now().UTC(),
		"risk_snapshot_hash": riskHash, "strategy_version_hash": strategyHash, "live_session_expires_at": liveExpiresAt,
	})
	return domain.ExecutionCommand{SchemaVersion: 1, CommandID: order.ClientOrderID, CorrelationID: correlationID, Type: "submit_order", Payload: payload}, err
}

func snapshot(data any, asOf time.Time) domain.Snapshot {
	state := "loaded"
	if value, ok := data.([]domain.Candle); ok && len(value) == 0 {
		state = "empty"
	}
	return domain.Snapshot{State: state, AsOf: asOf.UTC(), Data: data}
}

func snapshotWithCursor(data any, cursor string, asOf time.Time) domain.Snapshot {
	value := snapshot(data, asOf)
	value.NextCursor = cursor
	return value
}

func clamp(value int) int {
	if value <= 0 {
		return 50
	}
	if value > 200 {
		return 200
	}
	return value
}
