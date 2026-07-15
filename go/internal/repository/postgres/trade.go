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
	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/storage"
)

type EntTradeRepository struct {
	store *storage.Store
}

func NewEntTradeRepository(store *storage.Store) repositories.TradeRepository {
	return &EntTradeRepository{store: store}
}

func (r *EntTradeRepository) client() *ent.Client {
	if r.store == nil || r.store.Postgres() == nil {
		return nil
	}
	return r.store.Postgres().Ent()
}

func (r *EntTradeRepository) QueryTrades(limit, offset int, symbol, side string) ([]map[string]interface{}, error) {
	client := r.client()
	if client == nil {
		return []map[string]interface{}{}, nil
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
	result := make([]map[string]interface{}, 0, len(rows))
	for _, row := range rows {
		result = append(result, tradeView(row))
	}
	return result, nil
}

func (r *EntTradeRepository) QueryTradeByID(tradeID string) (map[string]interface{}, bool, error) {
	client := r.client()
	if client == nil {
		return nil, false, nil
	}
	predicates := []predicate.Order{order.OrderIdEQ(tradeID)}
	if id, err := strconv.Atoi(tradeID); err == nil {
		predicates = append(predicates, order.IDEQ(id))
	}
	row, err := client.Order.Query().Where(order.Or(predicates...)).Only(context.Background())
	if ent.IsNotFound(err) {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, fmt.Errorf("query trade by id: %w", err)
	}
	return tradeView(row), true, nil
}

func (r *EntTradeRepository) QueryTradeStatsSummary(symbol, timeRange string) (map[string]interface{}, error) {
	client := r.client()
	if client == nil {
		return map[string]interface{}{}, nil
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
		return nil, fmt.Errorf("query trade stats: %w", err)
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
	return map[string]interface{}{
		"time_range": timeRange, "symbol": symbol, "total_trades": int64(len(rows)),
		"total_notional": notional, "avg_price": avgPrice, "buy_count": buyCount, "sell_count": sellCount,
	}, nil
}

func (r *EntTradeRepository) QueryExecutionQuality() (map[string]interface{}, error) {
	client := r.client()
	if client == nil {
		return map[string]interface{}{}, nil
	}
	total, err := client.Order.Query().Count(context.Background())
	if err != nil {
		return nil, fmt.Errorf("count orders: %w", err)
	}
	filled, err := client.Order.Query().Where(order.Or(order.StatusEqualFold("filled"), order.StatusEqualFold("executed"))).Count(context.Background())
	if err != nil {
		return nil, fmt.Errorf("count filled orders: %w", err)
	}
	fillRate := 0.0
	if total > 0 {
		fillRate = float64(filled) / float64(total)
	}
	return map[string]interface{}{
		"fill_rate": fillRate, "avg_latency_ms": 0.0, "avg_slippage_bps": 0.0, "rejection_rate": 1 - fillRate,
	}, nil
}

func tradeView(row *ent.Order) map[string]interface{} {
	price := 0.0
	if row.Price != nil {
		price = *row.Price
	}
	return map[string]interface{}{
		"id": row.ID, "order_id": row.OrderId, "symbol": row.Symbol, "side": row.Side,
		"quantity": row.Quantity, "price": price, "status": row.Status, "timestamp": row.SubmittedAt.Format(time.RFC3339),
	}
}
