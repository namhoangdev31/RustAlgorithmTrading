package config

import (
	"log/slog"
	"strings"

	"github.com/spf13/viper"
)

// Config holds the configuration values for the Go control plane.
type Config struct {
	Server struct {
		Port                string
		Host                string
		ObservabilityAPIKey string
	}
	Storage struct {
		DuckDBPath  string
		DatabaseURL string
		RedisURL    string
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

// LoadConfig loads server configurations using Viper.
func LoadConfig() *Config {
	v := viper.New()

	// Enable reading env variables automatically
	v.AutomaticEnv()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	// Set defaults
	v.SetDefault("PORT", "8081")
	v.SetDefault("HOST", "127.0.0.1")
	v.SetDefault("DUCKDB_PATH", "data/observability.duckdb")
	v.SetDefault("ALPACA_BASE_URL", "https://paper-api.alpaca.markets")
	v.SetDefault("ALPACA_DATA_BASE_URL", "https://data.alpaca.markets")
	v.SetDefault("MARKET_DATA_METRICS_URL", "http://127.0.0.1:9091/metrics")
	v.SetDefault("EXECUTION_METRICS_URL", "http://127.0.0.1:9092/metrics")
	v.SetDefault("RISK_METRICS_URL", "http://127.0.0.1:9093/metrics")
	v.SetDefault("REDIS_URL", "redis://127.0.0.1:6379/0")

	// Read from .env file if it exists at the root path
	v.SetConfigFile(".env")
	v.SetConfigType("env")
	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			slog.Debug("dot_env_config_not_read", "error", err.Error())
		}
	}

	cfg := &Config{}

	cfg.Server.Port = v.GetString("PORT")
	cfg.Server.Host = v.GetString("HOST")
	cfg.Server.ObservabilityAPIKey = v.GetString("OBSERVABILITY_API_KEY")

	cfg.Storage.DuckDBPath = v.GetString("DUCKDB_PATH")
	cfg.Storage.DatabaseURL = v.GetString("DATABASE_URL")
	cfg.Storage.RedisURL = v.GetString("REDIS_URL")

	cfg.Alpaca.BaseURL = v.GetString("ALPACA_BASE_URL")
	cfg.Alpaca.DataBaseURL = v.GetString("ALPACA_DATA_BASE_URL")
	cfg.Alpaca.APIKey = v.GetString("ALPACA_API_KEY")
	cfg.Alpaca.SecretKey = v.GetString("ALPACA_SECRET_KEY")

	cfg.Metrics.MarketDataURL = v.GetString("MARKET_DATA_METRICS_URL")
	cfg.Metrics.ExecutionURL = v.GetString("EXECUTION_METRICS_URL")
	cfg.Metrics.RiskURL = v.GetString("RISK_METRICS_URL")

	return cfg
}
