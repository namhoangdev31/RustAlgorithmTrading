package storage

import (
	"database/sql"
	"encoding/json"
	"fmt"
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
	db, err := sql.Open("duckdb", readOnlyDuckDBDSN(dbPath))
	if err != nil {
		return nil, fmt.Errorf("failed to open duckdb: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping duckdb: %w", err)
	}

	return &DuckDB{db: db}, nil
}

func readOnlyDuckDBDSN(dbPath string) string {
	if strings.Contains(dbPath, "?") {
		return dbPath + "&access_mode=read_only"
	}
	return dbPath + "?access_mode=read_only"
}

func (r *DuckDB) Initialize() error {
	return fmt.Errorf("duckdb schema is owned by observability-engine")
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
		WHERE timestamp >= CAST(? AS TIMESTAMP) AND timestamp <= CAST(? AS TIMESTAMP)
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

func (r *DuckDBReader) QueryCurrentMetricsSnapshot() (map[string]interface{}, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database not connected")
	}
	query := `
		SELECT metric_name, value, symbol, labels
		FROM trading_metrics
		ORDER BY timestamp DESC
		LIMIT 5000
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return map[string]interface{}{}, nil
	}
	defer rows.Close()

	results := make(map[string]interface{})
	seen := make(map[string]struct{})
	for rows.Next() {
		var (
			metricName string
			value      float64
			symbol     sql.NullString
			labels     sql.NullString
		)
		if err := rows.Scan(&metricName, &value, &symbol, &labels); err != nil {
			continue
		}
		labelMap := parseMetricLabels(labels)
		service := labelMap["service"]
		if service == "" {
			continue
		}
		key := service + "|" + metricName
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}

		serviceMetrics, ok := results[service].(map[string]interface{})
		if !ok {
			serviceMetrics = make(map[string]interface{})
			results[service] = serviceMetrics
		}
		serviceMetrics[metricName] = value
	}
	return results, nil
}

func parseMetricLabels(labels sql.NullString) map[string]string {
	if !labels.Valid || labels.String == "" {
		return map[string]string{}
	}
	parsed := make(map[string]string)
	if err := json.Unmarshal([]byte(labels.String), &parsed); err == nil {
		return parsed
	}
	for _, pair := range strings.Split(labels.String, ",") {
		kv := strings.SplitN(pair, "=", 2)
		if len(kv) == 2 {
			parsed[strings.TrimSpace(kv[0])] = strings.TrimSpace(kv[1])
		}
	}
	return parsed
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

func (r *DuckDBReader) QueryLatestIntegrityReport() (map[string]interface{}, error) {
	defaultReport := map[string]interface{}{
		"is_valid": true,
		"reasons":  []interface{}{},
		"metrics":  map[string]interface{}{},
	}
	if r.db == nil {
		return defaultReport, fmt.Errorf("database not connected")
	}

	var (
		ts      string
		details sql.NullString
	)
	err := r.db.QueryRow(`
		SELECT timestamp, details
		FROM system_events
		WHERE event_type = 'risk.kill_switch'
		ORDER BY timestamp DESC
		LIMIT 1
	`).Scan(&ts, &details)
	if err == sql.ErrNoRows {
		return defaultReport, nil
	}
	if err != nil {
		return defaultReport, err
	}
	if !details.Valid || details.String == "" {
		defaultReport["timestamp"] = ts
		return defaultReport, nil
	}

	var report map[string]interface{}
	if err := json.Unmarshal([]byte(details.String), &report); err != nil {
		return defaultReport, err
	}
	report["timestamp"] = ts
	return report, nil
}

func (r *DuckDB) InsertMetrics(_ []map[string]interface{}) error {
	return fmt.Errorf("duckdb is read-only in Go; observability-engine owns writes")
}

func (r *DuckDB) InsertPerformanceRecord(_ map[string]interface{}) error {
	return fmt.Errorf("duckdb is read-only in Go; observability-engine owns writes")
}
