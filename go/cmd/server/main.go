package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"trading/observability-api/internal/collector"
	"trading/observability-api/internal/health"
	internalhttp "trading/observability-api/internal/http"
	"trading/observability-api/internal/storage"
	"trading/observability-api/internal/worker"
	"trading/observability-api/internal/ws"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	port := getenvOrDefault("PORT", "8081") // Finalized port 8081
	duckDBPath := getenvOrDefault("DUCKDB_PATH", "data/observability.duckdb")
	sqlitePath := getenvOrDefault("SQLITE_PATH", "data/trades.db")
	databaseURL := os.Getenv("DATABASE_URL")

	duckReader, duckErr := storage.NewDuckDBReader(duckDBPath)
	if duckErr != nil {
		slog.Warn("duckdb_unavailable", "path", duckDBPath, "error", duckErr)
	}

	sqliteReader, sqliteErr := storage.NewSQLiteReader(sqlitePath)
	if sqliteErr != nil {
		slog.Warn("sqlite_unavailable", "path", sqlitePath, "error", sqliteErr)
	}

	var postgresReader *storage.PostgresReader
	if databaseURL != "" {
		var pgErr error
		postgresReader, pgErr = storage.NewPostgresReader(databaseURL)
		if pgErr != nil {
			slog.Warn("postgres_unavailable", "error", pgErr)
		} else {
			slog.Info("postgres_connected")
		}
	}

	store := storage.NewStore(duckReader, sqliteReader, postgresReader)
	defer func() {
		if err := store.Close(); err != nil {
			slog.Warn("store_close_error", "error", err)
		}
	}()

	wsManager := ws.NewManager()
	go wsManager.Start()

	// Wave 1: Initialize Go Metrics Collector (Shadow Run)
	targets := map[string]string{
		"market_data": getenvOrDefault("MARKET_DATA_METRICS_URL", "http://127.0.0.1:9091/metrics"),
		"execution":   getenvOrDefault("EXECUTION_METRICS_URL", "http://127.0.0.1:9092/metrics"),
		"risk":        getenvOrDefault("RISK_METRICS_URL", "http://127.0.0.1:9093/metrics"),
	}
	collectorMgr := collector.NewManager(store, targets)
	go collectorMgr.Start(context.Background())

	metricsWorker := worker.NewMetricsCollector(store, wsManager, collectorMgr)
	go metricsWorker.Start()

	healthAgg := health.NewAggregator(store, wsManager)
	handler := internalhttp.SetupRoutes(store, wsManager, healthAgg)

	server := &http.Server{
		Addr:              "127.0.0.1:" + port,
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		slog.Info("go_control_plane_started", "port", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("go_control_plane_listen_error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collectorMgr.Stop()
	metricsWorker.Stop()
	wsManager.Stop()
	if err := server.Shutdown(ctx); err != nil {
		slog.Error("go_control_plane_shutdown_error", "error", err)
	}
}

func getenvOrDefault(key string, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
