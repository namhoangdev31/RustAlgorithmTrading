package main

import (
	"log/slog"
	"os"

	"trading/observability-api/internal/config"
	"trading/observability-api/internal/server"
)

// @title Trading Observability API
// @version 1.0
// @description High-Performance Go Control Plane & Observability API for Algorithmic Trading.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8081
// @BasePath /
func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg := config.LoadConfig()

	s := server.NewServer(cfg)
	if err := s.Run(); err != nil {
		slog.Error("server_run_failed", "error", err)
		os.Exit(1)
	}
}
