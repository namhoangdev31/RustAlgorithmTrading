package gateway

import (
	"context"
	"errors"

	"golang.org/x/sync/errgroup"

	edgeapp "trading/control-gateway/internal/app/edge"
	otaapp "trading/control-gateway/internal/app/ota"
	quantapp "trading/control-gateway/internal/app/quant"
	"trading/control-gateway/internal/platform/config"
	"trading/control-gateway/internal/platform/health"
	"trading/control-gateway/internal/platform/httpserver"
)

type Runner interface{ Run(context.Context) error }

type App struct{ runners []Runner }

func Build(ctx context.Context, cfg *config.Config) (*App, error) {
	runners := make([]Runner, 0, 4)
	var edge *edgeapp.App
	if cfg.RunMode == "both" || cfg.RunMode == "edge-gateway" {
		app, err := edgeapp.Build(cfg)
		if err != nil {
			return nil, err
		}
		edge = app
		runners = append(runners, app)
	}
	if cfg.RunMode == "both" || cfg.RunMode == "control-plane" {
		quant, err := quantapp.Build(ctx, cfg)
		if err != nil {
			if edge != nil {
				_ = edge.Close()
			}
			return nil, err
		}
		ota, err := otaapp.Build(ctx, cfg)
		if err != nil {
			_ = quant.Close()
			if edge != nil {
				_ = edge.Close()
			}
			return nil, err
		}
		checks := append([]health.DependencyCheck{}, quant.ReadinessChecks()...)
		checks = append(checks, ota.ReadinessChecks()...)
		aggregator := health.New(quant.Connections(), checks...)
		router := NewRouter(RouterDependencies{
			ServiceName: cfg.Observability.ServiceName, APIKey: cfg.Server.TelemetryAPIKey,
			Health: aggregator, Quant: quant, OTA: ota,
		})
		server := httpserver.New(cfg.Server.Host+":"+cfg.Server.Port, router)
		runners = append(runners, server, quant, ota)
	}
	if len(runners) == 0 {
		return nil, errors.New("gateway has no enabled runtime")
	}
	return &App{runners: runners}, nil
}

func (a *App) Run(ctx context.Context) error {
	group, runCtx := errgroup.WithContext(ctx)
	for _, runner := range a.runners {
		runner := runner
		group.Go(func() error { return runner.Run(runCtx) })
	}
	return group.Wait()
}
