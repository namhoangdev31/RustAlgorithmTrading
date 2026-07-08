package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"trading/control-gateway/internal/domain/entities"
	"trading/control-gateway/internal/domain/usecases"
)

// MetricHandler handles HTTP requests relating to metrics and performance summaries.
type MetricHandler struct {
	useCase usecases.MetricUseCase
}

// NewMetricHandler creates a new instance of MetricHandler.
func NewMetricHandler(useCase usecases.MetricUseCase) *MetricHandler {
	return &MetricHandler{useCase: useCase}
}

// MapRoutes registers metrics endpoints.
func (h *MetricHandler) MapRoutes(group *gin.RouterGroup) {
	group.GET("/current", h.GetCurrent)
	group.POST("/history", h.GetHistory)
	group.GET("/symbols", h.GetSymbols)
	group.GET("/summary", h.GetSummary)
}

func (h *MetricHandler) GetCurrent(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		userID = c.GetHeader("X-User-ID")
	}
	if userID == "" {
		userID = "admin"
	}

	payload, err := h.useCase.GetCurrentMetrics(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payload)
}

func (h *MetricHandler) GetHistory(c *gin.Context) {
	var req entities.MetricsHistoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid request body"})
		return
	}

	userID := c.Query("user_id")
	if userID == "" {
		userID = c.GetHeader("X-User-ID")
	}
	if userID == "" {
		userID = "admin"
	}

	payload, err := h.useCase.GetMetricsHistory(userID, req.TimeRange, req.StartTime, req.EndTime, req.Interval, req.MetricTypes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payload)
}

func (h *MetricHandler) GetSymbols(c *gin.Context) {
	symbols, err := h.useCase.GetSymbols()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"symbols": symbols,
		"count":   len(symbols),
	})
}

func (h *MetricHandler) GetSummary(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		userID = c.GetHeader("X-User-ID")
	}
	if userID == "" {
		userID = "admin"
	}

	summary, err := h.useCase.GetSummary(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}
