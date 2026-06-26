package http

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"trading/observability-api/internal/models"
	"trading/observability-api/internal/storage"
)

type MetricsHandlers struct {
	store *storage.Store
}

func NewMetricsHandlers(store *storage.Store) *MetricsHandlers {
	return &MetricsHandlers{store: store}
}

func (h *MetricsHandlers) MapRoutes(group *gin.RouterGroup) {
	group.GET("/current", h.GetCurrent)
	group.POST("/history", h.GetHistory)
	group.GET("/symbols", h.GetSymbols)
	group.GET("/summary", h.GetSummary)
}

func (h *MetricsHandlers) GetCurrent(c *gin.Context) {
	now := time.Now().UTC().Format(time.RFC3339)
	payload := gin.H{
		"timestamp":   now,
		"market_data": gin.H{},
		"strategy":    gin.H{},
		"execution":   gin.H{},
		"system":      gin.H{},
	}
	if h.store != nil && h.store.DuckDB() != nil {
		summary, err := h.store.DuckDB().QueryPerformanceSummary()
		if err == nil {
			payload["strategy"] = summary
		}
	}
	c.JSON(http.StatusOK, payload)
}

func (h *MetricsHandlers) GetHistory(c *gin.Context) {
	var req models.MetricsHistoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid request body"})
		return
	}
	start := req.StartTime
	end := req.EndTime

	now := time.Now().UTC()
	if end == "" {
		end = now.Format("2006-01-02 15:04:05")
	}
	if start == "" {
		switch req.TimeRange {
		case "1h":
			start = now.Add(-1 * time.Hour).Format("2006-01-02 15:04:05")
		case "7d":
			start = now.Add(-7 * 24 * time.Hour).Format("2006-01-02 15:04:05")
		case "30d":
			start = now.Add(-30 * 24 * time.Hour).Format("2006-01-02 15:04:05")
		default:
			start = now.Add(-24 * time.Hour).Format("2006-01-02 15:04:05")
		}
	}

	var data []map[string]interface{}
	if h.store != nil && h.store.DuckDB() != nil {
		hData, err := h.store.DuckDB().QueryMetricsHistory(start, end, req.MetricTypes)
		if err == nil {
			data = hData
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"start_time": start,
		"end_time":   end,
		"interval":   req.Interval,
		"data":       data,
		"count":      len(data),
	})
}

func (h *MetricsHandlers) GetSymbols(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"symbols": []string{},
		"count":   0,
	})
}

func (h *MetricsHandlers) GetSummary(c *gin.Context) {
	summary := gin.H{}
	if h.store != nil && h.store.DuckDB() != nil {
		s, err := h.store.DuckDB().QueryPerformanceSummary()
		if err == nil {
			summary = s
		}
	}
	c.JSON(http.StatusOK, summary)
}
