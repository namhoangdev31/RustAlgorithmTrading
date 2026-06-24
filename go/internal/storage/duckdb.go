package storage

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/marcboeker/go-duckdb"
)

// DuckDB provides access to observability analytics data.
type DuckDB struct {
	db *sql.DB
}

// DuckDBReader is a type alias for backward compatibility.
type DuckDBReader = DuckDB

func NewDuckDBReader(dbPath string) (*DuckDB, error) {
	dir := filepath.Dir(dbPath)
	if dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create directory for duckdb: %w", err)
		}
	}

	// Open in read-write mode (default) as Go is now the primary controller.
	db, err := sql.Open("duckdb", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open duckdb: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping duckdb: %w", err)
	}

	s := &DuckDB{db: db}
	if err := s.Initialize(); err != nil {
		return nil, fmt.Errorf("failed to initialize duckdb schema: %w", err)
	}
	return s, nil
}

func (r *DuckDB) Initialize() error {
	schemas := []string{
		`CREATE TABLE IF NOT EXISTS trading_metrics (
			timestamp TIMESTAMP NOT NULL,
			metric_name VARCHAR NOT NULL,
			value DOUBLE NOT NULL,
			symbol VARCHAR,
			labels VARCHAR
		)`,
		`CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON trading_metrics(timestamp)`,
		`CREATE TABLE IF NOT EXISTS performance_history (
			timestamp TIMESTAMP NOT NULL PRIMARY KEY,
			portfolio_value DOUBLE NOT NULL,
			pnl DOUBLE NOT NULL,
			sharpe_ratio DOUBLE,
			max_drawdown DOUBLE,
			win_rate DOUBLE,
			total_trades INTEGER
		)`,
		`CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_history(timestamp)`,
		`CREATE TABLE IF NOT EXISTS system_events (
			timestamp TIMESTAMP NOT NULL,
			event_type VARCHAR,
			severity VARCHAR,
			message VARCHAR,
			details VARCHAR
		)`,
	}

	for _, schema := range schemas {
		if _, err := r.db.Exec(schema); err != nil {
			return fmt.Errorf("failed to execute schema [%s]: %w", schema, err)
		}
	}
	return nil
}

func (r *DuckDBReader) Close() error {
	if r.db != nil {
		return r.db.Close()
	}
	return nil
}

func (r *DuckDBReader) Ping() error {
	if r.db == nil {
		return fmt.Errorf("duckdb connection is nil")
	}
	return r.db.Ping()
}

func (r *DuckDBReader) QueryMetricsHistory(startTime, endTime string, metricTypes []string) ([]map[string]interface{}, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database not connected")
	}
	query := `
		SELECT timestamp, metric_name, value, symbol, labels
		FROM trading_metrics
		WHERE timestamp >= ? AND timestamp <= ?
	`
	args := []interface{}{startTime, endTime}
	if len(metricTypes) > 0 {
		placeholders := make([]string, 0, len(metricTypes))
		for _, mt := range metricTypes {
			placeholders = append(placeholders, "?")
			args = append(args, mt)
		}
		query += fmt.Sprintf(" AND metric_name IN (%s)", strings.Join(placeholders, ","))
	}
	query += " ORDER BY timestamp DESC LIMIT 5000"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		// Return empty to keep parity behavior resilient.
		return []map[string]interface{}{}, nil
	}
	defer rows.Close()

	results := make([]map[string]interface{}, 0, 1024)
	for rows.Next() {
		var (
			ts         string
			metricName string
			value      float64
			symbol     sql.NullString
			labels     sql.NullString
		)
		if err := rows.Scan(&ts, &metricName, &value, &symbol, &labels); err != nil {
			continue
		}
		record := map[string]interface{}{
			"timestamp":   ts,
			"metric_name": metricName,
			"value":       value,
		}
		if symbol.Valid {
			record["symbol"] = symbol.String
		}
		if labels.Valid {
			record["labels"] = labels.String
		}
		results = append(results, record)
	}
	return results, nil
}

func (r *DuckDBReader) QueryPerformanceSummary() (map[string]interface{}, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database not connected")
	}
	query := `
		SELECT portfolio_value, pnl, total_trades
		FROM performance_history
		ORDER BY timestamp DESC
		LIMIT 1
	`
	var (
		portfolioValue float64
		pnl            float64
		totalTrades    int64
	)
	err := r.db.QueryRow(query).Scan(&portfolioValue, &pnl, &totalTrades)
	if err != nil {
		return map[string]interface{}{
			"portfolio_value": 0.0,
			"pnl":             0.0,
			"total_trades":    0,
		}, nil
	}
	return map[string]interface{}{
		"portfolio_value": portfolioValue,
		"pnl":             pnl,
		"total_trades":    totalTrades,
	}, nil
}

func (r *DuckDBReader) QueryPerformanceHistory(limit int) ([]map[string]interface{}, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database not connected")
	}
	if limit <= 0 {
		limit = 100
	}
	query := `
		SELECT timestamp, portfolio_value, pnl, sharpe_ratio, max_drawdown
		FROM performance_history
		ORDER BY timestamp DESC
		LIMIT ?
	`
	rows, err := r.db.Query(query, limit)
	if err != nil {
		return []map[string]interface{}{}, nil
	}
	defer rows.Close()

	results := make([]map[string]interface{}, 0, limit)
	for rows.Next() {
		var (
			ts             string
			portfolioValue float64
			pnl            float64
			sharpe         sql.NullFloat64
			drawdown       sql.NullFloat64
		)
		if err := rows.Scan(&ts, &portfolioValue, &pnl, &sharpe, &drawdown); err != nil {
			continue
		}
		item := map[string]interface{}{
			"timestamp":       ts,
			"portfolio_value": portfolioValue,
			"pnl":             pnl,
		}
		if sharpe.Valid {
			item["sharpe_ratio"] = sharpe.Float64
		}
		if drawdown.Valid {
			item["max_drawdown"] = drawdown.Float64
		}
		results = append(results, item)
	}
	return results, nil
}

func (r *DuckDBReader) QueryLogs(level string, limit int) ([]map[string]interface{}, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database not connected")
	}
	if level == "" {
		level = "INFO"
	}
	if limit <= 0 {
		limit = 100
	}
	query := `
		SELECT timestamp, event_type, severity, message, details
		FROM system_events
		WHERE severity = ? OR ? = 'ALL'
		ORDER BY timestamp DESC
		LIMIT ?
	`
	rows, err := r.db.Query(query, level, level, limit)
	if err != nil {
		return []map[string]interface{}{}, nil
	}
	defer rows.Close()

	results := make([]map[string]interface{}, 0, limit)
	for rows.Next() {
		var (
			ts       string
			evtType  sql.NullString
			severity sql.NullString
			message  sql.NullString
			details  sql.NullString
		)
		if err := rows.Scan(&ts, &evtType, &severity, &message, &details); err != nil {
			continue
		}
		item := map[string]interface{}{
			"timestamp":  ts,
			"event_type": evtType.String,
			"severity":   severity.String,
			"message":    message.String,
		}
		if details.Valid {
			item["details"] = details.String
		}
		results = append(results, item)
	}
	return results, nil
}

func (r *DuckDB) InsertMetrics(metrics []map[string]interface{}) error {
	if r.db == nil {
		return fmt.Errorf("database not connected")
	}
	if len(metrics) == 0 {
		return nil
	}

	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare("INSERT INTO trading_metrics (timestamp, metric_name, value, symbol, labels) VALUES (?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, m := range metrics {
		_, err := stmt.Exec(
			m["timestamp"],
			m["metric_name"],
			m["value"],
			m["symbol"],
			m["labels"],
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *DuckDB) InsertPerformanceRecord(record map[string]interface{}) error {
	if r.db == nil {
		return fmt.Errorf("database not connected")
	}

	query := `
		INSERT INTO performance_history (timestamp, portfolio_value, pnl, total_trades, sharpe_ratio, max_drawdown)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.Exec(query,
		record["timestamp"],
		record["portfolio_value"],
		record["pnl"],
		record["total_trades"],
		record["sharpe_ratio"],
		record["max_drawdown"],
	)
	return err
}
