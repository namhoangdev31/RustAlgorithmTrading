package main

import (
	"context"
	"log/slog"
	"os/signal"
	"syscall"
	"time"

	gatewayapp "trading/control-gateway/internal/app/gateway"
	"trading/control-gateway/internal/platform/config"
	"trading/control-gateway/internal/platform/observability"
)

// @title Trading Gateway Service
// @version 1.0
// @description High-Performance Unified Gateway combining Control Plane & Edge Security.
// @host localhost:8081
// @BasePath /
func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	cfg, err := config.Load()
	if err != nil {
		slog.Error("configuration_invalid", "error", err)
		return
	}
	provider, err := observability.Setup(ctx, observability.Config{ServiceName: cfg.Observability.ServiceName, Environment: cfg.Environment, OTLPEndpoint: cfg.Observability.OTLPEndpoint, Tracing: cfg.Observability.Tracing})
	if err != nil {
		slog.Error("observability_initialization_failed", "error", err)
		return
	}
	defer func() {
		shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := provider.Shutdown(shutdown); err != nil {
			slog.Error("observability_shutdown_failed", "error", err)
		}
	}()
	app, err := gatewayapp.Build(ctx, cfg)
	if err != nil {
		slog.Error("gateway_initialization_failed", "error", err)
		return
	}
	slog.Info("gateway_started", "run_mode", cfg.RunMode)
	if err := app.Run(ctx); err != nil && ctx.Err() == nil {
		slog.Error("gateway_stopped_with_error", "error", err)
	}
}
