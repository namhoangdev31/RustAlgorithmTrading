package application

// AlpacaAccount represents the Alpaca Account entity.
type AlpacaAccount struct {
	Cash           float64
	PortfolioValue float64
	BuyingPower    float64
	Equity         float64
	Status         string
}

// AlpacaPosition represents the Alpaca Position entity.
type AlpacaPosition struct {
	Symbol       string
	Qty          float64
	AvgEntry     float64
	CurrentPrice float64
	MarketValue  float64
	UnrealizedPL float64
}

// OrderResponse represents the Alpaca Order execution response.
type OrderResponse struct {
	ID        string
	Status    string
	Symbol    string
	CreatedAt string
}
