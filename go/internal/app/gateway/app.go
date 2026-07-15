package gateway

import (
	"context"

	"golang.org/x/sync/errgroup"

	"trading/control-gateway/internal/app/controlplane"
	edgeapp "trading/control-gateway/internal/app/edge"
	"trading/control-gateway/internal/platform/config"
)

type Runner interface{ Run(context.Context) error }

type App struct{ runners []Runner }

func Build(ctx context.Context, cfg *config.Config) (*App, error) {
	runners := make([]Runner, 0, 2)
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
		app, err := controlplane.Build(ctx, cfg)
		if err != nil {
			if edge != nil {
				_ = edge.Close()
			}
			return nil, err
		}
		runners = append(runners, app)
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
