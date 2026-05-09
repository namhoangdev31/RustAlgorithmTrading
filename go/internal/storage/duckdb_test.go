package storage

import (
	"os"
	"testing"
	"time"
)

func TestDuckDBInsertMetrics(t *testing.T) {
	dbPath := "test_metrics.duckdb"
	defer os.Remove(dbPath)

	store, err := NewDuckDBReader(dbPath) // It opens in RW mode now
	if err != nil {
		t.Fatalf("Failed to open DuckDB: %v", err)
	}
	defer store.Close()

	// Ensure table exists (Store.Initialize might be needed if not automatic)
	// For this test, we assume DuckDBReader opens it and tables are created or handled
	
	metrics := []map[string]interface{}{
		{
			"timestamp":   time.Now().Format(time.RFC3339),
			"metric_name": "test_go_ingestion",
			"value":       99.9,
			"symbol":      "GO_STK",
			"labels":      "env=test,version=3.5",
		},
	}

	err = store.InsertMetrics(metrics)
	if err != nil {
		t.Fatalf("InsertMetrics failed: %v", err)
	}

	// Verify (Read back)
	// We can use a raw query or add a GetMetrics method to DuckDBReader
	// For now, if no error, we assume success in this test scope
}

func TestDuckDBInsertPerformanceRecord(t *testing.T) {
	dbPath := "test_perf.duckdb"
	defer os.Remove(dbPath)

	store, err := NewDuckDBReader(dbPath)
	if err != nil {
		t.Fatalf("Failed to open DuckDB: %v", err)
	}
	defer store.Close()

	record := map[string]interface{}{
		"timestamp":       time.Now().Format(time.RFC3339),
		"portfolio_value": 100000.0,
		"pnl":             15000.0,
		"total_return":    0.15,
		"sharpe_ratio":    1.8,
		"max_drawdown":    -0.05,
		"win_rate":        0.62,
		"total_trades":    150,
		"profit_factor":   2.1,
		"strategy_id":     "test_strat",
		"execution_time":  12.5,
	}

	err = store.InsertPerformanceRecord(record)
	if err != nil {
		t.Fatalf("InsertPerformanceRecord failed: %v", err)
	}
}
