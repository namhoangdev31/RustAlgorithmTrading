package gateway

import (
	"context"
	"errors"
	"testing"
	"time"
)

type runnerFunc func(context.Context) error

func (fn runnerFunc) Run(ctx context.Context) error { return fn(ctx) }

func TestFirstRunnerFailureCancelsSiblings(t *testing.T) {
	expected := errors.New("listener failed")
	cancelled := make(chan struct{})
	app := &App{runners: []Runner{
		runnerFunc(func(context.Context) error { return expected }),
		runnerFunc(func(ctx context.Context) error { <-ctx.Done(); close(cancelled); return nil }),
	}}
	if err := app.Run(context.Background()); !errors.Is(err, expected) {
		t.Fatalf("expected %v, got %v", expected, err)
	}
	select {
	case <-cancelled:
	case <-time.After(time.Second):
		t.Fatal("sibling runner was not cancelled")
	}
}
