package controlplane

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "trading/control-gateway/docs"
	cataloghttp "trading/control-gateway/internal/modules/catalog/adapter/http"
	commercehttp "trading/control-gateway/internal/modules/commerce/adapter/http"
	distributionhttp "trading/control-gateway/internal/modules/distribution/adapter/http"
	engagementhttp "trading/control-gateway/internal/modules/engagement/adapter/http"
	identityhttp "trading/control-gateway/internal/modules/identity/adapter/http"
	operationshealth "trading/control-gateway/internal/modules/operations/adapter/health"
	operationshttp "trading/control-gateway/internal/modules/operations/adapter/http"
	operationsws "trading/control-gateway/internal/modules/operations/adapter/ws"
	tradinghttp "trading/control-gateway/internal/modules/trading/adapter/http"
	"trading/control-gateway/internal/platform/httpx"
	"trading/control-gateway/internal/platform/observability"
)

type RouterDependencies struct {
	ServiceName     string
	APIKey          string
	Health          *operationshealth.Aggregator
	WebSocket       *operationsws.Manager
	Alerts          *operationshttp.AlertHandler
	Alpaca          *tradinghttp.AlpacaHandler
	Metrics         *operationshttp.MetricHandler
	Trades          *tradinghttp.TradeHandler
	System          *operationshttp.SystemHandler
	Risk            *tradinghttp.RiskLimitsHandler
	Distribution    *distributionhttp.Handler
	Identity        *identityhttp.Handler
	Catalog         *cataloghttp.Handler
	Commerce        *commercehttp.Handler
	Engagement      *engagementhttp.Handler
	IdentityService identityhttp.AccessTokenVerifier
}

func NewRouter(input RouterDependencies) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery(), httpx.CorrelationID(), httpx.Logger(), httpx.SetupCors(), observability.HTTPMiddleware(input.ServiceName))
	r.Use(httpx.NewLimiter(10000, time.Minute).Middleware())
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"service": "Trading Observability API", "version": "1.0.0", "docs": "/docs", "websocket": "/ws/metrics", "endpoints": gin.H{"metrics": "/api/metrics", "trades": "/api/trades", "system": "/api/system"}})
	})
	if input.Health != nil {
		r.GET("/health", gin.WrapH(http.HandlerFunc(input.Health.HealthCheckHandler)))
		r.GET("/health/ready", gin.WrapH(http.HandlerFunc(input.Health.ReadinessCheckHandler)))
		r.GET("/health/live", gin.WrapH(http.HandlerFunc(input.Health.LivenessCheckHandler)))
	}
	if input.WebSocket != nil {
		r.GET("/ws/metrics", gin.WrapH(http.HandlerFunc(input.WebSocket.ServeWS)))
	}
	r.GET("/docs", func(c *gin.Context) { c.Redirect(http.StatusMovedPermanently, "/docs/index.html") })
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.GET("/metrics", httpx.APIKeyAuth(input.APIKey), gin.WrapH(promhttp.Handler()))

	if input.Distribution != nil {
		input.Distribution.MapPublicRoutes(r)
		input.Distribution.MapInternalRoutes(r)
	}
	if input.Identity != nil && input.Catalog != nil && input.IdentityService != nil {
		v1 := r.Group("/api/v1")
		v1.POST("/auth/login", input.Identity.Login)
		v1.POST("/auth/firebase", input.Identity.Firebase)
		v1.POST("/auth/refresh", input.Identity.Refresh)
		v1.GET("/discovery/featured", input.Catalog.Featured)
		v1.GET("/discovery/apps-we-love", input.Catalog.AppsWeLove)
		v1.GET("/discovery/collections", input.Catalog.Collections)
		v1.GET("/bundles", input.Catalog.Bundles)
		v1.GET("/bundles/:id/stats", input.Catalog.Stats)
		v1.GET("/bundles/:id/promotions", input.Catalog.Promotions)
		v1.GET("/bundles/:id/reviews", input.Catalog.Reviews)
		protected := v1.Group("")
		protected.Use(identityhttp.RequireAuth(input.IdentityService))
		protected.GET("/auth/me", input.Identity.Me)
		protected.GET("/discovery/personalized", input.Catalog.Personalized)
		protected.GET("/bundles/:id/download-url", input.Catalog.DownloadURL)
		protected.POST("/bundles/:id/download/track", input.Catalog.TrackDownload)
		protected.POST("/bundles/check-updates", input.Catalog.CheckUpdates)
		protected.POST("/bundles/:id/reviews", input.Catalog.CreateReview)
		protected.POST("/reviews/:id/reports", input.Catalog.ReportReview)
		if input.Commerce != nil {
			protected.GET("/payment/methods", input.Commerce.PaymentMethods)
			protected.POST("/payment/methods", input.Commerce.SavePaymentMethod)
			protected.POST("/payment/checkout", input.Commerce.Checkout)
		}
		if input.Engagement != nil {
			protected.GET("/notifications", input.Engagement.Notifications)
			protected.POST("/notifications/:id/read", input.Engagement.MarkRead)
		}
		admin := protected.Group("")
		admin.Use(identityhttp.RequireAdmin())
		admin.GET("/users", input.Identity.Users)
	}

	api := r.Group("/api")
	api.Use(httpx.APIKeyAuth(input.APIKey))
	if input.Alerts != nil {
		input.Alerts.MapRoutes(api.Group("/system"))
	}
	if input.Alpaca != nil {
		input.Alpaca.MapRoutes(api.Group("/alpaca"))
	}
	if input.Metrics != nil {
		input.Metrics.MapRoutes(api.Group("/metrics"))
	}
	if input.Trades != nil {
		input.Trades.MapRoutes(api.Group("/trades"))
	}
	if input.System != nil {
		input.System.MapRoutes(api.Group("/system"))
	}
	if input.Risk != nil {
		input.Risk.MapRoutes(api.Group("/system"))
	}
	return r
}
