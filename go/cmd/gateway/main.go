package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"trading/control-gateway/internal/config"
	"trading/control-gateway/internal/edge"
	"trading/control-gateway/internal/server"
)

// @title Trading Gateway Service
// @version 1.0
// @description High-Performance Unified Gateway combining Control Plane & Edge Security.
// @host localhost:8081
// @BasePath /
func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// Mode determines what services to spin up: "both" (default), "control-plane", or "edge-gateway"
	runMode := getenvOrDefault("GATEWAY_RUN_MODE", "both")
	slog.Info("starting_gateway_service", "run_mode", runMode)

	var edgeHttpServer *http.Server
	var edgeTlsServer *http.Server
	var edgeGateway *edge.Gateway

	// 1. Initialize Control Plane
	if runMode == "both" || runMode == "control-plane" {
		cfg := config.LoadConfig()
		s, err := server.InitializeServer(cfg)
		if err != nil {
			slog.Error("control_plane_initialization_failed", "error", err)
			os.Exit(1)
		}

		// Start control plane HTTP listener in background
		go func() {
			slog.Info("control_plane_started", "host", cfg.Server.Host, "port", cfg.Server.Port)
			if err := s.Run(); err != nil {
				slog.Error("control_plane_run_failed", "error", err)
				os.Exit(1)
			}
		}()
	}

	// 2. Initialize Edge Gateway
	if runMode == "both" || runMode == "edge-gateway" {
		cfg := edge.Config{
			Host:                    getenvOrDefault("HOST", "0.0.0.0"),
			Port:                    getenvOrDefault("EDGE_PORT", "8088"),
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
		edgeGateway = gateway

		edgeHttpServer = &http.Server{
			Addr:              cfg.Host + ":" + cfg.Port,
			Handler:           gateway.Routes(),
			ReadHeaderTimeout: 10 * time.Second,
		}

		go func() {
			slog.Info("edge_gateway_http_started", "host", cfg.Host, "port", cfg.Port)
			if err := edgeHttpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				slog.Error("edge_gateway_listen_error", "error", err)
				os.Exit(1)
			}
		}()

		// Start Edge HTTPS server
		tlsPort := getenvOrDefault("TLS_PORT", "8443")
		edgeTlsServer = &http.Server{
			Addr:              cfg.Host + ":" + tlsPort,
			Handler:           gateway.Routes(),
			ReadHeaderTimeout: 10 * time.Second,
			TLSConfig:         gateway.TLSConfig(),
		}

		go func() {
			slog.Info("edge_gateway_tls_started", "host", cfg.Host, "port", tlsPort)
			if err := edgeTlsServer.ListenAndServeTLS("", ""); err != nil && err != http.ErrServerClosed {
				slog.Error("edge_gateway_tls_listen_error", "error", err)
				os.Exit(1)
			}
		}()
	}

	// 3. Graceful Shutdown Coordinator
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting_down_gateway_service")
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if edgeHttpServer != nil {
		_ = edgeHttpServer.Shutdown(ctx)
	}
	if edgeTlsServer != nil {
		_ = edgeTlsServer.Shutdown(ctx)
	}
	if edgeGateway != nil {
		edgeGateway.Close()
	}

	// Control plane gracefully stops internally upon catching signals via its own handlers.
	// We wait briefly for all background routines to flush.
	time.Sleep(2 * time.Second)
	slog.Info("gateway_service_exited")
}

func getenvOrDefault(key string, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
