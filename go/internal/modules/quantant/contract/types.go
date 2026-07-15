package contract

import (
	"encoding/json"
	"time"
)

type TradingMode string

const (
	ModePaper TradingMode = "paper"
	ModeLive  TradingMode = "live"
)

type Snapshot struct {
	State      string    `json:"state"`
	AsOf       time.Time `json:"as_of"`
	Sequence   int64     `json:"sequence"`
	Data       any       `json:"data"`
	NextCursor string    `json:"next_cursor,omitempty"`
}

type Bootstrap struct {
	Enabled             bool              `json:"enabled"`
	DefaultMode         TradingMode       `json:"default_mode"`
	LiveEnabled         bool              `json:"live_enabled"`
	StrategyLiveEnabled bool              `json:"strategy_live_enabled"`
	LiveSessionTTL      int64             `json:"live_session_ttl_seconds"`
	Limits              map[string]int    `json:"limits"`
	Capabilities        map[string]any    `json:"capabilities"`
	Endpoints           map[string]string `json:"endpoints"`
	Accounts            []AccountSummary  `json:"accounts"`
}

type AccountSummary struct {
	ID           string `json:"id"`
	DisplayName  string `json:"display_name"`
	Provider     string `json:"provider"`
	BaseCurrency string `json:"base_currency"`
}

type Instrument struct {
	ID              string          `json:"id"`
	Provider        string          `json:"provider"`
	ProviderSymbol  string          `json:"provider_symbol"`
	CanonicalSymbol string          `json:"canonical_symbol"`
	DisplayName     string          `json:"display_name"`
	AssetClass      string          `json:"asset_class"`
	Exchange        *string         `json:"exchange,omitempty"`
	Currency        string          `json:"currency"`
	Timezone        string          `json:"timezone"`
	PriceScale      int             `json:"price_scale"`
	QuantityScale   int             `json:"quantity_scale"`
	MarketDataLevel string          `json:"market_data_level"`
	ExecutionLevel  string          `json:"execution_level"`
	Capabilities    json.RawMessage `json:"capabilities"`
}

type Candle struct {
	Timestamp string `json:"timestamp"`
	Open      string `json:"open"`
	High      string `json:"high"`
	Low       string `json:"low"`
	Close     string `json:"close"`
	Volume    string `json:"volume"`
}

type Portfolio struct {
	AccountID     string `json:"account_id"`
	Currency      string `json:"currency"`
	Equity        string `json:"equity"`
	Cash          string `json:"cash"`
	BuyingPower   string `json:"buying_power"`
	MarginUsed    string `json:"margin_used"`
	RealizedPnL   string `json:"realized_pnl"`
	UnrealizedPnL string `json:"unrealized_pnl"`
}

type Position struct {
	ID           string      `json:"id"`
	AccountID    string      `json:"account_id"`
	InstrumentID string      `json:"instrument_id"`
	Symbol       string      `json:"symbol"`
	Mode         TradingMode `json:"mode"`
	Quantity     string      `json:"quantity"`
	AveragePrice string      `json:"average_price"`
	RealizedPnL  string      `json:"realized_pnl"`
	ReconciledAt time.Time   `json:"reconciled_at"`
}

type Order struct {
	ID              string      `json:"id"`
	AccountID       string      `json:"account_id"`
	InstrumentID    string      `json:"instrument_id"`
	Symbol          string      `json:"symbol"`
	ClientOrderID   string      `json:"client_order_id"`
	BrokerOrderID   *string     `json:"broker_order_id,omitempty"`
	Mode            TradingMode `json:"mode"`
	Side            string      `json:"side"`
	OrderType       string      `json:"order_type"`
	TimeInForce     string      `json:"time_in_force"`
	Quantity        string      `json:"quantity"`
	LimitPrice      *string     `json:"limit_price,omitempty"`
	StopPrice       *string     `json:"stop_price,omitempty"`
	TakeProfitPrice *string     `json:"take_profit_price,omitempty"`
	StopLossPrice   *string     `json:"stop_loss_price,omitempty"`
	TrailValue      *string     `json:"trail_value,omitempty"`
	Status          string      `json:"status"`
	Version         int         `json:"version"`
	CreatedAt       time.Time   `json:"created_at"`
}

type CreateOrder struct {
	AccountID           string      `json:"account_id" binding:"required"`
	InstrumentID        string      `json:"instrument_id" binding:"required"`
	Mode                TradingMode `json:"mode" binding:"required"`
	Side                string      `json:"side" binding:"required"`
	OrderType           string      `json:"order_type" binding:"required"`
	TimeInForce         string      `json:"time_in_force" binding:"required"`
	Quantity            string      `json:"quantity" binding:"required"`
	LimitPrice          *string     `json:"limit_price"`
	StopPrice           *string     `json:"stop_price"`
	TakeProfitPrice     *string     `json:"take_profit_price"`
	StopLossPrice       *string     `json:"stop_loss_price"`
	TrailValue          *string     `json:"trail_value"`
	StrategyVersionHash *string     `json:"strategy_version_hash"`
}

type SafetyCommand struct {
	AccountID string  `json:"account_id" binding:"required"`
	OrderID   *string `json:"order_id"`
	Symbol    *string `json:"symbol"`
	Quantity  *string `json:"quantity"`
}

type Record struct {
	ID        string          `json:"id"`
	Status    string          `json:"status,omitempty"`
	Name      string          `json:"name,omitempty"`
	Payload   json.RawMessage `json:"payload,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
}

type ExecutionCommand struct {
	SchemaVersion int             `json:"schema_version"`
	CommandID     string          `json:"command_id"`
	CorrelationID string          `json:"correlation_id"`
	Type          string          `json:"type"`
	Payload       json.RawMessage `json:"payload"`
}
