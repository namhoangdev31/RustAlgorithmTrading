package storage

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type SQLiteReader struct {
	db            *sql.DB
	hasTradeID    bool
	hasOrderID    bool
	hasStatus     bool
	hasMetadata   bool
	hasSlippage   bool
	hasLatency    bool
	hasPnL        bool
	tradeTableRaw string
}

func NewSQLiteReader(dbPath string) (*SQLiteReader, error) {
	dsn := fmt.Sprintf("file:%s?mode=ro&_busy_timeout=5000", dbPath)
	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping sqlite: %w", err)
	}

	reader := &SQLiteReader{db: db}
	if err := reader.loadSchemaFlags(); err != nil {
		_ = db.Close()
		return nil, err
	}
	return reader, nil
}

func (r *SQLiteReader) Close() error {
	if r.db != nil {
		return r.db.Close()
	}
	return nil
}

func (r *SQLiteReader) Ping() error {
	if r.db == nil {
		return fmt.Errorf("sqlite connection is nil")
	}
	return r.db.Ping()
}

func (r *SQLiteReader) loadSchemaFlags() error {
	if r.db == nil {
		return fmt.Errorf("sqlite connection is nil")
	}
	// Table can vary between installations.
	tableName := "trade_log"
	if _, err := r.db.Exec("SELECT 1 FROM trade_log LIMIT 1"); err != nil {
		if _, err2 := r.db.Exec("SELECT 1 FROM trades LIMIT 1"); err2 == nil {
			tableName = "trades"
		}
	}
	r.tradeTableRaw = tableName

	rows, err := r.db.Query(fmt.Sprintf("PRAGMA table_info(%s)", tableName))
	if err != nil {
		return fmt.Errorf("failed to inspect sqlite schema: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var (
			cid      int
			name     string
			colType  string
			notNull  int
			defaultV sql.NullString
			primaryK int
		)
		if err := rows.Scan(&cid, &name, &colType, &notNull, &defaultV, &primaryK); err != nil {
			continue
		}
		switch strings.ToLower(name) {
		case "trade_id":
			r.hasTradeID = true
		case "order_id":
			r.hasOrderID = true
		case "status":
			r.hasStatus = true
		case "metadata":
			r.hasMetadata = true
		case "slippage_bps":
			r.hasSlippage = true
		case "latency_ms":
			r.hasLatency = true
		case "pnl":
			r.hasPnL = true
		}
	}
	return nil
}

func (r *SQLiteReader) QueryTrades(limit int, offset int, symbol string, side string) ([]map[string]interface{}, error) {
	if r.db == nil {
		return nil, fmt.Errorf("sqlite not connected")
	}
	if limit <= 0 {
		limit = 100
	}

	base := []string{
		"id",
		"timestamp",
		"symbol",
		"side",
		"quantity",
		"price",
	}
	if r.hasOrderID {
		base = append(base, "order_id")
	}
	if r.hasStatus {
		base = append(base, "status")
	}
	if r.hasMetadata {
		base = append(base, "metadata")
	}
	if r.hasSlippage {
		base = append(base, "slippage_bps")
	}
	if r.hasLatency {
		base = append(base, "latency_ms")
	}
	if r.hasPnL {
		base = append(base, "pnl")
	}
	if r.hasTradeID {
		base = append(base, "trade_id")
	}

	query := fmt.Sprintf(
		"SELECT %s FROM %s WHERE 1=1",
		strings.Join(base, ", "),
		r.tradeTableRaw,
	)
	args := make([]interface{}, 0, 4)
	if symbol != "" {
		query += " AND symbol = ?"
		args = append(args, symbol)
	}
	if side != "" {
		query += " AND lower(side) = lower(?)"
		args = append(args, side)
	}
	query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return []map[string]interface{}{}, nil
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	results := make([]map[string]interface{}, 0, limit)
	for rows.Next() {
		rowVals := make([]interface{}, len(cols))
		rowPtrs := make([]interface{}, len(cols))
		for i := range rowVals {
			rowPtrs[i] = &rowVals[i]
		}
		if err := rows.Scan(rowPtrs...); err != nil {
			continue
		}
		item := make(map[string]interface{}, len(cols))
		for i, col := range cols {
			switch v := rowVals[i].(type) {
			case []byte:
				item[col] = string(v)
			default:
				item[col] = v
			}
		}
		results = append(results, item)
	}
	return results, nil
}

func (r *SQLiteReader) QueryTradeByID(tradeID string) (map[string]interface{}, bool, error) {
	if r.db == nil {
		return nil, false, fmt.Errorf("sqlite not connected")
	}
	query := fmt.Sprintf("SELECT id, timestamp, symbol, side, quantity, price FROM %s WHERE id = ? LIMIT 1", r.tradeTableRaw)
	row := r.db.QueryRow(query, tradeID)
	var (
		id       interface{}
		ts       interface{}
		symbol   interface{}
		side     interface{}
		quantity interface{}
		price    interface{}
	)
	if err := row.Scan(&id, &ts, &symbol, &side, &quantity, &price); err == nil {
		return map[string]interface{}{
			"id":        id,
			"timestamp": ts,
			"symbol":    symbol,
			"side":      side,
			"quantity":  quantity,
			"price":     price,
		}, true, nil
	}
	if r.hasTradeID {
		query = fmt.Sprintf("SELECT id, timestamp, symbol, side, quantity, price, trade_id FROM %s WHERE trade_id = ? LIMIT 1", r.tradeTableRaw)
		row = r.db.QueryRow(query, tradeID)
		var tradeIDVal interface{}
		if err := row.Scan(&id, &ts, &symbol, &side, &quantity, &price, &tradeIDVal); err == nil {
			return map[string]interface{}{
				"id":        id,
				"timestamp": ts,
				"symbol":    symbol,
				"side":      side,
				"quantity":  quantity,
				"price":     price,
				"trade_id":  tradeIDVal,
			}, true, nil
		}
	}
	return nil, false, nil
}

func (r *SQLiteReader) QueryTradeStatsSummary(symbol string, rangeLabel string) (map[string]interface{}, error) {
	if r.db == nil {
		return nil, fmt.Errorf("sqlite not connected")
	}
	startTime := time.Now().UTC().Add(-24 * time.Hour)
	switch rangeLabel {
	case "1h":
		startTime = time.Now().UTC().Add(-1 * time.Hour)
	case "7d":
		startTime = time.Now().UTC().Add(-7 * 24 * time.Hour)
	case "30d":
		startTime = time.Now().UTC().Add(-30 * 24 * time.Hour)
	}

	query := fmt.Sprintf(`
		SELECT
			COUNT(*) AS total_trades,
			COALESCE(SUM(quantity * price), 0) AS total_notional,
			COALESCE(AVG(price), 0) AS avg_price,
			COALESCE(SUM(CASE WHEN lower(side)='buy' THEN 1 ELSE 0 END), 0) AS buy_count,
			COALESCE(SUM(CASE WHEN lower(side)='sell' THEN 1 ELSE 0 END), 0) AS sell_count
		FROM %s
		WHERE timestamp >= ?
	`, r.tradeTableRaw)
	args := []interface{}{startTime.Format("2006-01-02 15:04:05")}
	if symbol != "" {
		query += " AND symbol = ?"
		args = append(args, symbol)
	}

	var (
		totalTrades   int64
		totalNotional float64
		avgPrice      float64
		buyCount      int64
		sellCount     int64
	)
	if err := r.db.QueryRow(query, args...).Scan(
		&totalTrades, &totalNotional, &avgPrice, &buyCount, &sellCount,
	); err != nil {
		return map[string]interface{}{}, nil
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

func (r *SQLiteReader) QueryExecutionQuality() (map[string]interface{}, error) {
	if r.db == nil {
		return nil, fmt.Errorf("sqlite not connected")
	}
	if !r.hasLatency && !r.hasSlippage {
		return map[string]interface{}{
			"fill_rate":        0.0,
			"avg_latency_ms":   0.0,
			"avg_slippage_bps": 0.0,
			"rejection_rate":   0.0,
		}, nil
	}

	latencyExpr := "0.0"
	if r.hasLatency {
		latencyExpr = "COALESCE(AVG(latency_ms), 0.0)"
	}
	slippageExpr := "0.0"
	if r.hasSlippage {
		slippageExpr = "COALESCE(AVG(slippage_bps), 0.0)"
	}
	statusExpr := "0.0"
	if r.hasStatus {
		statusExpr = "CASE WHEN COUNT(*)=0 THEN 0.0 ELSE SUM(CASE WHEN lower(status)='executed' OR lower(status)='filled' THEN 1 ELSE 0 END)*1.0/COUNT(*) END"
	}

	query := fmt.Sprintf(`
		SELECT
			%s AS avg_latency_ms,
			%s AS avg_slippage_bps,
			%s AS fill_rate
		FROM %s
	`, latencyExpr, slippageExpr, statusExpr, r.tradeTableRaw)

	var avgLatency float64
	var avgSlippage float64
	var fillRate float64
	if err := r.db.QueryRow(query).Scan(&avgLatency, &avgSlippage, &fillRate); err != nil {
		return map[string]interface{}{}, nil
	}

	return map[string]interface{}{
		"fill_rate":        fillRate,
		"avg_latency_ms":   avgLatency,
		"avg_slippage_bps": avgSlippage,
		"rejection_rate":   1.0 - fillRate,
	}, nil
}
