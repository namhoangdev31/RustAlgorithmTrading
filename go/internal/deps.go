//go:build tools
// +build tools

package internal

// Pinning dependencies to prevent 'go mod tidy' from removing them during development.
import (
	_ "github.com/go-playground/validator/v10"
	_ "github.com/golang-jwt/jwt/v5"
	_ "github.com/nats-io/nats.go"
	_ "github.com/oapi-codegen/runtime"
	_ "github.com/prometheus/client_golang/prometheus"
	_ "github.com/spf13/viper"
	_ "github.com/google/wire"
	_ "go.opentelemetry.io/otel"
)
