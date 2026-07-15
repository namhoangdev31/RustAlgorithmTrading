package httpadapter

import (
	"net/http"
	"trading/control-gateway/internal/modules/trading/application"

	"github.com/gin-gonic/gin"
)

// AlpacaHandler handles HTTP requests relating to Alpaca accounts and execution.
type AlpacaHandler struct {
	useCase application.AlpacaUseCase
}

// NewAlpacaHandler creates a new instance of AlpacaHandler.
func NewAlpacaHandler(useCase application.AlpacaUseCase) *AlpacaHandler {
	return &AlpacaHandler{useCase: useCase}
}

// MapRoutes registers Alpaca endpoints.
func (h *AlpacaHandler) MapRoutes(group *gin.RouterGroup) {
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

func (h *AlpacaHandler) checkUseCase(c *gin.Context) bool {
	if h.useCase == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "alpaca service unavailable"})
		return false
	}
	return true
}

func (h *AlpacaHandler) GetAccount(c *gin.Context) {
	if !h.checkUseCase(c) {
		return
	}
	acc, err := h.useCase.GetAccount(c.Request.Context())
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

func (h *AlpacaHandler) GetPositions(c *gin.Context) {
	if !h.checkUseCase(c) {
		return
	}
	positions, err := h.useCase.GetPositions(c.Request.Context())
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

func (h *AlpacaHandler) PlaceMarketOrder(c *gin.Context) {
	if !h.checkUseCase(c) {
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
	order, err := h.useCase.PlaceMarketOrder(c.Request.Context(), req.Symbol, req.Qty, req.Side, req.TimeInForce)
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

func (h *AlpacaHandler) PlaceLimitOrder(c *gin.Context) {
	if !h.checkUseCase(c) {
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
	order, err := h.useCase.PlaceLimitOrder(c.Request.Context(), req.Symbol, req.Qty, req.Side, req.LimitPrice, req.TimeInForce)
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

func (h *AlpacaHandler) GetOrders(c *gin.Context) {
	if !h.checkUseCase(c) {
		return
	}
	status := c.Query("status")
	orders, err := h.useCase.GetOrders(c.Request.Context(), status)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"orders": orders})
}

func (h *AlpacaHandler) CancelAllOrders(c *gin.Context) {
	if !h.checkUseCase(c) {
		return
	}
	if err := h.useCase.CancelAllOrders(c.Request.Context()); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *AlpacaHandler) CancelOrder(c *gin.Context) {
	if !h.checkUseCase(c) {
		return
	}
	orderID := c.Param("order_id")
	if err := h.useCase.CancelOrder(c.Request.Context(), orderID); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *AlpacaHandler) CloseAllPositions(c *gin.Context) {
	if !h.checkUseCase(c) {
		return
	}
	positions, err := h.useCase.CloseAllPositions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"orders": positions})
}

func (h *AlpacaHandler) GetBars(c *gin.Context) {
	if !h.checkUseCase(c) {
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
	payload, err := h.useCase.GetBars(c.Request.Context(), symbol, start, end, timeframe)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payload)
}
