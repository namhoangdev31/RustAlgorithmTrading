package server

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"trading/observability-api/internal/alerts"
	"trading/observability-api/internal/alpaca"
	"trading/observability-api/internal/collector"
	"trading/observability-api/internal/config"
	"trading/observability-api/internal/health"
	"trading/observability-api/internal/middleware"
	"trading/observability-api/internal/storage"
	"trading/observability-api/internal/worker"
	"trading/observability-api/internal/ws"
)

type Server struct {
	cfg              *config.Config
	store            *storage.Store
	wsManager        *ws.Manager
	collectorMgr     *collector.Manager
	metricsWorker    *worker.MetricsCollector
	healthAggregator *health.Aggregator
	incidentManager  *alerts.Manager
	alpacaClient     *alpaca.Client
	httpServer       *http.Server
}

func NewServer(cfg *config.Config) *Server {
	return &Server{
		cfg: cfg,
	}
}

func (s *Server) Run() error {
	// Initialize Storage
	duckReader, duckErr := storage.NewDuckDBReader(s.cfg.Storage.DuckDBPath)
	if duckErr != nil {
		slog.Warn("duckdb_unavailable", "path", s.cfg.Storage.DuckDBPath, "error", duckErr)
	}

	var postgresReader *storage.PostgresReader
	if s.cfg.Storage.DatabaseURL != "" {
		pgReader, pgErr := storage.NewPostgresReader(s.cfg.Storage.DatabaseURL)
		if pgErr != nil {
			slog.Warn("postgres_unavailable", "error", pgErr)
		} else {
			slog.Info("postgres_connected")
			postgresReader = pgReader
		}
	}

	s.store = storage.NewStore(duckReader, postgresReader)

	// Initialize Websocket Manager
	s.wsManager = ws.NewManager()
	go s.wsManager.Start()

	// Initialize Go Metrics Collector (Shadow Run)
	targets := map[string]string{
		"market_data": s.cfg.Metrics.MarketDataURL,
		"execution":   s.cfg.Metrics.ExecutionURL,
		"risk":        s.cfg.Metrics.RiskURL,
	}
	s.collectorMgr = collector.NewManager(s.store, targets)
	go s.collectorMgr.Start(context.Background())

	// Initialize Metrics Worker
	s.metricsWorker = worker.NewMetricsCollector(s.store, s.wsManager, s.collectorMgr)
	go s.metricsWorker.Start()

	// Initialize Health Aggregator & Incident Manager
	s.healthAggregator = health.NewAggregator(s.store, s.wsManager)
	s.incidentManager = alerts.NewManager()

	// Initialize Alpaca Client
	if client, err := alpaca.NewClient(alpaca.Config{
		BaseURL:   s.cfg.Alpaca.BaseURL,
		APIKey:    s.cfg.Alpaca.APIKey,
		SecretKey: s.cfg.Alpaca.SecretKey,
	}); err == nil {
		s.alpacaClient = client
	} else {
		slog.Warn("alpaca_client_unavailable", "error", err)
	}

	// Setup Gin
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CorrelationID())
	r.Use(middleware.Logger())
	r.Use(middleware.SetupCors())

	limiter := middleware.NewLimiter(10000, time.Minute)
	r.Use(limiter.Middleware())

	s.mapRoutes(r)

	// Start HTTP Server
	s.httpServer = &http.Server{
		Addr:              s.cfg.Server.Host + ":" + s.cfg.Server.Port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		slog.Info("go_control_plane_started", "host", s.cfg.Server.Host, "port", s.cfg.Server.Port)
		if err := s.httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("go_control_plane_listen_error", "error", err)
		}
	}()

	// Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting_down_go_control_plane")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	s.collectorMgr.Stop()
	s.metricsWorker.Stop()
	s.wsManager.Stop()

	if err := s.store.Close(); err != nil {
		slog.Warn("store_close_error", "error", err)
	}

	if err := s.httpServer.Shutdown(ctx); err != nil {
		slog.Error("go_control_plane_shutdown_error", "error", err)
		return err
	}

	slog.Info("go_control_plane_exited")
	return nil
}
