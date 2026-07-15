package postgres

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"entgo.io/ent/dialect/sql"

	"trading/control-gateway/internal/data/ent"
	"trading/control-gateway/internal/data/ent/order"
	"trading/control-gateway/internal/data/ent/predicate"
	"trading/control-gateway/internal/modules/trading/application"
)

type EntTradeRepository struct {
	client *ent.Client
}

func NewTradeRepository(client *ent.Client) application.TradeRepository {
	return &EntTradeRepository{client: client}
}

func (r *EntTradeRepository) QueryTrades(limit, offset int, symbol, side string) ([]application.Trade, error) {
	client := r.client
	if client == nil {
		return []application.Trade{}, nil
	}
	if limit <= 0 {
		limit = 100
	}
	query := client.Order.Query()
	if symbol != "" {
		query.Where(order.SymbolEQ(symbol))
	}
	if side != "" {
		query.Where(order.SideEqualFold(side))
	}
	rows, err := query.Order(order.BySubmittedAt(sql.OrderDesc())).Limit(limit).Offset(offset).All(context.Background())
	if err != nil {
		return nil, fmt.Errorf("query trades: %w", err)
	}
	result := make([]application.Trade, 0, len(rows))
	for _, row := range rows {
		result = append(result, tradeView(row))
	}
	return result, nil
}

func (r *EntTradeRepository) QueryTradeByID(tradeID string) (application.Trade, bool, error) {
	client := r.client
	if client == nil {
		return application.Trade{}, false, nil
	}
	predicates := []predicate.Order{order.OrderIdEQ(tradeID)}
	if id, err := strconv.Atoi(tradeID); err == nil {
		predicates = append(predicates, order.IDEQ(id))
	}
	row, err := client.Order.Query().Where(order.Or(predicates...)).Only(context.Background())
	if ent.IsNotFound(err) {
		return application.Trade{}, false, nil
	}
	if err != nil {
		return application.Trade{}, false, fmt.Errorf("query trade by id: %w", err)
	}
	return tradeView(row), true, nil
}

func (r *EntTradeRepository) QueryTradeStatsSummary(symbol, timeRange string) (application.TradeStats, error) {
	client := r.client
	if client == nil {
		return application.TradeStats{}, nil
	}
	start := time.Now().UTC().Add(-24 * time.Hour)
	switch timeRange {
	case "1h":
		start = time.Now().UTC().Add(-time.Hour)
	case "7d":
		start = time.Now().UTC().Add(-7 * 24 * time.Hour)
	case "30d":
		start = time.Now().UTC().Add(-30 * 24 * time.Hour)
	}
	query := client.Order.Query().Where(order.SubmittedAtGTE(start))
	if symbol != "" {
		query.Where(order.SymbolEQ(symbol))
	}
	rows, err := query.All(context.Background())
	if err != nil {
		return application.TradeStats{}, fmt.Errorf("query trade stats: %w", err)
	}
	var notional, priceSum float64
	var buyCount, sellCount int64
	for _, row := range rows {
		if row.Price != nil {
			notional += row.Quantity * *row.Price
			priceSum += *row.Price
		}
		switch strings.ToLower(row.Side) {
		case "buy":
			buyCount++
		case "sell":
			sellCount++
		}
	}
	avgPrice := 0.0
	if len(rows) > 0 {
		avgPrice = priceSum / float64(len(rows))
	}
	return application.TradeStats{TimeRange: timeRange, Symbol: symbol, TotalTrades: int64(len(rows)), TotalNotional: notional, AveragePrice: avgPrice, BuyCount: buyCount, SellCount: sellCount}, nil
}

func (r *EntTradeRepository) QueryExecutionQuality() (application.ExecutionQuality, error) {
	client := r.client
	if client == nil {
		return application.ExecutionQuality{}, nil
	}
	total, err := client.Order.Query().Count(context.Background())
	if err != nil {
		return application.ExecutionQuality{}, fmt.Errorf("count orders: %w", err)
	}
	filled, err := client.Order.Query().Where(order.Or(order.StatusEqualFold("filled"), order.StatusEqualFold("executed"))).Count(context.Background())
	if err != nil {
		return application.ExecutionQuality{}, fmt.Errorf("count filled orders: %w", err)
	}
	fillRate := 0.0
	if total > 0 {
		fillRate = float64(filled) / float64(total)
	}
	return application.ExecutionQuality{FillRate: fillRate, RejectionRate: 1 - fillRate}, nil
}

func tradeView(row *ent.Order) application.Trade {
	price := 0.0
	if row.Price != nil {
		price = *row.Price
	}
	return application.Trade{ID: row.ID, OrderID: row.OrderId, Symbol: row.Symbol, Side: row.Side, Quantity: row.Quantity, Price: price, Status: row.Status, Timestamp: row.SubmittedAt.Format(time.RFC3339)}
}
