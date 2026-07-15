package observability

import (
	"context"
	"errors"
	"log/slog"
	"os"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

type Config struct {
	ServiceName  string
	Environment  string
	OTLPEndpoint string
	Tracing      bool
}

type Provider struct{ tracer *sdktrace.TracerProvider }

func Setup(ctx context.Context, cfg Config) (*Provider, error) {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	if !cfg.Tracing || cfg.OTLPEndpoint == "" {
		return &Provider{}, nil
	}
	exporter, err := otlptracegrpc.New(ctx, otlptracegrpc.WithEndpointURL(cfg.OTLPEndpoint))
	if err != nil {
		return nil, err
	}
	res, err := resource.New(ctx, resource.WithAttributes(
		attribute.String("service.name", cfg.ServiceName),
		attribute.String("deployment.environment", cfg.Environment),
	))
	if err != nil {
		return nil, err
	}
	provider := sdktrace.NewTracerProvider(sdktrace.WithBatcher(exporter), sdktrace.WithResource(res))
	otel.SetTracerProvider(provider)
	return &Provider{tracer: provider}, nil
}

func (p *Provider) Shutdown(ctx context.Context) error {
	if p == nil || p.tracer == nil {
		return nil
	}
	return p.tracer.Shutdown(ctx)
}

func JoinShutdown(errorsToJoin ...error) error { return errors.Join(errorsToJoin...) }
