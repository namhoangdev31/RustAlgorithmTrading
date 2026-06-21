package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"trading/observability-api/internal/edge"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg := edge.Config{
		Host:                    getenvOrDefault("HOST", "0.0.0.0"),
		Port:                    getenvOrDefault("PORT", "8088"),
		RedisURL:                os.Getenv("REDIS_URL"),
		StorageRoot:             getenvOrDefault("LEPOS_STORAGE_ROOT", "."),
		ControlPlaneURL:         getenvOrDefault("LEPOS_CONTROL_PLANE_URL", "http://127.0.0.1:3000"),
		InternalAPIKey:          os.Getenv("LEPOS_INTERNAL_API_KEY"),
		ControlPlaneTLSCertPath: os.Getenv("LEPOS_CONTROL_PLANE_TLS_CERT"),
		ControlPlaneTLSKeyPath:  os.Getenv("LEPOS_CONTROL_PLANE_TLS_KEY"),
		ControlPlaneTLSCAPath:   os.Getenv("LEPOS_CONTROL_PLANE_TLS_CA"),
		ServiceID:               getenvOrDefault("LEPOS_SERVICE_ID", "edge-gateway"),
		ServiceSecret:           os.Getenv("LEPOS_SERVICE_SECRET"),
		IPFSGatewayURL:          getenvOrDefault("LEPOS_IPFS_GATEWAY_URL", "https://ipfs.io/ipfs"),
		ArweaveGatewayURL:       getenvOrDefault("LEPOS_ARWEAVE_GATEWAY_URL", "https://arweave.net"),
	}

	gateway, err := edge.NewGateway(cfg)
	if err != nil {
		slog.Error("edge_gateway_init_error", "error", err)
		os.Exit(1)
	}
	defer gateway.Close()

	server := &http.Server{
		Addr:              cfg.Host + ":" + cfg.Port,
		Handler:           gateway.Routes(),
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		slog.Info("edge_gateway_started", "host", cfg.Host, "port", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("edge_gateway_listen_error", "error", err)
			os.Exit(1)
		}
	}()

	// Start HTTPS server
	tlsPort := getenvOrDefault("TLS_PORT", "8443")
	tlsServer := &http.Server{
		Addr:              cfg.Host + ":" + tlsPort,
		Handler:           gateway.Routes(),
		ReadHeaderTimeout: 10 * time.Second,
		TLSConfig:         gateway.TLSConfig(),
	}

	go func() {
		slog.Info("edge_gateway_tls_started", "host", cfg.Host, "port", tlsPort)
		if err := tlsServer.ListenAndServeTLS("", ""); err != nil && err != http.ErrServerClosed {
			slog.Error("edge_gateway_tls_listen_error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_ = server.Shutdown(ctx)
	if err := tlsServer.Shutdown(ctx); err != nil {
		slog.Error("edge_gateway_shutdown_error", "error", err)
	}
}

func getenvOrDefault(key string, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
