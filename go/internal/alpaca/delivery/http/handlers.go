package http

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"trading/observability-api/internal/alpaca"
)

type AlpacaHandlers struct {
	client *alpaca.Client
}

func NewAlpacaHandlers(client *alpaca.Client) *AlpacaHandlers {
	return &AlpacaHandlers{client: client}
}

func (h *AlpacaHandlers) MapRoutes(group *gin.RouterGroup) {
	group.GET("/account", h.GetAccount)
	group.GET("/positions", h.GetPositions)
	group.POST("/orders/market", h.PlaceMarketOrder)
	group.POST("/orders/limit", h.PlaceLimitOrder)
	group.GET("/orders", h.GetOrders)
	group.DELETE("/orders", h.CancelAllOrders)
	group.DELETE("/orders/:order_id", h.CancelOrder)
	group.DELETE("/positions", h.CloseAllPositions)
	group.GET("/bars", h.GetBars)
}

func (h *AlpacaHandlers) checkClient(c *gin.Context) bool {
	if h.client == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "alpaca client unavailable"})
		return false
	}
	return true
}

func (h *AlpacaHandlers) GetAccount(c *gin.Context) {
	if !h.checkClient(c) {
		return
	}
	acc, err := h.client.GetAccount(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"cash":            acc.Cash,
		"portfolio_value": acc.PortfolioValue,
		"buying_power":    acc.BuyingPower,
		"equity":          acc.Equity,
		"status":          acc.Status,
	})
}

func (h *AlpacaHandlers) GetPositions(c *gin.Context) {
	if !h.checkClient(c) {
		return
	}
	positions, err := h.client.GetPositions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
		return
	}
	resp := make([]map[string]interface{}, 0, len(positions))
	for _, p := range positions {
		resp = append(resp, map[string]interface{}{
			"symbol":          p.Symbol,
			"qty":             p.Qty,
			"avg_entry_price": p.AvgEntry,
			"current_price":   p.CurrentPrice,
			"market_value":    p.MarketValue,
			"unrealized_pl":   p.UnrealizedPL,
		})
	}
	c.JSON(http.StatusOK, gin.H{"positions": resp})
}

func (h *AlpacaHandlers) PlaceMarketOrder(c *gin.Context) {
	if !h.checkClient(c) {
		return
	}
	var req struct {
		Symbol      string  `json:"symbol"`
		Qty         float64 `json:"qty"`
		Side        string  `json:"side"`
		TimeInForce string  `json:"time_in_force"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid request body"})
		return
	}
	order, err := h.client.PlaceMarketOrder(c.Request.Context(), req.Symbol, req.Qty, req.Side, req.TimeInForce)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":         order.ID,
		"status":     order.Status,
		"symbol":     order.Symbol,
		"created_at": order.CreatedAt,
	})
}

func (h *AlpacaHandlers) PlaceLimitOrder(c *gin.Context) {
	if !h.checkClient(c) {
		return
	}
	var req struct {
		Symbol      string  `json:"symbol"`
		Qty         float64 `json:"qty"`
		Side        string  `json:"side"`
		LimitPrice  float64 `json:"limit_price"`
		TimeInForce string  `json:"time_in_force"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid request body"})
		return
	}
	order, err := h.client.PlaceLimitOrder(c.Request.Context(), req.Symbol, req.Qty, req.Side, req.LimitPrice, req.TimeInForce)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":         order.ID,
		"status":     order.Status,
		"symbol":     order.Symbol,
		"created_at": order.CreatedAt,
	})
}

func (h *AlpacaHandlers) GetOrders(c *gin.Context) {
	if !h.checkClient(c) {
		return
	}
	status := c.Query("status")
	orders, err := h.client.GetOrders(c.Request.Context(), status)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"orders": orders})
}

func (h *AlpacaHandlers) CancelAllOrders(c *gin.Context) {
	if !h.checkClient(c) {
		return
	}
	if err := h.client.CancelAllOrders(c.Request.Context()); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *AlpacaHandlers) CancelOrder(c *gin.Context) {
	if !h.checkClient(c) {
		return
	}
	orderID := c.Param("order_id")
	if err := h.client.CancelOrder(c.Request.Context(), orderID); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *AlpacaHandlers) CloseAllPositions(c *gin.Context) {
	if !h.checkClient(c) {
		return
	}
	positions, err := h.client.CloseAllPositions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"orders": positions})
}

func (h *AlpacaHandlers) GetBars(c *gin.Context) {
	if !h.checkClient(c) {
		return
	}
	symbol := c.Query("symbol")
	start := c.Query("start")
	end := c.Query("end")
	timeframe := c.Query("timeframe")
	if symbol == "" || start == "" || end == "" {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "symbol/start/end are required"})
		return
	}
	payload, err := h.client.GetHistoricalBars(c.Request.Context(), symbol, start, end, timeframe)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payload)
}
