package storage

import (
	"database/sql"
	"path/filepath"
	"strings"
	"testing"
	"time"

	_ "github.com/marcboeker/go-duckdb"
)

func TestDuckDBReadOnlyQueries(t *testing.T) {
	dbPath := createDuckDBFixture(t)

	reader, err := NewDuckDBReader(dbPath)
	if err != nil {
		t.Fatalf("NewDuckDBReader failed: %v", err)
	}
	defer reader.Close()

	history, err := reader.QueryMetricsHistory("1970-01-01 00:00:00", "2999-01-01 00:00:00", []string{"market_price"})
	if err != nil {
		t.Fatalf("QueryMetricsHistory failed: %v", err)
	}
	if len(history) != 2 {
		t.Fatalf("expected 2 history rows, got %d", len(history))
	}

	summary, err := reader.QueryPerformanceSummary()
	if err != nil {
		t.Fatalf("QueryPerformanceSummary failed: %v", err)
	}
	if summary["portfolio_value"] != 100000.0 {
		t.Fatalf("unexpected portfolio value: %v", summary["portfolio_value"])
	}

	logs, err := reader.QueryLogs("INFO", 10)
	if err != nil {
		t.Fatalf("QueryLogs failed: %v", err)
	}
	if len(logs) != 1 {
		t.Fatalf("expected 1 log row, got %d", len(logs))
	}

	snapshot, err := reader.QueryCurrentMetricsSnapshot()
	if err != nil {
		t.Fatalf("QueryCurrentMetricsSnapshot failed: %v", err)
	}
	marketData, ok := snapshot["market_data"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected market_data snapshot, got %#v", snapshot)
	}
	if marketData["market_price"] != 123.45 {
		t.Fatalf("unexpected market_price: %v", marketData["market_price"])
	}

	report, err := reader.QueryLatestIntegrityReport()
	if err != nil {
		t.Fatalf("QueryLatestIntegrityReport failed: %v", err)
	}
	if valid, ok := report["is_valid"].(bool); !ok || valid {
		t.Fatalf("expected invalid integrity report, got %#v", report)
	}
}

func TestDuckDBReadOnlyRejectsWrites(t *testing.T) {
	dbPath := createDuckDBFixture(t)

	reader, err := NewDuckDBReader(dbPath)
	if err != nil {
		t.Fatalf("NewDuckDBReader failed: %v", err)
	}
	defer reader.Close()

	err = reader.InsertMetrics([]map[string]interface{}{
		{"metric_name": "should_not_write", "value": 1.0},
	})
	if err == nil || !strings.Contains(err.Error(), "read-only") {
		t.Fatalf("expected read-only write rejection, got %v", err)
	}

	err = reader.InsertPerformanceRecord(map[string]interface{}{"portfolio_value": 1.0})
	if err == nil || !strings.Contains(err.Error(), "read-only") {
		t.Fatalf("expected read-only performance write rejection, got %v", err)
	}
}

func createDuckDBFixture(t *testing.T) string {
	t.Helper()

	dbPath := filepath.Join(t.TempDir(), "telemetry.duckdb")
	db, err := sql.Open("duckdb", dbPath)
	if err != nil {
		t.Fatalf("open fixture duckdb: %v", err)
	}
	defer db.Close()

	_, err = db.Exec(`
		CREATE TABLE trading_metrics (
			timestamp TIMESTAMP NOT NULL,
			metric_name VARCHAR NOT NULL,
			value DOUBLE NOT NULL,
			symbol VARCHAR,
			labels VARCHAR
		);
		CREATE TABLE performance_history (
			timestamp TIMESTAMP NOT NULL PRIMARY KEY,
			portfolio_value DOUBLE NOT NULL,
			pnl DOUBLE NOT NULL,
			sharpe_ratio DOUBLE,
			max_drawdown DOUBLE,
			win_rate DOUBLE,
			total_trades INTEGER
		);
		CREATE TABLE system_events (
			timestamp TIMESTAMP NOT NULL,
			event_type VARCHAR,
			severity VARCHAR,
			message VARCHAR,
			details VARCHAR
		);
	`)
	if err != nil {
		t.Fatalf("create fixture schema: %v", err)
	}

	now := time.Now().UTC()
	labels := `{"service":"market_data","metric_type":"gauge","symbol":"AAPL"}`
	_, err = db.Exec(
		"INSERT INTO trading_metrics (timestamp, metric_name, value, symbol, labels) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)",
		now.Add(-time.Minute).Format("2006-01-02 15:04:05"),
		"market_price",
		111.0,
		"AAPL",
		labels,
		now.Format("2006-01-02 15:04:05"),
		"market_price",
		123.45,
		"AAPL",
		labels,
	)
	if err != nil {
		t.Fatalf("insert fixture metrics: %v", err)
	}

	_, err = db.Exec(
		"INSERT INTO performance_history (timestamp, portfolio_value, pnl, total_trades, sharpe_ratio, max_drawdown, win_rate) VALUES (?, ?, ?, ?, ?, ?, ?)",
		now.Format("2006-01-02 15:04:05"),
		100000.0,
		2500.0,
		7,
		1.2,
		-0.02,
		0.57,
	)
	if err != nil {
		t.Fatalf("insert fixture performance: %v", err)
	}

	_, err = db.Exec(
		"INSERT INTO system_events (timestamp, event_type, severity, message, details) VALUES (?, ?, ?, ?, ?)",
		now.Format("2006-01-02 15:04:05"),
		"system",
		"INFO",
		"fixture ready",
		`{"service":"telemetry-engine"}`,
	)
	if err != nil {
		t.Fatalf("insert fixture event: %v", err)
	}

	_, err = db.Exec(
		"INSERT INTO system_events (timestamp, event_type, severity, message, details) VALUES (?, ?, ?, ?, ?)",
		now.Add(time.Second).Format("2006-01-02 15:04:05"),
		"risk.kill_switch",
		"CRITICAL",
		"Integrity validation failed; kill switch requested",
		`{"is_valid":false,"reasons":["pnl drift too high"],"metrics":{"pnl_drift_pct":0.25},"source":"telemetry-engine"}`,
	)
	if err != nil {
		t.Fatalf("insert fixture integrity event: %v", err)
	}

	return dbPath
}
