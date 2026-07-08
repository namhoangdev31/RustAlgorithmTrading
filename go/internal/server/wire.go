//go:build wireinject
// +build wireinject

package server

import (
	"github.com/google/wire"
	"github.com/redis/go-redis/v9"
	"trading/control-gateway/internal/alerts"
	"trading/control-gateway/internal/config"
	"trading/control-gateway/internal/delivery/http/handlers"
	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/health"
	"trading/control-gateway/internal/repository/alpaca"
	"trading/control-gateway/internal/repository/duckdb"
	"trading/control-gateway/internal/repository/postgres"
	"trading/control-gateway/internal/storage"
	"trading/control-gateway/internal/usecase"
	"trading/control-gateway/internal/worker"
	"trading/control-gateway/internal/ws"
)

// ProvideRedisClient initializes a Redis client from config.
func ProvideRedisClient(cfg *config.Config) *redis.Client {
	if cfg.Storage.RedisURL == "" {
		return nil
	}
	options, err := redis.ParseURL(cfg.Storage.RedisURL)
	if err != nil {
		return nil
	}
	return redis.NewClient(options)
}

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
		ProvideRedisClient,
		storage.NewStore,
		ws.NewManager,
		alerts.NewManager,
		ProvideAlpacaRepository,
		health.NewAggregator,
		worker.NewMetricsCollector,

		// Repositories
		postgres.NewRawSQLTradeRepository,
		postgres.NewRawSQLAlertRepository,
		postgres.NewGormRiskLimitsRepository,
		duckdb.NewDuckDBMetricRepository,
		duckdb.NewHybridSystemRepository,

		// UseCases
		usecase.NewTradeUseCase,
		usecase.NewAlertUseCase,
		usecase.NewMetricUseCase,
		usecase.NewAlpacaUseCase,
		usecase.NewSystemUseCase,
		usecase.NewRiskLimitsUseCase,

		// HTTP Delivery Handlers
		handlers.NewTradeHandler,
		handlers.NewAlertHandler,
		handlers.NewMetricHandler,
		handlers.NewAlpacaHandler,
		handlers.NewSystemHandler,
		handlers.NewRiskLimitsHandler,

		// Server
		NewServer,
	)
	return nil, nil
}
