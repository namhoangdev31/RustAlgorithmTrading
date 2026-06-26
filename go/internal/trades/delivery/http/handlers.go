package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"trading/observability-api/internal/storage"
)

type TradesHandlers struct {
	store *storage.Store
}

func NewTradesHandlers(store *storage.Store) *TradesHandlers {
	return &TradesHandlers{store: store}
}

func (h *TradesHandlers) MapRoutes(group *gin.RouterGroup) {
	group.GET("", h.GetTrades)
	group.GET("/:trade_id", h.GetTradeByID)
	group.GET("/stats/summary", h.GetStatsSummary)
	group.GET("/execution/quality", h.GetExecutionQuality)
}

func (h *TradesHandlers) GetTrades(c *gin.Context) {
	limit := parseIntWithDefault(c.Query("limit"), 100)
	offset := parseIntWithDefault(c.Query("offset"), 0)
	symbol := c.Query("symbol")
	side := c.Query("side")

	tList := []map[string]interface{}{}
	if h.store != nil && h.store.Postgres() != nil {
		if t, err := h.store.Postgres().QueryTrades(limit, offset, symbol, side); err == nil {
			tList = t
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"trades": tList,
		"total":  len(tList),
		"limit":  limit,
		"offset": offset,
	})
}

func (h *TradesHandlers) GetTradeByID(c *gin.Context) {
	tradeID := c.Param("trade_id")
	var trade map[string]interface{}
	var ok bool
	var err error

	if h.store != nil && h.store.Postgres() != nil {
		trade, ok, err = h.store.Postgres().QueryTradeByID(tradeID)
	}

	if err != nil || !ok {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Trade not found"})
		return
	}
	c.JSON(http.StatusOK, trade)
}

func (h *TradesHandlers) GetStatsSummary(c *gin.Context) {
	timeRange := c.Query("time_range")
	if timeRange == "" {
		timeRange = "24h"
	}
	symbol := c.Query("symbol")
	payload := gin.H{}
	if h.store != nil && h.store.Postgres() != nil {
		if s, err := h.store.Postgres().QueryTradeStatsSummary(symbol, timeRange); err == nil {
			payload = s
		}
	}
	c.JSON(http.StatusOK, payload)
}

func (h *TradesHandlers) GetExecutionQuality(c *gin.Context) {
	payload := gin.H{}
	if h.store != nil && h.store.Postgres() != nil {
		if s, err := h.store.Postgres().QueryExecutionQuality(); err == nil {
			payload = s
		}
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
