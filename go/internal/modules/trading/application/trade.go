package application

type tradeUseCase struct {
	repo TradeRepository
}

// NewTradeUseCase creates a new instance of TradeUseCase, returning the interface.
func NewTradeUseCase(repo TradeRepository) TradeUseCase {
	return &tradeUseCase{repo: repo}
}

func (u *tradeUseCase) GetTrades(limit, offset int, symbol, side string) ([]Trade, error) {
	return u.repo.QueryTrades(limit, offset, symbol, side)
}

func (u *tradeUseCase) GetTradeByID(tradeID string) (Trade, bool, error) {
	return u.repo.QueryTradeByID(tradeID)
}

func (u *tradeUseCase) GetStatsSummary(symbol, timeRange string) (TradeStats, error) {
	return u.repo.QueryTradeStatsSummary(symbol, timeRange)
}

func (u *tradeUseCase) GetExecutionQuality() (ExecutionQuality, error) {
	return u.repo.QueryExecutionQuality()
}
