package config

import (
	"os"
)

type Config struct {
	Server struct {
		Port                 string
		Host                 string
		ObservabilityAPIKey  string
	}
	Storage struct {
		DuckDBPath  string
		DatabaseURL string
	}
	Alpaca struct {
		BaseURL     string
		DataBaseURL string
		APIKey      string
		SecretKey   string
	}
	Metrics struct {
		MarketDataURL string
		ExecutionURL  string
		RiskURL       string
	}
}

func LoadConfig() *Config {
	cfg := &Config{}

	cfg.Server.Port = getenvOrDefault("PORT", "8081")
	cfg.Server.Host = getenvOrDefault("HOST", "127.0.0.1")
	cfg.Server.ObservabilityAPIKey = os.Getenv("OBSERVABILITY_API_KEY")

	cfg.Storage.DuckDBPath = getenvOrDefault("DUCKDB_PATH", "data/observability.duckdb")
	cfg.Storage.DatabaseURL = os.Getenv("DATABASE_URL")

	cfg.Alpaca.BaseURL = getenvOrDefault("ALPACA_BASE_URL", "https://paper-api.alpaca.markets")
	cfg.Alpaca.DataBaseURL = getenvOrDefault("ALPACA_DATA_BASE_URL", "https://data.alpaca.markets")
	cfg.Alpaca.APIKey = os.Getenv("ALPACA_API_KEY")
	cfg.Alpaca.SecretKey = os.Getenv("ALPACA_SECRET_KEY")

	cfg.Metrics.MarketDataURL = getenvOrDefault("MARKET_DATA_METRICS_URL", "http://127.0.0.1:9091/metrics")
	cfg.Metrics.ExecutionURL = getenvOrDefault("EXECUTION_METRICS_URL", "http://127.0.0.1:9092/metrics")
	cfg.Metrics.RiskURL = getenvOrDefault("RISK_METRICS_URL", "http://127.0.0.1:9093/metrics")

	return cfg
}

func getenvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
