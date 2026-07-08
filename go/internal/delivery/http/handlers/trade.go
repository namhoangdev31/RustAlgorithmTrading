package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"trading/control-gateway/internal/domain/usecases"
)

// TradeHandler handles HTTP requests relating to trades and executions.
type TradeHandler struct {
	useCase usecases.TradeUseCase
}

// NewTradeHandler creates a new instance of TradeHandler.
func NewTradeHandler(useCase usecases.TradeUseCase) *TradeHandler {
	return &TradeHandler{useCase: useCase}
}

// MapRoutes registers trade endpoints.
func (h *TradeHandler) MapRoutes(group *gin.RouterGroup) {
	group.GET("", h.GetTrades)
	group.GET("/:trade_id", h.GetTradeByID)
	group.GET("/stats/summary", h.GetStatsSummary)
	group.GET("/execution/quality", h.GetExecutionQuality)
}

func (h *TradeHandler) GetTrades(c *gin.Context) {
	limit := parseIntWithDefault(c.Query("limit"), 100)
	offset := parseIntWithDefault(c.Query("offset"), 0)
	symbol := c.Query("symbol")
	side := c.Query("side")

	tList, err := h.useCase.GetTrades(limit, offset, symbol, side)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"trades": tList,
		"total":  len(tList),
		"limit":  limit,
		"offset": offset,
	})
}

func (h *TradeHandler) GetTradeByID(c *gin.Context) {
	tradeID := c.Param("trade_id")
	trade, ok, err := h.useCase.GetTradeByID(tradeID)
	if err != nil || !ok {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Trade not found"})
		return
	}
	c.JSON(http.StatusOK, trade)
}

func (h *TradeHandler) GetStatsSummary(c *gin.Context) {
	timeRange := c.Query("time_range")
	if timeRange == "" {
		timeRange = "24h"
	}
	symbol := c.Query("symbol")
	payload, err := h.useCase.GetStatsSummary(symbol, timeRange)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payload)
}

func (h *TradeHandler) GetExecutionQuality(c *gin.Context) {
	payload, err := h.useCase.GetExecutionQuality()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payload)
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
