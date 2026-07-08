package usecase

import (
	"context"
	"trading/control-gateway/internal/domain/entities"
	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/domain/usecases"
)

type alpacaUseCase struct {
	repo repositories.AlpacaRepository
}

// NewAlpacaUseCase creates a new instance of AlpacaUseCase, returning the interface.
func NewAlpacaUseCase(repo repositories.AlpacaRepository) usecases.AlpacaUseCase {
	return &alpacaUseCase{repo: repo}
}

func (u *alpacaUseCase) GetAccount(ctx context.Context) (entities.AlpacaAccount, error) {
	return u.repo.GetAccount(ctx)
}

func (u *alpacaUseCase) GetPositions(ctx context.Context) ([]entities.AlpacaPosition, error) {
	return u.repo.GetPositions(ctx)
}

func (u *alpacaUseCase) PlaceMarketOrder(ctx context.Context, symbol string, qty float64, side string, tif string) (entities.OrderResponse, error) {
	return u.repo.PlaceMarketOrder(ctx, symbol, qty, side, tif)
}

func (u *alpacaUseCase) PlaceLimitOrder(ctx context.Context, symbol string, qty float64, side string, limitPrice float64, tif string) (entities.OrderResponse, error) {
	return u.repo.PlaceLimitOrder(ctx, symbol, qty, side, limitPrice, tif)
}

func (u *alpacaUseCase) GetOrders(ctx context.Context, status string) ([]map[string]any, error) {
	return u.repo.GetOrders(ctx, status)
}

func (u *alpacaUseCase) CancelOrder(ctx context.Context, orderID string) error {
	return u.repo.CancelOrder(ctx, orderID)
}

func (u *alpacaUseCase) CancelAllOrders(ctx context.Context) error {
	return u.repo.CancelAllOrders(ctx)
}

func (u *alpacaUseCase) CloseAllPositions(ctx context.Context) ([]map[string]any, error) {
	return u.repo.CloseAllPositions(ctx)
}

func (u *alpacaUseCase) GetBars(ctx context.Context, symbol, start, end, timeframe string) (map[string]any, error) {
	return u.repo.GetHistoricalBars(ctx, symbol, start, end, timeframe)
}
