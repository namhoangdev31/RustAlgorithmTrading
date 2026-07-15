package application

import (
	"context"
	"errors"
)

var errAlpacaUnavailable = errors.New("alpaca is not configured")

type alpacaUseCase struct {
	repo AlpacaRepository
}

// NewAlpacaUseCase creates a new instance of AlpacaUseCase, returning the interface.
func NewAlpacaUseCase(repo AlpacaRepository) AlpacaUseCase {
	return &alpacaUseCase{repo: repo}
}

func (u *alpacaUseCase) GetAccount(ctx context.Context) (AlpacaAccount, error) {
	if u.repo == nil {
		return AlpacaAccount{}, errAlpacaUnavailable
	}
	return u.repo.GetAccount(ctx)
}

func (u *alpacaUseCase) GetPositions(ctx context.Context) ([]AlpacaPosition, error) {
	if u.repo == nil {
		return nil, errAlpacaUnavailable
	}
	return u.repo.GetPositions(ctx)
}

func (u *alpacaUseCase) PlaceMarketOrder(ctx context.Context, symbol string, qty float64, side string, tif string) (OrderResponse, error) {
	if u.repo == nil {
		return OrderResponse{}, errAlpacaUnavailable
	}
	return u.repo.PlaceMarketOrder(ctx, symbol, qty, side, tif)
}

func (u *alpacaUseCase) PlaceLimitOrder(ctx context.Context, symbol string, qty float64, side string, limitPrice float64, tif string) (OrderResponse, error) {
	if u.repo == nil {
		return OrderResponse{}, errAlpacaUnavailable
	}
	return u.repo.PlaceLimitOrder(ctx, symbol, qty, side, limitPrice, tif)
}

func (u *alpacaUseCase) GetOrders(ctx context.Context, status string) ([]map[string]any, error) {
	if u.repo == nil {
		return nil, errAlpacaUnavailable
	}
	return u.repo.GetOrders(ctx, status)
}

func (u *alpacaUseCase) CancelOrder(ctx context.Context, orderID string) error {
	if u.repo == nil {
		return errAlpacaUnavailable
	}
	return u.repo.CancelOrder(ctx, orderID)
}

func (u *alpacaUseCase) CancelAllOrders(ctx context.Context) error {
	if u.repo == nil {
		return errAlpacaUnavailable
	}
	return u.repo.CancelAllOrders(ctx)
}

func (u *alpacaUseCase) CloseAllPositions(ctx context.Context) ([]map[string]any, error) {
	if u.repo == nil {
		return nil, errAlpacaUnavailable
	}
	return u.repo.CloseAllPositions(ctx)
}

func (u *alpacaUseCase) GetBars(ctx context.Context, symbol, start, end, timeframe string) (map[string]any, error) {
	if u.repo == nil {
		return nil, errAlpacaUnavailable
	}
	return u.repo.GetHistoricalBars(ctx, symbol, start, end, timeframe)
}
