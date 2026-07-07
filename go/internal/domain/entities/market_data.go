package entities

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// Product represents a tradable asset.
type Product struct {
	Symbol         string    `json:"symbol" gorm:"type:varchar(50);primaryKey"`
	AssetClass     string    `json:"asset_class" gorm:"type:varchar(50);not null"`
	BaseCurrency   string    `json:"base_currency" gorm:"type:varchar(10);not null"`
	QuoteCurrency  string    `json:"quote_currency" gorm:"type:varchar(10);not null"`
	MinSize        float64   `json:"min_size" gorm:"type:numeric(20,8);not null;default:0.00000001"`
	SizeIncrement  float64   `json:"size_increment" gorm:"type:numeric(20,8);not null;default:0.00000001"`
	PriceIncrement float64   `json:"price_increment" gorm:"type:numeric(20,8);not null;default:0.00000001"`
	IsTradable     bool      `json:"is_tradable" gorm:"not null;default:true"`
	CreatedAt      time.Time `json:"created_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for Product.
func (Product) TableName() string {
	return "products"
}

// ProductAlias maps a product symbol to broker/provider specific tickers.
type ProductAlias struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Symbol         string    `json:"symbol" gorm:"type:varchar(50);not null"`
	ProviderName   string    `json:"provider_name" gorm:"type:varchar(100);not null"`
	ProviderSymbol string    `json:"provider_symbol" gorm:"type:varchar(100);not null"`
}

// TableName overrides the default table name for ProductAlias.
func (ProductAlias) TableName() string {
	return "product_aliases"
}

// MarketSession represents trading hours for products.
type MarketSession struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Symbol      string    `json:"symbol" gorm:"type:varchar(50);not null"`
	SessionName string    `json:"session_name" gorm:"type:varchar(100);not null"`
	StartTime   string    `json:"start_time" gorm:"type:time;not null"`
	EndTime     string    `json:"end_time" gorm:"type:time;not null"`
	Timezone    string    `json:"timezone" gorm:"type:varchar(50);not null;default:UTC"`
}

// TableName overrides the default table name for MarketSession.
func (MarketSession) TableName() string {
	return "market_sessions"
}

// CorporateAction tracks dividends, stock splits, etc.
type CorporateAction struct {
	ID               uuid.UUID       `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Symbol           string          `json:"symbol" gorm:"type:varchar(50);not null"`
	ActionType       string          `json:"action_type" gorm:"type:varchar(100);not null"`
	ExDate           time.Time       `json:"ex_date" gorm:"type:date;not null"`
	ExecutionDetails json.RawMessage `json:"execution_details" gorm:"type:jsonb;not null"`
}

// TableName overrides the default table name for CorporateAction.
func (CorporateAction) TableName() string {
	return "corporate_actions"
}

// FxRate holds foreign exchange conversions.
type FxRate struct {
	Pair      string    `json:"pair" gorm:"type:varchar(20);primaryKey"`
	Rate      float64   `json:"rate" gorm:"type:numeric(20,8);not null"`
	UpdatedAt time.Time `json:"updated_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for FxRate.
func (FxRate) TableName() string {
	return "fx_rates"
}

// MarketDataProvider lists active vendor feeds.
type MarketDataProvider struct {
	ID       string `json:"id" gorm:"type:varchar(50);primaryKey"`
	Name     string `json:"name" gorm:"type:varchar(100);not null"`
	IsActive bool   `json:"is_active" gorm:"not null;default:true"`
}

// TableName overrides the default table name for MarketDataProvider.
func (MarketDataProvider) TableName() string {
	return "market_data_providers"
}

// MarketDataStat tracks rolling volume and updates.
type MarketDataStat struct {
	Symbol        string    `json:"symbol" gorm:"type:varchar(50);primaryKey"`
	Volume24h     float64   `json:"volume_24h" gorm:"type:numeric(20,8);not null;default:0"`
	LastUpdatedAt time.Time `json:"last_updated_at" gorm:"not null;default:now()"`
}

// TableName overrides the default table name for MarketDataStat.
func (MarketDataStat) TableName() string {
	return "market_data_stats"
}

// MarketDataTick represents individual trade executions.
type MarketDataTick struct {
	ID        int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	Symbol    string    `json:"symbol" gorm:"type:varchar(50);not null"`
	Timestamp time.Time `json:"timestamp" gorm:"primaryKey;not null"`
	Price     float64   `json:"price" gorm:"type:numeric(20,8);not null"`
	Size      float64   `json:"size" gorm:"type:numeric(20,8);not null"`
}

// TableName overrides the default table name for MarketDataTick.
func (MarketDataTick) TableName() string {
	return "market_data_ticks"
}

// MarketQuote represents top of the book bid/ask data.
type MarketQuote struct {
	ID        int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	Symbol    string    `json:"symbol" gorm:"type:varchar(50);not null"`
	Timestamp time.Time `json:"timestamp" gorm:"primaryKey;not null"`
	BidPrice  float64   `json:"bid_price" gorm:"type:numeric(20,8);not null"`
	BidSize   float64   `json:"bid_size" gorm:"type:numeric(20,8);not null"`
	AskPrice  float64   `json:"ask_price" gorm:"type:numeric(20,8);not null"`
	AskSize   float64   `json:"ask_size" gorm:"type:numeric(20,8);not null"`
}

// TableName overrides the default table name for MarketQuote.
func (MarketQuote) TableName() string {
	return "market_quotes"
}

// MarketBar represents candle charts (ohlcv).
type MarketBar struct {
	Symbol    string    `json:"symbol" gorm:"type:varchar(50);primaryKey"`
	Timestamp time.Time `json:"timestamp" gorm:"primaryKey"`
	Timeframe string    `json:"timeframe" gorm:"type:varchar(20);primaryKey"`
	Open      float64   `json:"open" gorm:"type:numeric(20,8);not null"`
	High      float64   `json:"high" gorm:"type:numeric(20,8);not null"`
	Low       float64   `json:"low" gorm:"type:numeric(20,8);not null"`
	Close     float64   `json:"close" gorm:"type:numeric(20,8);not null"`
	Volume    float64   `json:"volume" gorm:"type:numeric(20,8);not null"`
}

// TableName overrides the default table name for MarketBar.
func (MarketBar) TableName() string {
	return "market_bars"
}

// OrderBookSnapshot contains JSON serialized bid/ask depths.
type OrderBookSnapshot struct {
	ID        int64           `json:"id" gorm:"primaryKey;autoIncrement"`
	Symbol    string          `json:"symbol" gorm:"type:varchar(50);not null"`
	Timestamp time.Time       `json:"timestamp" gorm:"primaryKey;not null"`
	Bids      json.RawMessage `json:"bids" gorm:"type:jsonb;not null"`
	Asks      json.RawMessage `json:"asks" gorm:"type:jsonb;not null"`
}

// TableName overrides the default table name for OrderBookSnapshot.
func (OrderBookSnapshot) TableName() string {
	return "order_book_snapshots"
}

// MarkPrice holds calculations for portfolio valuation.
type MarkPrice struct {
	ID        int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	Symbol    string    `json:"symbol" gorm:"type:varchar(50);not null"`
	Timestamp time.Time `json:"timestamp" gorm:"primaryKey;not null"`
	MarkPrice float64   `json:"mark_price" gorm:"type:numeric(20,8);not null"`
}

// TableName overrides the default table name for MarkPrice.
func (MarkPrice) TableName() string {
	return "mark_prices"
}
