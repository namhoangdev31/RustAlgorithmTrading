package usecase

import (
	"trading/observability-api/internal/domain/repositories"
	"trading/observability-api/internal/domain/usecases"
)

type tradeUseCase struct {
	repo repositories.TradeRepository
}

// NewTradeUseCase creates a new instance of TradeUseCase, returning the interface.
func NewTradeUseCase(repo repositories.TradeRepository) usecases.TradeUseCase {
	return &tradeUseCase{repo: repo}
}

func (u *tradeUseCase) GetTrades(limit, offset int, symbol, side string) ([]map[string]interface{}, error) {
	return u.repo.QueryTrades(limit, offset, symbol, side)
}

func (u *tradeUseCase) GetTradeByID(tradeID string) (map[string]interface{}, bool, error) {
	return u.repo.QueryTradeByID(tradeID)
}

func (u *tradeUseCase) GetStatsSummary(symbol, timeRange string) (map[string]interface{}, error) {
	return u.repo.QueryTradeStatsSummary(symbol, timeRange)
}

func (u *tradeUseCase) GetExecutionQuality() (map[string]interface{}, error) {
	return u.repo.QueryExecutionQuality()
}
