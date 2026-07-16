package quant

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	operationsalerts "trading/control-gateway/internal/modules/operations/adapter/alerts"
	operationshttp "trading/control-gateway/internal/modules/operations/adapter/http"
	operationsquestdb "trading/control-gateway/internal/modules/operations/adapter/questdb"
	operationsworker "trading/control-gateway/internal/modules/operations/adapter/worker"
	operationsws "trading/control-gateway/internal/modules/operations/adapter/ws"
	operationsapp "trading/control-gateway/internal/modules/operations/application"
	quantanthttp "trading/control-gateway/internal/modules/quantant/adapter/http"
	quantantredis "trading/control-gateway/internal/modules/quantant/adapter/redis"
	quantantpostgres "trading/control-gateway/internal/modules/quantant/adapter/postgres"
	quantantquestdb "trading/control-gateway/internal/modules/quantant/adapter/questdb"
	quantantws "trading/control-gateway/internal/modules/quantant/adapter/ws"
	quantantapp "trading/control-gateway/internal/modules/quantant/application"
	tradingalpaca "trading/control-gateway/internal/modules/trading/adapter/alpaca"
	tradinghttp "trading/control-gateway/internal/modules/trading/adapter/http"
	tradingpostgres "trading/control-gateway/internal/modules/trading/adapter/postgres"
	tradingredis "trading/control-gateway/internal/modules/trading/adapter/redis"
	tradingapp "trading/control-gateway/internal/modules/trading/application"
	"trading/control-gateway/internal/platform/cache"
	"trading/control-gateway/internal/platform/config"
	"trading/control-gateway/internal/platform/database"
	"trading/control-gateway/internal/platform/health"
	"trading/control-gateway/internal/platform/httpx"
)

// Component owns the Quant Trading adapters and lifecycle. It does not own the
// gateway HTTP server or any OTA dependency.
type Component struct {
	alerts          *operationshttp.AlertHandler
	alpaca          *tradinghttp.AlpacaHandler
	metrics         *operationshttp.MetricHandler
	trades          *tradinghttp.TradeHandler
	risk            *tradinghttp.RiskLimitsHandler
	quantAnt        *quantanthttp.Handler
	quantAntService *quantantapp.Service
	quantAntEnabled bool
	quantAntWS      *quantantws.Hub
	systemRepo      operationsapp.SystemRepository
	collector       *operationsworker.MetricsCollector
	websocket       *operationsws.Manager
	checks          []health.DependencyCheck
	postgres        *database.Postgres
	questdb         *database.QuestDB
	redis           *redis.Client
	closeOnce       sync.Once
}

func Build(ctx context.Context, cfg *config.Config) (*Component, error) {
	if err := cfg.ValidateQuant(); err != nil {
		return nil, fmt.Errorf("validate quant: %w", err)
	}
	postgres, err := database.OpenPostgres(ctx, cfg.Storage.DatabaseURL)
	if err != nil {
		return nil, err
	}
	questdb, err := database.NewQuestDBReader(cfg.Storage.QuestDBURL)
	if err != nil {
		_ = postgres.Close()
		return nil, fmt.Errorf("open quant questdb: %w", err)
	}
	var redisClient *redis.Client
	if cfg.Storage.RedisURL != "" {
		redisClient, err = cache.OpenRedis(ctx, cfg.Storage.RedisURL)
		if err != nil {
			slog.Warn("quant_redis_unavailable", "error", err)
			redisClient = nil
		}
	}

	wsManager := operationsws.NewManager()
	metricRepo := operationsquestdb.NewMetricRepository(questdb)
	systemRepo := operationsquestdb.NewSystemRepository(questdb, database.EntClient(postgres))
	incidentRepo := operationsalerts.NewManager()

	tradeRepo := tradingpostgres.NewTradeRepository(database.EntClient(postgres))
	riskRepo := tradingpostgres.NewRiskLimitsRepository(database.EntClient(postgres))
	var riskPublisher tradingapp.RiskPublisher
	if redisClient != nil {
		riskPublisher = tradingredis.NewPublisher(redisClient)
	}
	var alpacaRepo tradingapp.AlpacaRepository
	if client, clientErr := tradingalpaca.NewClient(tradingalpaca.Config{
		BaseURL: cfg.Alpaca.BaseURL, DataBaseURL: cfg.Alpaca.DataBaseURL,
		APIKey: cfg.Alpaca.APIKey, SecretKey: cfg.Alpaca.SecretKey,
	}); clientErr == nil {
		alpacaRepo = client
	}

	var quantAntHandler *quantanthttp.Handler
	var quantAntService *quantantapp.Service
	var quantAntPublisher *quantantredis.Publisher
	var quantAntWebSocket *quantantws.Hub
	if cfg.QuantAnt.Enabled {
		publisher, publisherErr := quantantredis.New(redisClient, cfg.QuantAnt.CommandStream)
		if publisherErr != nil {
			_ = questdb.Close()
			_ = postgres.Close()
			return nil, publisherErr
		}
		repository := quantantpostgres.New(postgres.SQL())
		marketReader := quantantquestdb.New(questdb.DB())
		quantAntPublisher = publisher
		quantAntService = quantantapp.New(repository, marketReader, publisher, quantantapp.Config{
			Enabled: cfg.QuantAnt.Enabled, LiveEnabled: cfg.QuantAnt.LiveEnabled,
			StrategyLiveEnabled: cfg.QuantAnt.StrategyLiveEnabled, LiveSessionTTL: cfg.QuantAnt.LiveSessionTTL,
		})
		quantAntHandler = quantanthttp.New(quantAntService)
		quantAntWebSocket, err = quantantws.New(redisClient)
		if err != nil {
			_ = questdb.Close()
			_ = postgres.Close()
			return nil, fmt.Errorf("initialize QuantAnt websocket: %w", err)
		}
	}
	checks := []health.DependencyCheck{
		{Name: "quant_postgres", Required: true, Check: func() error { return postgres.Ping(context.Background()) }},
		{Name: "quant_questdb", Required: true, Check: questdb.Ping},
	}
	if quantAntPublisher != nil {
		checks = append(checks, health.DependencyCheck{Name: "quantant_redis_streams", Required: true, Check: func() error {
			return quantAntPublisher.Check(context.Background())
		}})
	}

	return &Component{
		alerts:   operationshttp.NewAlertHandler(operationsapp.NewAlertUseCase(incidentRepo)),
		alpaca:   tradinghttp.NewAlpacaHandler(tradingapp.NewAlpacaUseCase(alpacaRepo)),
		metrics:  operationshttp.NewMetricHandler(operationsapp.NewMetricUseCase(metricRepo)),
		trades:   tradinghttp.NewTradeHandler(tradingapp.NewTradeUseCase(tradeRepo)),
		risk:     tradinghttp.NewRiskLimitsHandler(tradingapp.NewRiskLimitsUseCase(riskRepo, riskPublisher)),
		quantAnt: quantAntHandler, quantAntService: quantAntService, quantAntEnabled: cfg.QuantAnt.Enabled, quantAntWS: quantAntWebSocket,
		systemRepo: systemRepo,
		collector:  operationsworker.New(metricRepo, wsManager),
		websocket:  wsManager,
		checks:     checks,
		postgres:   postgres, questdb: questdb, redis: redisClient,
	}, nil
}

func (c *Component) RegisterRoutes(router *gin.Engine, apiKey string, aggregator *health.Aggregator, requireAuth gin.HandlerFunc) {
	router.GET("/ws/metrics", gin.WrapH(http.HandlerFunc(c.websocket.ServeWS)))
	api := router.Group("/api")
	api.Use(httpx.APIKeyAuth(apiKey))
	c.alerts.MapRoutes(api.Group("/system"))
	c.alpaca.MapRoutes(api.Group("/alpaca"))
	c.metrics.MapRoutes(api.Group("/metrics"))
	c.trades.MapRoutes(api.Group("/trades"))
	operationshttp.NewSystemHandler(operationsapp.NewSystemUseCase(c.systemRepo, aggregator, c.websocket)).MapRoutes(api.Group("/system"))
	c.risk.MapRoutes(api.Group("/system"))
	if c.quantAntEnabled && c.quantAnt != nil && requireAuth != nil {
		quantAntAPI := router.Group("/api/v1/quantant")
		quantAntAPI.Use(requireAuth, httpx.NewLimiter(600, time.Minute).Middleware())
		c.quantAnt.MapRoutes(quantAntAPI)
		if c.quantAntWS != nil {
			router.GET("/ws/v1/quantant", requireAuth, gin.WrapH(c.quantAntWS))
		}
	}
}

func (c *Component) ReadinessChecks() []health.DependencyCheck { return c.checks }
func (c *Component) Connections() health.Connections           { return c.websocket }

func (c *Component) Run(ctx context.Context) error {
	go c.websocket.Start()
	if c.quantAntService != nil {
		go func() { _ = c.quantAntService.RunOutbox(ctx) }()
	}
	err := c.collector.Run(ctx)
	c.websocket.Stop()
	_ = c.Close()
	return err
}

func (c *Component) Close() error {
	var closeErr error
	c.closeOnce.Do(func() {
		if c.quantAntWS != nil {
			c.quantAntWS.Close()
		}
		if c.redis != nil {
			closeErr = errors.Join(closeErr, c.redis.Close())
		}
		closeErr = errors.Join(closeErr, c.questdb.Close(), c.postgres.Close())
	})
	return closeErr
}
