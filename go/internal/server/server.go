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

	"trading/control-gateway/internal/alerts"
	"trading/control-gateway/internal/config"
	deliveryHttp "trading/control-gateway/internal/delivery/http"
	"trading/control-gateway/internal/delivery/http/handlers"
	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/health"
	"trading/control-gateway/internal/middleware"
	"trading/control-gateway/internal/storage"
	"trading/control-gateway/internal/worker"
	"trading/control-gateway/internal/ws"
)

type Server struct {
	cfg              *config.Config
	store            *storage.Store
	wsManager        *ws.Manager
	metricsWorker    *worker.MetricsCollector
	healthAggregator *health.Aggregator
	incidentManager  *alerts.Manager
	alpacaClient     repositories.AlpacaRepository
	alertHandler     *handlers.AlertHandler
	alpacaHandler    *handlers.AlpacaHandler
	metricHandler    *handlers.MetricHandler
	tradeHandler     *handlers.TradeHandler
	systemHandler    *handlers.SystemHandler
	riskLimitsHandler *handlers.RiskLimitsHandler
	httpServer       *http.Server
}

func NewServer(
	cfg *config.Config,
	store *storage.Store,
	wsManager *ws.Manager,
	metricsWorker *worker.MetricsCollector,
	healthAggregator *health.Aggregator,
	incidentManager *alerts.Manager,
	alpacaClient repositories.AlpacaRepository,
	alertHandler *handlers.AlertHandler,
	alpacaHandler *handlers.AlpacaHandler,
	metricHandler *handlers.MetricHandler,
	tradeHandler *handlers.TradeHandler,
	systemHandler *handlers.SystemHandler,
	riskLimitsHandler *handlers.RiskLimitsHandler,
) *Server {
	return &Server{
		cfg:               cfg,
		store:             store,
		wsManager:         wsManager,
		metricsWorker:     metricsWorker,
		healthAggregator:  healthAggregator,
		incidentManager:   incidentManager,
		alpacaClient:      alpacaClient,
		alertHandler:      alertHandler,
		alpacaHandler:     alpacaHandler,
		metricHandler:     metricHandler,
		tradeHandler:      tradeHandler,
		systemHandler:     systemHandler,
		riskLimitsHandler: riskLimitsHandler,
	}
}

func (s *Server) Run() error {
	// Start Websocket Manager
	go s.wsManager.Start()

	// Start Metrics Worker
	go s.metricsWorker.Start()

	// Setup Gin & Wire Clean Architecture Layers
	r := s.setupRouter()

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

// setupRouter registers HTTP endpoints on the Gin engine using injected handlers.
func (s *Server) setupRouter() *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CorrelationID())
	r.Use(middleware.Logger())
	r.Use(middleware.SetupCors())

	limiter := middleware.NewLimiter(10000, time.Minute)
	r.Use(limiter.Middleware())

	// Map Routes using pre-injected handlers
	deliveryHttp.MapRoutes(deliveryHttp.RouterConfig{
		Engine:           r,
		HealthAggregator: s.healthAggregator,
		WSManager:        s.wsManager,
		AlertHandler:     s.alertHandler,
		AlpacaHandler:    s.alpacaHandler,
		MetricHandler:     s.metricHandler,
		TradeHandler:      s.tradeHandler,
		SystemHandler:     s.systemHandler,
		RiskLimitsHandler: s.riskLimitsHandler,
	})

	return r
}
