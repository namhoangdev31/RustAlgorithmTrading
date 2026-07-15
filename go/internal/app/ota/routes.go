package ota

import (
	"github.com/gin-gonic/gin"

	identityhttp "trading/control-gateway/internal/modules/identity/adapter/http"
)

func (c *Component) RegisterRoutes(router *gin.Engine) {
	if c.distribution != nil {
		c.distribution.MapPublicRoutes(router)
		c.distribution.MapInternalRoutes(router)
	}
	if c.identity == nil || c.catalog == nil || c.identityService == nil {
		return
	}

	v1 := router.Group("/api/v1")
	v1.POST("/auth/login", c.identity.Login)
	v1.POST("/auth/firebase", c.identity.Firebase)
	v1.POST("/auth/refresh", c.identity.Refresh)
	v1.GET("/discovery/featured", c.catalog.Featured)
	v1.GET("/discovery/apps-we-love", c.catalog.AppsWeLove)
	v1.GET("/discovery/collections", c.catalog.Collections)
	v1.GET("/bundles", c.catalog.Bundles)
	v1.GET("/bundles/:id/stats", c.catalog.Stats)
	v1.GET("/bundles/:id/promotions", c.catalog.Promotions)
	v1.GET("/bundles/:id/reviews", c.catalog.Reviews)

	protected := v1.Group("")
	protected.Use(identityhttp.RequireAuth(c.identityService))
	protected.GET("/auth/me", c.identity.Me)
	protected.GET("/discovery/personalized", c.catalog.Personalized)
	protected.GET("/bundles/:id/download-url", c.catalog.DownloadURL)
	protected.POST("/bundles/:id/download/track", c.catalog.TrackDownload)
	protected.POST("/bundles/check-updates", c.catalog.CheckUpdates)
	protected.POST("/bundles/:id/reviews", c.catalog.CreateReview)
	protected.POST("/reviews/:id/reports", c.catalog.ReportReview)
	if c.commerce != nil {
		protected.GET("/payment/methods", c.commerce.PaymentMethods)
		protected.POST("/payment/methods", c.commerce.SavePaymentMethod)
		protected.POST("/payment/checkout", c.commerce.Checkout)
	}
	if c.engagement != nil {
		protected.GET("/notifications", c.engagement.Notifications)
		protected.POST("/notifications/:id/read", c.engagement.MarkRead)
	}
	admin := protected.Group("")
	admin.Use(identityhttp.RequireAdmin())
	admin.GET("/users", c.identity.Users)
}
