package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "trading/observability-api/docs"
	alertHttp "trading/observability-api/internal/alerts/delivery/http"
	alpacaHttp "trading/observability-api/internal/alpaca/delivery/http"
	"trading/observability-api/internal/middleware"
	metricHttp "trading/observability-api/internal/metrics/delivery/http"
	sysHttp "trading/observability-api/internal/system/delivery/http"
	tradeHttp "trading/observability-api/internal/trades/delivery/http"
)

func (s *Server) mapRoutes(r *gin.Engine) {
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

	r.GET("/health", gin.WrapH(http.HandlerFunc(s.healthAggregator.HealthCheckHandler)))
	r.GET("/health/ready", gin.WrapH(http.HandlerFunc(s.healthAggregator.ReadinessCheckHandler)))
	r.GET("/health/live", gin.WrapH(http.HandlerFunc(s.healthAggregator.LivenessCheckHandler)))
	r.GET("/ws/metrics", gin.WrapH(http.HandlerFunc(s.wsManager.ServeWS)))

	r.GET("/docs", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/docs/index.html")
	})
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Grouping api routes
	api := r.Group("/api")
	api.Use(middleware.APIKeyAuth)
	{
		// 1. Alerts & incidents routes
		alertsHandlers := alertHttp.NewAlertsHandlers(s.incidentManager)
		alertsHandlers.MapRoutes(api.Group("/system"))

		// 2. Alpaca routes
		alpacaHandlers := alpacaHttp.NewAlpacaHandlers(s.alpacaClient)
		alpacaHandlers.MapRoutes(api.Group("/alpaca"))

		// 3. Metrics routes
		metricsHandlers := metricHttp.NewMetricsHandlers(s.store)
		metricsHandlers.MapRoutes(api.Group("/metrics"))

		// 4. Trades routes
		tradesHandlers := tradeHttp.NewTradesHandlers(s.store)
		tradesHandlers.MapRoutes(api.Group("/trades"))

		// 5. System metrics/performance/integrity routes
		systemHandlers := sysHttp.NewSystemHandlers(s.healthAggregator, s.store, s.wsManager)
		systemHandlers.MapRoutes(api.Group("/system"))
	}
}
