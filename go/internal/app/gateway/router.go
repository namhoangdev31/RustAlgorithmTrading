package gateway

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "trading/control-gateway/docs"
	"trading/control-gateway/internal/app/ota"
	"trading/control-gateway/internal/app/quant"
	identityhttp "trading/control-gateway/internal/modules/identity/adapter/http"
	"trading/control-gateway/internal/platform/health"
	"trading/control-gateway/internal/platform/httpx"
	"trading/control-gateway/internal/platform/observability"
)

type RouterDependencies struct {
	ServiceName string
	APIKey      string
	Health      *health.Aggregator
	Quant       *quant.Component
	OTA         *ota.Component
	Identity    identityhttp.AccessTokenVerifier
}

func NewRouter(input RouterDependencies) *gin.Engine {
	router := gin.New()
	router.Use(gin.Recovery(), httpx.CorrelationID(), httpx.Logger(), httpx.SetupCors(), observability.HTTPMiddleware(input.ServiceName))
	router.Use(httpx.NewLimiter(10000, time.Minute).Middleware())
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "Trading and OTA Gateway", "version": "1.0.0", "docs": "/docs",
			"components": []string{"quant", "ota"},
		})
	})
	if input.Health != nil {
		router.GET("/health", gin.WrapH(http.HandlerFunc(input.Health.HealthCheckHandler)))
		router.GET("/health/ready", gin.WrapH(http.HandlerFunc(input.Health.ReadinessCheckHandler)))
		router.GET("/health/live", gin.WrapH(http.HandlerFunc(input.Health.LivenessCheckHandler)))
	}
	router.GET("/docs", func(c *gin.Context) { c.Redirect(http.StatusMovedPermanently, "/docs/index.html") })
	router.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	router.GET("/metrics", httpx.APIKeyAuth(input.APIKey), gin.WrapH(promhttp.Handler()))
	if input.Quant != nil {
		input.Quant.RegisterRoutes(router, input.APIKey, input.Health, identityhttp.RequireAuth(input.Identity))
	}
	if input.OTA != nil {
		input.OTA.RegisterRoutes(router)
	}
	return router
}
