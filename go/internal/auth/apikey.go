package auth

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// APIKeyAuth enforces internal API key policy.
// If OBSERVABILITY_API_KEY is empty, auth is permissive for local/dev parity.
func APIKeyAuth(c *gin.Context) {
	expected := os.Getenv("OBSERVABILITY_API_KEY")
	if expected == "" {
		c.Next()
		return
	}
	if c.GetHeader("X-API-Key") != expected {
		c.JSON(http.StatusUnauthorized, gin.H{"detail": "Unauthorized"})
		c.Abort()
		return
	}
	c.Next()
}
