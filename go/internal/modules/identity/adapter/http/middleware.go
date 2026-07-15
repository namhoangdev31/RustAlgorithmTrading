package httpadapter

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	identity "trading/control-gateway/internal/modules/identity/application"
	"trading/control-gateway/internal/platform/httpx"
	"trading/control-gateway/internal/shared/apperror"
)

type AccessTokenVerifier interface {
	VerifyAccessToken(string) (identity.Principal, error)
}

func RequireAuth(verifier AccessTokenVerifier) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := strings.TrimSpace(c.GetHeader("Authorization"))
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		principal, err := verifier.VerifyAccessToken(strings.TrimSpace(strings.TrimPrefix(header, "Bearer ")))
		if err != nil {
			if apperror.IsCode(err, apperror.CodeUnavailable) {
				c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "authentication unavailable"})
			} else {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			}
			return
		}
		httpx.SetPrincipal(c, principal)
		c.Next()
	}
}

func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		principal, ok := httpx.Principal(c)
		if !ok || principal.UserType != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}

func Principal(c *gin.Context) (identity.Principal, bool) {
	return httpx.Principal(c)
}
