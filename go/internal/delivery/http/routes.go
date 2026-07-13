package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "trading/control-gateway/docs"
	"trading/control-gateway/internal/delivery/http/handlers"
	"trading/control-gateway/internal/health"
	"trading/control-gateway/internal/middleware"
	"trading/control-gateway/internal/ws"
)

// RouterConfig contains configurations and handlers for routing initialization.
type RouterConfig struct {
	Engine            *gin.Engine
	HealthAggregator  *health.Aggregator
	WSManager         *ws.Manager
	AlertHandler      *handlers.AlertHandler
	AlpacaHandler     *handlers.AlpacaHandler
	MetricHandler     *handlers.MetricHandler
	TradeHandler      *handlers.TradeHandler
	SystemHandler     *handlers.SystemHandler
	RiskLimitsHandler *handlers.RiskLimitsHandler
	LepoShipHandler   *handlers.LepoShipHandler
}

// MapRoutes configures all public, metrics, websocket, docs and API endpoints on the Gin engine.
func MapRoutes(cfg RouterConfig) {
	r := cfg.Engine

	// Root / public endpoints
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service":   "Trading Observability API",
			"version":   "1.0.0",
			"docs":      "/docs",
			"websocket": "/ws/metrics",
			"endpoints": gin.H{
				"metrics": "/api/metrics",
				"trades":  "/api/trades",
				"system":  "/api/system",
			},
		})
	})

	r.GET("/health", gin.WrapH(http.HandlerFunc(cfg.HealthAggregator.HealthCheckHandler)))
	r.GET("/health/ready", gin.WrapH(http.HandlerFunc(cfg.HealthAggregator.ReadinessCheckHandler)))
	r.GET("/health/live", gin.WrapH(http.HandlerFunc(cfg.HealthAggregator.LivenessCheckHandler)))
	r.GET("/ws/metrics", gin.WrapH(http.HandlerFunc(cfg.WSManager.ServeWS)))

	r.GET("/docs", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/docs/index.html")
	})
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	if cfg.LepoShipHandler != nil {
		cfg.LepoShipHandler.MapPublicRoutes(r)
		cfg.LepoShipHandler.MapInternalRoutes(r)
	}

	// Grouping api routes
	api := r.Group("/api")
	api.Use(middleware.APIKeyAuth)
	{
		// 1. Alerts & incidents routes (registers to /api/system/incidents)
		cfg.AlertHandler.MapRoutes(api.Group("/system"))

		// 2. Alpaca routes
		cfg.AlpacaHandler.MapRoutes(api.Group("/alpaca"))

		// 3. Metrics routes
		cfg.MetricHandler.MapRoutes(api.Group("/metrics"))

		// 4. Trades routes
		cfg.TradeHandler.MapRoutes(api.Group("/trades"))

		// 5. System metrics/performance/integrity routes
		cfg.SystemHandler.MapRoutes(api.Group("/system"))

		// 6. Risk limits configuration routes (/api/system/risk-limits)
		cfg.RiskLimitsHandler.MapRoutes(api.Group("/system"))
	}
}
