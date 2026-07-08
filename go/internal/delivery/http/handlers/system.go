package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"trading/control-gateway/internal/domain/entities"
	"trading/control-gateway/internal/domain/usecases"
)

// SystemHandler handles HTTP requests relating to health and system status.
type SystemHandler struct {
	useCase usecases.SystemUseCase
}

// NewSystemHandler creates a new instance of SystemHandler.
func NewSystemHandler(useCase usecases.SystemUseCase) *SystemHandler {
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
	history, err := h.useCase.GetPerformance()
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
	level := c.Query("level")
	if level == "" {
		level = "INFO"
	}
	limit := parseIntWithDefault(c.Query("limit"), 100)
	logs, err := h.useCase.GetLogs(level, limit)
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
	var metrics entities.Metrics
	if err := c.ShouldBindJSON(&metrics); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid metrics payload"})
		return
	}
	report := h.useCase.ValidateIntegrity(metrics)
	c.JSON(http.StatusOK, gin.H{
		"is_valid": report.IsValid,
		"reasons":  report.Reasons,
		"metrics":  report.Metrics,
	})
}
