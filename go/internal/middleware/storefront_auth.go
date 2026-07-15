package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/domain/usecases"
)

const storefrontPrincipalKey = "storefront_principal"

type AccessTokenVerifier interface {
	VerifyAccessToken(raw string) (usecases.Principal, error)
}

func RequireStorefrontAuth(verifier AccessTokenVerifier) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := strings.TrimSpace(c.GetHeader("Authorization"))
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		token := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
		principal, err := verifier.VerifyAccessToken(token)
		if err != nil {
			if errors.Is(err, repositories.ErrUnavailable) {
				c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "authentication unavailable"})
			} else {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			}
			return
		}
		c.Set(storefrontPrincipalKey, principal)
		c.Next()
	}
}

func RequireStorefrontAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		principal, ok := StorefrontPrincipal(c)
		if !ok || principal.UserType != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}

func StorefrontPrincipal(c *gin.Context) (usecases.Principal, bool) {
	value, ok := c.Get(storefrontPrincipalKey)
	if !ok {
		return usecases.Principal{}, false
	}
	principal, ok := value.(usecases.Principal)
	return principal, ok
}
