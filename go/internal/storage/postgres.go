package storage

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresReader struct {
	pool *pgxpool.Pool
}

func NewPostgresReader(connString string) (*PostgresReader, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("failed to parse config: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to postgres: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping postgres: %w", err)
	}

	return &PostgresReader{pool: pool}, nil
}

func (r *PostgresReader) Close() error {
	r.pool.Close()
	return nil
}

func (r *PostgresReader) Ping() error {
	if r.pool == nil {
		return errors.New("postgres pool is nil")
	}
	return r.pool.Ping(context.Background())
}

func (r *PostgresReader) QueryTrades(limit int, offset int, symbol string, side string) ([]map[string]interface{}, error) {
	if limit <= 0 {
		limit = 100
	}

	query := `SELECT id, order_id, symbol, side, quantity, price, status, submitted_at as timestamp 
			  FROM orders 
			  WHERE 1=1`
	
	args := []interface{}{}
	argIdx := 1

	if symbol != "" {
		query += fmt.Sprintf(" AND symbol = $%d", argIdx)
		args = append(args, symbol)
		argIdx++
	}
	if side != "" {
		query += fmt.Sprintf(" AND lower(side) = lower($%d)", argIdx)
		args = append(args, side)
		argIdx++
	}

	query += fmt.Sprintf(" ORDER BY submitted_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(context.Background(), query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query trades: %w", err)
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var (
			id        int32
			orderID   string
			sym       string
			sd        string
			qty       float64
			px        *float64
			status    string
			ts        time.Time
		)
		err := rows.Scan(&id, &orderID, &sym, &sd, &qty, &px, &status, &ts)
		if err != nil {
			continue
		}
		
		priceVal := 0.0
		if px != nil {
			priceVal = *px
		}

		results = append(results, map[string]interface{}{
			"id":        id,
			"order_id":  orderID,
			"symbol":    sym,
			"side":      sd,
			"quantity":  qty,
			"price":     priceVal,
			"status":    status,
			"timestamp": ts.Format(time.RFC3339),
		})
	}
	return results, nil
}

func (r *PostgresReader) QueryTradeByID(tradeID string) (map[string]interface{}, bool, error) {
	query := `SELECT id, order_id, symbol, side, quantity, price, status, submitted_at as timestamp 
			  FROM orders 
			  WHERE order_id = $1 OR id::text = $1 
			  LIMIT 1`
	
	var (
		id        int32
		orderID   string
		sym       string
		sd        string
		qty       float64
		px        *float64
		status    string
		ts        time.Time
	)
	
	err := r.pool.QueryRow(context.Background(), query, tradeID).Scan(
		&id, &orderID, &sym, &sd, &qty, &px, &status, &ts,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, false, nil
		}
		return nil, false, fmt.Errorf("failed to query trade by id: %w", err)
	}

	priceVal := 0.0
	if px != nil {
		priceVal = *px
	}

	return map[string]interface{}{
		"id":        id,
		"order_id":  orderID,
		"symbol":    sym,
		"side":      sd,
		"quantity":  qty,
		"price":     priceVal,
		"status":    status,
		"timestamp": ts.Format(time.RFC3339),
	}, true, nil
}

func (r *PostgresReader) QueryTradeStatsSummary(symbol string, rangeLabel string) (map[string]interface{}, error) {
	startTime := time.Now().UTC().Add(-24 * time.Hour)
	switch rangeLabel {
	case "1h":
		startTime = time.Now().UTC().Add(-1 * time.Hour)
	case "7d":
		startTime = time.Now().UTC().Add(-7 * 24 * time.Hour)
	case "30d":
		startTime = time.Now().UTC().Add(-30 * 24 * time.Hour)
	}

	query := `
		SELECT
			COUNT(*) AS total_trades,
			COALESCE(SUM(quantity * price), 0) AS total_notional,
			COALESCE(AVG(price), 0) AS avg_price,
			COALESCE(SUM(CASE WHEN lower(side)='buy' THEN 1 ELSE 0 END), 0) AS buy_count,
			COALESCE(SUM(CASE WHEN lower(side)='sell' THEN 1 ELSE 0 END), 0) AS sell_count
		FROM orders
		WHERE submitted_at >= $1
	`
	args := []interface{}{startTime}
	if symbol != "" {
		query += " AND symbol = $2"
		args = append(args, symbol)
	}

	var (
		totalTrades   int64
		totalNotional float64
		avgPrice      float64
		buyCount      int64
		sellCount     int64
	)
	if err := r.pool.QueryRow(context.Background(), query, args...).Scan(
		&totalTrades, &totalNotional, &avgPrice, &buyCount, &sellCount,
	); err != nil {
		return nil, fmt.Errorf("failed to query trade stats: %w", err)
	}

	return map[string]interface{}{
		"time_range":     rangeLabel,
		"symbol":         symbol,
		"total_trades":   totalTrades,
		"total_notional": totalNotional,
		"avg_price":      avgPrice,
		"buy_count":      buyCount,
		"sell_count":     sellCount,
	}, nil
}

func (r *PostgresReader) QueryExecutionQuality() (map[string]interface{}, error) {
	// Giả sử có thêm các cột performance trong bảng orders hoặc trades
	// Ở đây tôi mô phỏng theo logic SQLite nhưng khớp với schema Postgres
	query := `
		SELECT
			0.0 AS avg_latency_ms,
			0.0 AS avg_slippage_bps,
			CASE WHEN COUNT(*)=0 THEN 0.0 ELSE SUM(CASE WHEN lower(status)='filled' OR lower(status)='executed' THEN 1 ELSE 0 END)*1.0/COUNT(*) END AS fill_rate
		FROM orders
	`
	var avgLatency, avgSlippage, fillRate float64
	if err := r.pool.QueryRow(context.Background(), query).Scan(&avgLatency, &avgSlippage, &fillRate); err != nil {
		return nil, fmt.Errorf("failed to query execution quality: %w", err)
	}

	return map[string]interface{}{
		"fill_rate":        fillRate,
		"avg_latency_ms":   avgLatency,
		"avg_slippage_bps": avgSlippage,
		"rejection_rate":   1.0 - fillRate,
	}, nil
}

func (r *PostgresReader) QueryLogs(level string, limit int) ([]map[string]interface{}, error) {
	// PostgreSQL không lưu log trực tiếp trong bảng như DuckDB nhưng có bảng risk_events
	query := `SELECT id, event_type, severity, message, occurred_at 
			  FROM risk_events 
			  WHERE severity ILIKE $1 
			  ORDER BY occurred_at DESC 
			  LIMIT $2`
	
	rows, err := r.pool.Query(context.Background(), query, level+"%", limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query logs: %w", err)
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var (
			id       int32
			evType   string
			severity string
			message  string
			ts       time.Time
		)
		if err := rows.Scan(&id, &evType, &severity, &message, &ts); err != nil {
			continue
		}
		results = append(results, map[string]interface{}{
			"id":         id,
			"event_type": evType,
			"severity":   severity,
			"message":    message,
			"timestamp":  ts.Format(time.RFC3339),
		})
	}
	return results, nil
}
