package questdb

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"time"

	domain "trading/control-gateway/internal/modules/quantant/contract"
)

type Reader struct{ db *sql.DB }

func New(db *sql.DB) *Reader { return &Reader{db: db} }

func (r *Reader) Candles(ctx context.Context, symbol, interval string, from, to time.Time, limit int) ([]domain.Candle, time.Time, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT timestamp, open, high, low, close, volume FROM quant_candles_v2
		WHERE symbol=$1 AND interval=$2 AND timestamp BETWEEN $3 AND $4
		ORDER BY timestamp DESC LIMIT $5`, symbol, interval, from.UTC(), to.UTC(), limit)
	if err != nil {
		return nil, time.Time{}, err
	}
	defer rows.Close()
	items := []domain.Candle{}
	var asOf time.Time
	for rows.Next() {
		var timestamp time.Time
		var open, high, low, closePrice, volume float64
		if err := rows.Scan(&timestamp, &open, &high, &low, &closePrice, &volume); err != nil {
			return nil, time.Time{}, err
		}
		if timestamp.After(asOf) {
			asOf = timestamp
		}
		items = append(items, domain.Candle{Timestamp: timestamp.UTC().Format(time.RFC3339Nano), Open: decimal(open), High: decimal(high), Low: decimal(low), Close: decimal(closePrice), Volume: decimal(volume)})
	}
	return items, asOf, rows.Err()
}

func (r *Reader) Portfolio(ctx context.Context, accountID string, mode domain.TradingMode) (domain.Portfolio, time.Time, error) {
	var value domain.Portfolio
	var asOf time.Time
	var equity, cash, buyingPower, margin, realized, unrealized float64
	err := r.db.QueryRowContext(ctx, `
		SELECT timestamp, currency, equity, cash, buying_power, margin_used, realized_pnl, unrealized_pnl
		FROM quant_portfolio_snapshots_v1 WHERE account_id=$1 AND mode=$2
		ORDER BY timestamp DESC LIMIT 1`, accountID, mode).Scan(&asOf, &value.Currency, &equity, &cash, &buyingPower, &margin, &realized, &unrealized)
	if err != nil {
		return value, asOf, err
	}
	value.AccountID, value.Equity, value.Cash = accountID, decimal(equity), decimal(cash)
	value.BuyingPower, value.MarginUsed = decimal(buyingPower), decimal(margin)
	value.RealizedPnL, value.UnrealizedPnL = decimal(realized), decimal(unrealized)
	return value, asOf, nil
}

func (r *Reader) Fresh(ctx context.Context, symbol string, notBefore time.Time) error {
	var timestamp time.Time
	if err := r.db.QueryRowContext(ctx, `SELECT max(timestamp) FROM quant_quotes_v1 WHERE symbol=$1`, symbol).Scan(&timestamp); err != nil {
		return err
	}
	if timestamp.Before(notBefore) {
		return fmt.Errorf("quote for %s is stale", symbol)
	}
	return nil
}

func decimal(value float64) string { return strconv.FormatFloat(value, 'f', -1, 64) }
