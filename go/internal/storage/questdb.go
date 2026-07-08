package storage

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// QuestDB provides access to observability analytics data via PgWire.
type QuestDB struct {
	db *sql.DB
}

// QuestDBReader is a type alias for backward compatibility.
type QuestDBReader = QuestDB

func NewQuestDBReader(connStr string) (*QuestDB, error) {
	// Standard QuestDB PgWire connection string: postgresql://admin:quest@questdb:8812/qdb
	db, err := sql.Open("pgx", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open questdb: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping questdb: %w", err)
	}

	return &QuestDB{db: db}, nil
}

func (r *QuestDB) Initialize() error {
	return nil
}

func (r *QuestDBReader) Close() error {
	if r.db != nil {
		return r.db.Close()
	}
	return nil
}

func (r *QuestDBReader) Ping() error {
	if r.db == nil {
		return fmt.Errorf("questdb connection is nil")
	}
	return r.db.Ping()
}

func (r *QuestDBReader) QueryMetricsHistory(userID string, startTime, endTime string, metricTypes []string) ([]map[string]interface{}, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database not connected")
	}
	if userID == "" {
		userID = "admin"
	}

	// QuestDB uses standard PostgreSQL placeholders ($1, $2, etc.) via pgx/pgwire
	query := `
		SELECT timestamp, metric_name, value, symbol, labels
		FROM trading_metrics
		WHERE user_id = $1 AND timestamp >= $2::timestamp AND timestamp <= $3::timestamp
	`
	args := []interface{}{userID, startTime, endTime}
	paramCount := 3

	if len(metricTypes) > 0 {
		placeholders := make([]string, 0, len(metricTypes))
		for _, mt := range metricTypes {
			paramCount++
			placeholders = append(placeholders, fmt.Sprintf("$%d", paramCount))
			args = append(args, mt)
		}
		query += fmt.Sprintf(" AND metric_name IN (%s)", strings.Join(placeholders, ","))
	}
	query += " ORDER BY timestamp DESC LIMIT 5000"

	rows, err := r.db.Query(query, args...)
	if err != nil {
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

func (r *QuestDBReader) QueryCurrentMetricsSnapshot(userID string) (map[string]interface{}, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database not connected")
	}
	if userID == "" {
		userID = "admin"
	}

	query := `
		SELECT metric_name, value, symbol, labels
		FROM trading_metrics
		WHERE user_id = $1
		ORDER BY timestamp DESC
		LIMIT 5000
	`
	rows, err := r.db.Query(query, userID)
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

func (r *QuestDBReader) QueryPerformanceSummary(userID string) (map[string]interface{}, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database not connected")
	}
	if userID == "" {
		userID = "admin"
	}

	query := `
		SELECT portfolio_value, pnl, total_trades
		FROM performance_history
		WHERE user_id = $1
		ORDER BY timestamp DESC
		LIMIT 1
	`
	var (
		portfolioValue float64
		pnl            float64
		totalTrades    int64
	)
	err := r.db.QueryRow(query, userID).Scan(&portfolioValue, &pnl, &totalTrades)
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

func (r *QuestDBReader) QueryPerformanceHistory(userID string, limit int) ([]map[string]interface{}, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database not connected")
	}
	if userID == "" {
		userID = "admin"
	}
	if limit <= 0 {
		limit = 100
	}

	query := `
		SELECT timestamp, portfolio_value, pnl, sharpe_ratio, max_drawdown
		FROM performance_history
		WHERE user_id = $1
		ORDER BY timestamp DESC
		LIMIT $2
	`
	rows, err := r.db.Query(query, userID, limit)
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

func (r *QuestDBReader) QueryLogs(userID string, level string, limit int) ([]map[string]interface{}, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database not connected")
	}
	if userID == "" {
		userID = "admin"
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
		WHERE user_id = $1 AND (severity = $2 OR $3 = 'ALL')
		ORDER BY timestamp DESC
		LIMIT $4
	`
	rows, err := r.db.Query(query, userID, level, level, limit)
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

func (r *QuestDBReader) QueryLatestIntegrityReport(userID string) (map[string]interface{}, error) {
	defaultReport := map[string]interface{}{
		"is_valid": true,
		"reasons":  []interface{}{},
		"metrics":  map[string]interface{}{},
	}
	if r.db == nil {
		return defaultReport, fmt.Errorf("database not connected")
	}
	if userID == "" {
		userID = "admin"
	}

	var (
		ts      string
		details sql.NullString
	)
	query := `
		SELECT timestamp, details
		FROM system_events
		WHERE user_id = $1 AND event_type = 'risk.kill_switch'
		ORDER BY timestamp DESC
		LIMIT 1
	`
	err := r.db.QueryRow(query, userID).Scan(&ts, &details)
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
