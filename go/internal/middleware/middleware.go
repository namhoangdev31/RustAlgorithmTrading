package middleware

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type ctxKey string

const correlationIDKey ctxKey = "CorrelationID"

func SetupCors() gin.HandlerFunc {
	return cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type", "X-API-Key", "X-Correlation-ID"},
		ExposeHeaders:    []string{"Link", "X-Correlation-ID"},
		AllowCredentials: true,
		MaxAge:           300 * time.Second,
	})
}

func CorrelationID() gin.HandlerFunc {
	return func(c *gin.Context) {
		cid := c.GetHeader("X-Correlation-ID")
		if cid == "" {
			cid = fmt.Sprintf("req-%d-%d", time.Now().UnixNano(), time.Now().Nanosecond())
		}
		ctx := context.WithValue(c.Request.Context(), correlationIDKey, cid)
		c.Request = c.Request.WithContext(ctx)

		c.Set(string(correlationIDKey), cid)
		c.Header("X-Correlation-ID", cid)
		c.Next()
	}
}

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		cid, _ := c.Get(string(correlationIDKey))
		slog.Info("request_handled",
			"method", c.Request.Method,
			"path", path,
			"query", query,
			"status", c.Writer.Status(),
			"bytes", c.Writer.Size(),
			"duration_ms", float64(time.Since(start).Milliseconds()),
			"correlation_id", cid,
		)
	}
}

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

