package httpadapter

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"trading/control-gateway/internal/modules/operations/application"
	domain "trading/control-gateway/internal/modules/operations/domain"
)

func parseIntWithDefault(raw string, fallback int) int {
	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return value
}

// SystemHandler handles HTTP requests relating to health and system status.
type SystemHandler struct {
	useCase application.SystemUseCase
}

// NewSystemHandler creates a new instance of SystemHandler.
func NewSystemHandler(useCase application.SystemUseCase) *SystemHandler {
	return &SystemHandler{useCase: useCase}
}

// MapRoutes registers system health endpoints.
func (h *SystemHandler) MapRoutes(group *gin.RouterGroup) {
	group.GET("/health", h.GetHealth)
	group.GET("/performance", h.GetPerformance)
	group.GET("/components", h.GetComponents)
	group.GET("/logs/recent", h.GetLogs)
	group.GET("/stats", h.GetStats)
	group.POST("/integrity/validate", h.ValidateIntegrity)
}

func (h *SystemHandler) GetHealth(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "UP"})
}

func (h *SystemHandler) GetPerformance(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		userID = c.GetHeader("X-User-ID")
	}
	if userID == "" {
		userID = "admin"
	}

	history, err := h.useCase.GetPerformance(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"history": history,
		"count":   len(history),
	})
}

func (h *SystemHandler) GetComponents(c *gin.Context) {
	c.JSON(http.StatusOK, h.useCase.GetComponents())
}

func (h *SystemHandler) GetLogs(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		userID = c.GetHeader("X-User-ID")
	}
	if userID == "" {
		userID = "admin"
	}

	level := c.Query("level")
	if level == "" {
		level = "INFO"
	}
	limit := parseIntWithDefault(c.Query("limit"), 100)
	logs, err := h.useCase.GetLogs(userID, level, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"logs":  logs,
		"count": len(logs),
		"level": level,
	})
}

func (h *SystemHandler) GetStats(c *gin.Context) {
	c.JSON(http.StatusOK, h.useCase.GetStats())
}

func (h *SystemHandler) ValidateIntegrity(c *gin.Context) {
	var payload metricsPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid metrics payload"})
		return
	}
	report := h.useCase.ValidateIntegrity(domain.Metrics(payload))
	c.JSON(http.StatusOK, gin.H{
		"is_valid": report.IsValid,
		"reasons":  report.Reasons,
		"metrics":  report.Metrics,
	})
}
