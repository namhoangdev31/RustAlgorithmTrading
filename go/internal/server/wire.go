//go:build wireinject
// +build wireinject

package server

import (
	"github.com/google/wire"
	"trading/observability-api/internal/alerts"
	"trading/observability-api/internal/config"
	"trading/observability-api/internal/delivery/http/handlers"
	"trading/observability-api/internal/domain/repositories"
	"trading/observability-api/internal/health"
	"trading/observability-api/internal/repository/alpaca"
	"trading/observability-api/internal/repository/duckdb"
	"trading/observability-api/internal/repository/postgres"
	"trading/observability-api/internal/storage"
	"trading/observability-api/internal/usecase"
	"trading/observability-api/internal/worker"
	"trading/observability-api/internal/ws"
)

// ProvideDuckDBReader initializes DuckDB reader from config.
func ProvideDuckDBReader(cfg *config.Config) *storage.DuckDBReader {
	reader, err := storage.NewDuckDBReader(cfg.Storage.DuckDBPath)
	if err != nil {
		return nil
	}
	return reader
}

// ProvidePostgresReader initializes Postgres reader from config database URL.
func ProvidePostgresReader(cfg *config.Config) *storage.PostgresReader {
	if cfg.Storage.DatabaseURL == "" {
		return nil
	}
	reader, err := storage.NewPostgresReader(cfg.Storage.DatabaseURL)
	if err != nil {
		return nil
	}
	return reader
}

// ProvideAlpacaRepository initializes Alpaca client adapter matching repository contract.
func ProvideAlpacaRepository(cfg *config.Config) repositories.AlpacaRepository {
	client, err := alpaca.NewClient(alpaca.Config{
		BaseURL:   cfg.Alpaca.BaseURL,
		APIKey:    cfg.Alpaca.APIKey,
		SecretKey: cfg.Alpaca.SecretKey,
	})
	if err != nil {
		return nil
	}
	return client
}

// InitializeServer compiles and resolves the Server dependency graph.
func InitializeServer(cfg *config.Config) (*Server, error) {
	wire.Build(
		// Core Infrastructure
		ProvideDuckDBReader,
		ProvidePostgresReader,
		storage.NewStore,
		ws.NewManager,
		alerts.NewManager,
		ProvideAlpacaRepository,
		health.NewAggregator,
		worker.NewMetricsCollector,

		// Repositories
		postgres.NewRawSQLTradeRepository,
		postgres.NewRawSQLAlertRepository,
		duckdb.NewDuckDBMetricRepository,
		duckdb.NewHybridSystemRepository,

		// UseCases
		usecase.NewTradeUseCase,
		usecase.NewAlertUseCase,
		usecase.NewMetricUseCase,
		usecase.NewAlpacaUseCase,
		usecase.NewSystemUseCase,

		// HTTP Delivery Handlers
		handlers.NewTradeHandler,
		handlers.NewAlertHandler,
		handlers.NewMetricHandler,
		handlers.NewAlpacaHandler,
		handlers.NewSystemHandler,

		// Server
		NewServer,
	)
	return nil, nil
}
