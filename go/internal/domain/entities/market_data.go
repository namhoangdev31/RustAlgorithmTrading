package entities

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// Product represents a tradable asset.
type Product struct {
	Symbol         string    `json:"symbol"`
	AssetClass     string    `json:"asset_class"`
	BaseCurrency   string    `json:"base_currency"`
	QuoteCurrency  string    `json:"quote_currency"`
	MinSize        float64   `json:"min_size"`
	SizeIncrement  float64   `json:"size_increment"`
	PriceIncrement float64   `json:"price_increment"`
	IsTradable     bool      `json:"is_tradable"`
	CreatedAt      time.Time `json:"created_at"`
}

// ProductAlias maps a product symbol to broker/provider specific tickers.
type ProductAlias struct {
	ID             uuid.UUID `json:"id"`
	Symbol         string    `json:"symbol"`
	ProviderName   string    `json:"provider_name"`
	ProviderSymbol string    `json:"provider_symbol"`
}

// MarketSession represents trading hours for products.
type MarketSession struct {
	ID          uuid.UUID `json:"id"`
	Symbol      string    `json:"symbol"`
	SessionName string    `json:"session_name"`
	StartTime   string    `json:"start_time"`
	EndTime     string    `json:"end_time"`
	Timezone    string    `json:"timezone"`
}

// CorporateAction tracks dividends, stock splits, etc.
type CorporateAction struct {
	ID               uuid.UUID       `json:"id"`
	Symbol           string          `json:"symbol"`
	ActionType       string          `json:"action_type"`
	ExDate           time.Time       `json:"ex_date"`
	ExecutionDetails json.RawMessage `json:"execution_details"`
}

// FxRate holds foreign exchange conversions.
type FxRate struct {
	Pair      string    `json:"pair"`
	Rate      float64   `json:"rate"`
	UpdatedAt time.Time `json:"updated_at"`
}

// MarketDataProvider lists active vendor feeds.
type MarketDataProvider struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	IsActive bool   `json:"is_active"`
}

// MarketDataStat tracks rolling volume and updates.
type MarketDataStat struct {
	Symbol        string    `json:"symbol"`
	Volume24h     float64   `json:"volume_24h"`
	LastUpdatedAt time.Time `json:"last_updated_at"`
}

// MarketDataTick represents individual trade executions.
type MarketDataTick struct {
	ID        int64     `json:"id"`
	Symbol    string    `json:"symbol"`
	Timestamp time.Time `json:"timestamp"`
	Price     float64   `json:"price"`
	Size      float64   `json:"size"`
}

// MarketQuote represents top of the book bid/ask data.
type MarketQuote struct {
	ID        int64     `json:"id"`
	Symbol    string    `json:"symbol"`
	Timestamp time.Time `json:"timestamp"`
	BidPrice  float64   `json:"bid_price"`
	BidSize   float64   `json:"bid_size"`
	AskPrice  float64   `json:"ask_price"`
	AskSize   float64   `json:"ask_size"`
}

// MarketBar represents candle charts (ohlcv).
type MarketBar struct {
	Symbol    string    `json:"symbol"`
	Timestamp time.Time `json:"timestamp"`
	Timeframe string    `json:"timeframe"`
	Open      float64   `json:"open"`
	High      float64   `json:"high"`
	Low       float64   `json:"low"`
	Close     float64   `json:"close"`
	Volume    float64   `json:"volume"`
}

// OrderBookSnapshot contains JSON serialized bid/ask depths.
type OrderBookSnapshot struct {
	ID        int64           `json:"id"`
	Symbol    string          `json:"symbol"`
	Timestamp time.Time       `json:"timestamp"`
	Bids      json.RawMessage `json:"bids"`
	Asks      json.RawMessage `json:"asks"`
}

// MarkPrice holds calculations for portfolio valuation.
type MarkPrice struct {
	ID        int64     `json:"id"`
	Symbol    string    `json:"symbol"`
	Timestamp time.Time `json:"timestamp"`
	MarkPrice float64   `json:"mark_price"`
}
