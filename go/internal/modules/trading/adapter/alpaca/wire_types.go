package alpaca

type alpacaAccountWire struct {
	Cash           float64 `json:"cash,string"`
	PortfolioValue float64 `json:"portfolio_value,string"`
	BuyingPower    float64 `json:"buying_power,string"`
	Equity         float64 `json:"equity,string"`
	Status         string  `json:"status"`
}

type alpacaPositionWire struct {
	Symbol       string  `json:"symbol"`
	Qty          float64 `json:"qty,string"`
	AvgEntry     float64 `json:"avg_entry_price,string"`
	CurrentPrice float64 `json:"current_price,string"`
	MarketValue  float64 `json:"market_value,string"`
	UnrealizedPL float64 `json:"unrealized_pl,string"`
}

type orderRequestWire struct {
	Symbol      string `json:"symbol"`
	Qty         string `json:"qty"`
	Side        string `json:"side"`
	Type        string `json:"type"`
	TimeInForce string `json:"time_in_force"`
}

type orderResponseWire struct {
	ID        string `json:"id"`
	Status    string `json:"status"`
	Symbol    string `json:"symbol"`
	CreatedAt string `json:"created_at"`
}
