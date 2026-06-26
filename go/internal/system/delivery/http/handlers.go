package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"trading/observability-api/internal/health"
	"trading/observability-api/internal/integrity"
	"trading/observability-api/internal/models"
	"trading/observability-api/internal/storage"
	"trading/observability-api/internal/ws"
)

type SystemHandlers struct {
	healthAggregator *health.Aggregator
	store            *storage.Store
	wsManager        *ws.Manager
}

func NewSystemHandlers(healthAggregator *health.Aggregator, store *storage.Store, wsManager *ws.Manager) *SystemHandlers {
	return &SystemHandlers{
		healthAggregator: healthAggregator,
		store:            store,
		wsManager:        wsManager,
	}
}

func (h *SystemHandlers) MapRoutes(group *gin.RouterGroup) {
	group.GET("/health", h.GetHealth)
	group.GET("/performance", h.GetPerformance)
	group.GET("/components", h.GetComponents)
	group.GET("/logs/recent", h.GetLogs)
	group.GET("/stats", h.GetStats)
	group.POST("/integrity/validate", h.ValidateIntegrity)
}

func (h *SystemHandlers) GetHealth(c *gin.Context) {
	h.healthAggregator.SystemHealthHandler(c.Writer, c.Request)
}

func (h *SystemHandlers) GetPerformance(c *gin.Context) {
	var history []map[string]interface{}
	if h.store != nil && h.store.DuckDB() != nil {
		if hData, err := h.store.DuckDB().QueryPerformanceHistory(50); err == nil {
			history = hData
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"history": history,
		"count":   len(history),
	})
}

func (h *SystemHandlers) GetComponents(c *gin.Context) {
	c.JSON(http.StatusOK, h.healthAggregator.ComponentsSnapshot())
}

func (h *SystemHandlers) GetLogs(c *gin.Context) {
	level := c.Query("level")
	if level == "" {
		level = "INFO"
	}
	limit := parseIntWithDefault(c.Query("limit"), 100)
	var logs []map[string]interface{}
	if h.store != nil {
		if h.store.Postgres() != nil {
			if rows, err := h.store.Postgres().QueryLogs(level, limit); err == nil {
				logs = rows
			}
		} else if h.store.DuckDB() != nil {
			if rows, err := h.store.DuckDB().QueryLogs(level, limit); err == nil {
				logs = rows
			}
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"logs":  logs,
		"count": len(logs),
		"level": level,
	})
}

func (h *SystemHandlers) GetStats(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"api": gin.H{
			"running":               true,
			"websocket_connections": h.wsManager.ConnectionCount(),
			"total_messages_sent":   h.wsManager.Stats()["total_messages_sent"],
		},
		"collectors": gin.H{},
	})
}

func (h *SystemHandlers) ValidateIntegrity(c *gin.Context) {
	var metrics models.Metrics
	if err := c.ShouldBindJSON(&metrics); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid metrics payload"})
		return
	}
	report := integrity.ValidateRunIntegrity(metrics, integrity.DefaultThresholds())
	c.JSON(http.StatusOK, gin.H{
		"is_valid": report.IsValid,
		"reasons":  report.Reasons,
		"metrics":  report.Metrics,
	})
}

func parseIntWithDefault(raw string, def int) int {
	if raw == "" {
		return def
	}
	v, err := strconv.Atoi(raw)
	if err != nil {
		return def
	}
	return v
}
