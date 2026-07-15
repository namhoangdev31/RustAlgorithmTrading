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
	Engine                *gin.Engine
	HealthAggregator      *health.Aggregator
	WSManager             *ws.Manager
	AlertHandler          *handlers.AlertHandler
	AlpacaHandler         *handlers.AlpacaHandler
	MetricHandler         *handlers.MetricHandler
	TradeHandler          *handlers.TradeHandler
	SystemHandler         *handlers.SystemHandler
	RiskLimitsHandler     *handlers.RiskLimitsHandler
	LepoShipHandler       *handlers.LepoShipHandler
	AuthStorefrontHandler *handlers.AuthStorefrontHandler
	StorefrontHandler     *handlers.StorefrontHandler
	StorefrontAuth        gin.HandlerFunc
	StorefrontAdmin       gin.HandlerFunc
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

	if cfg.AuthStorefrontHandler != nil && cfg.StorefrontHandler != nil && cfg.StorefrontAuth != nil {
		v1 := r.Group("/api/v1")
		v1.POST("/auth/login", cfg.AuthStorefrontHandler.Login)
		v1.POST("/auth/firebase", cfg.AuthStorefrontHandler.Firebase)
		v1.POST("/auth/refresh", cfg.AuthStorefrontHandler.Refresh)
		v1.GET("/discovery/featured", cfg.StorefrontHandler.Featured)
		v1.GET("/discovery/apps-we-love", cfg.StorefrontHandler.AppsWeLove)
		v1.GET("/discovery/collections", cfg.StorefrontHandler.Collections)
		v1.GET("/bundles", cfg.StorefrontHandler.Bundles)
		v1.GET("/bundles/:id/stats", cfg.StorefrontHandler.Stats)
		v1.GET("/bundles/:id/promotions", cfg.StorefrontHandler.Promotions)
		v1.GET("/bundles/:id/reviews", cfg.StorefrontHandler.Reviews)

		protected := v1.Group("")
		protected.Use(cfg.StorefrontAuth)
		protected.GET("/auth/me", cfg.AuthStorefrontHandler.Me)
		protected.GET("/discovery/personalized", cfg.StorefrontHandler.Personalized)
		protected.GET("/bundles/:id/download-url", cfg.StorefrontHandler.DownloadURL)
		protected.POST("/bundles/:id/download/track", cfg.StorefrontHandler.TrackDownload)
		protected.POST("/bundles/check-updates", cfg.StorefrontHandler.CheckUpdates)
		protected.POST("/bundles/:id/reviews", cfg.StorefrontHandler.CreateReview)
		protected.POST("/reviews/:id/reports", cfg.StorefrontHandler.ReportReview)
		protected.GET("/payment/methods", cfg.StorefrontHandler.PaymentMethods)
		protected.POST("/payment/methods", cfg.StorefrontHandler.SavePaymentMethod)
		protected.POST("/payment/checkout", cfg.StorefrontHandler.Checkout)
		protected.GET("/notifications", cfg.StorefrontHandler.Notifications)
		protected.POST("/notifications/:id/read", cfg.StorefrontHandler.MarkNotificationRead)

		if cfg.StorefrontAdmin != nil {
			admin := protected.Group("")
			admin.Use(cfg.StorefrontAdmin)
			admin.GET("/users", cfg.AuthStorefrontHandler.Users)
		}
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
