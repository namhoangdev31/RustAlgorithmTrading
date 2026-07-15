package httpadapter

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"trading/control-gateway/internal/modules/quantant/application"
	domain "trading/control-gateway/internal/modules/quantant/contract"
	"trading/control-gateway/internal/platform/httpx"
)

type Handler struct{ service *application.Service }

func New(service *application.Service) *Handler { return &Handler{service: service} }

func (h *Handler) MapRoutes(group *gin.RouterGroup) {
	group.GET("/bootstrap", h.bootstrap)
	group.GET("/instruments", h.instruments)
	group.GET("/instruments/:id", h.instrument)
	group.GET("/candles", h.candles)
	group.GET("/account", h.portfolio)
	group.GET("/portfolio", h.portfolio)
	group.GET("/positions", h.positions)
	group.GET("/orders", h.orders)
	group.POST("/orders", h.submitOrder)
	group.POST("/orders/:id/cancel", h.cancelOrder)
	group.POST("/positions/:symbol/close", h.closePosition)
	group.GET("/strategy-templates", h.strategyTemplates)
	group.GET("/strategies", h.records("strategies"))
	group.GET("/backtests", h.records("backtests"))
	group.GET("/deployments", h.records("deployments"))
	group.GET("/alerts", h.records("alerts"))
	group.GET("/audit-events", h.records("audit-events"))
	group.GET("/activity", h.records("audit-events"))
	group.GET("/fills", h.unsupported("execution.fills.read_model"))
	group.GET("/news", h.unsupported("intelligence.news"))
	group.GET("/sentiment", h.unsupported("intelligence.sentiment"))
	group.GET("/calendar", h.unsupported("intelligence.calendar"))
	group.GET("/risk-policy", h.unsupported("risk.policy.read_model"))
	group.GET("/risk-events", h.unsupported("risk.events.read_model"))
	group.GET("/circuit-breaker", h.unsupported("risk.circuit_breaker"))
	group.GET("/health/components", h.unsupported("system.component_health"))
	group.GET("/devices", h.unsupported("security.app_attest"))
	group.POST("/devices", h.unsupported("security.app_attest"))
	group.POST("/live-sessions/challenge", h.unsupported("security.app_attest"))
	group.POST("/live-sessions", h.unsupported("security.app_attest"))
}

func (h *Handler) bootstrap(c *gin.Context) {
	principal, ok := httpx.Principal(c)
	if !ok {
		writeError(c, application.ErrForbidden, "operator identity missing")
		return
	}
	value, err := h.service.Bootstrap(c.Request.Context(), principal.UserID)
	write(c, value, err)
}

func (h *Handler) instruments(c *gin.Context) {
	value, err := h.service.Instruments(c.Request.Context(), c.Query("q"), queryLimit(c), c.Query("cursor"))
	write(c, value, err)
}

func (h *Handler) instrument(c *gin.Context) {
	value, err := h.service.Instrument(c.Request.Context(), c.Param("id"))
	write(c, value, err)
}

func (h *Handler) candles(c *gin.Context) {
	now := time.Now().UTC()
	from, err := queryTime(c, "from", now.Add(-24*time.Hour))
	if err != nil {
		writeError(c, application.ErrInvalid, "invalid from timestamp")
		return
	}
	to, err := queryTime(c, "to", now)
	if err != nil || !from.Before(to) {
		writeError(c, application.ErrInvalid, "invalid to timestamp")
		return
	}
	value, err := h.service.Candles(c.Request.Context(), c.Query("instrument_id"), c.DefaultQuery("interval", "1m"), from, to, queryLimit(c))
	write(c, value, err)
}

func (h *Handler) portfolio(c *gin.Context) {
	value, err := h.service.Portfolio(c.Request.Context(), c.Query("account_id"), domain.TradingMode(c.DefaultQuery("mode", "paper")))
	write(c, value, err)
}

func (h *Handler) positions(c *gin.Context) {
	value, err := h.service.Positions(c.Request.Context(), c.Query("account_id"))
	write(c, value, err)
}

func (h *Handler) orders(c *gin.Context) {
	value, err := h.service.Orders(c.Request.Context(), c.Query("account_id"), queryLimit(c), c.Query("cursor"))
	write(c, value, err)
}

func (h *Handler) records(kind string) gin.HandlerFunc {
	return func(c *gin.Context) {
		value, err := h.service.Records(c.Request.Context(), kind, c.Query("account_id"), queryLimit(c), c.Query("cursor"))
		write(c, value, err)
	}
}

func (h *Handler) submitOrder(c *gin.Context) {
	var request domain.CreateOrder
	if c.ShouldBindJSON(&request) != nil {
		writeError(c, application.ErrInvalid, "invalid order payload")
		return
	}
	principal, ok := httpx.Principal(c)
	if !ok {
		writeError(c, application.ErrForbidden, "operator identity missing")
		return
	}
	order, err := h.service.SubmitOrder(
		c.Request.Context(), principal.UserID, c.GetHeader("Idempotency-Key"),
		c.GetHeader("X-QuantAnt-Live-Session"), correlationID(c), request,
	)
	if err != nil {
		writeError(c, err, err.Error())
		return
	}
	c.JSON(http.StatusAccepted, order)
}

func (h *Handler) cancelOrder(c *gin.Context) {
	orderID := c.Param("id")
	h.safetyCommand(c, "cancel_order", domain.SafetyCommand{AccountID: c.Query("account_id"), OrderID: &orderID})
}

func (h *Handler) closePosition(c *gin.Context) {
	var request domain.SafetyCommand
	if c.Request.ContentLength > 0 && c.ShouldBindJSON(&request) != nil {
		writeError(c, application.ErrInvalid, "invalid close payload")
		return
	}
	symbol := c.Param("symbol")
	request.Symbol = &symbol
	if request.AccountID == "" {
		request.AccountID = c.Query("account_id")
	}
	h.safetyCommand(c, "close_position", request)
}

func (h *Handler) safetyCommand(c *gin.Context, kind string, request domain.SafetyCommand) {
	principal, ok := httpx.Principal(c)
	if !ok {
		writeError(c, application.ErrForbidden, "operator identity missing")
		return
	}
	err := h.service.SafetyCommand(c.Request.Context(), principal.UserID, c.GetHeader("Idempotency-Key"), correlationID(c), kind, request)
	if err != nil {
		writeError(c, err, err.Error())
		return
	}
	c.Status(http.StatusAccepted)
}

func (h *Handler) strategyTemplates(c *gin.Context) {
	integer := func(value, minimum, maximum int) gin.H {
		return gin.H{"type": "integer", "default": value, "minimum": minimum, "maximum": maximum}
	}
	number := func(value, minimum, maximum float64) gin.H {
		return gin.H{"type": "number", "default": value, "minimum": minimum, "maximum": maximum}
	}
	templates := []gin.H{
		{"key": "momentum", "schema_version": 1, "display_name": gin.H{"en": "Momentum", "vi": "Động lượng"}, "parameters_schema": gin.H{"type": "object", "additionalProperties": false, "properties": gin.H{"rsi_period": integer(14, 2, 100), "position_size": number(.15, .001, 1), "stop_loss_pct": number(.02, .001, .25), "take_profit_pct": number(.03, .001, 1)}}},
		{"key": "mean_reversion", "schema_version": 1, "display_name": gin.H{"en": "Mean Reversion", "vi": "Hồi quy trung bình"}, "parameters_schema": gin.H{"type": "object", "additionalProperties": false, "properties": gin.H{"bb_period": integer(20, 2, 300), "bb_std": number(2, .25, 6), "position_size": number(.15, .001, 1), "stop_loss_pct": number(.02, .001, .25)}}},
		{"key": "trend_following", "schema_version": 1, "display_name": gin.H{"en": "Trend Following", "vi": "Theo xu hướng"}, "parameters_schema": gin.H{"type": "object", "additionalProperties": false, "properties": gin.H{"ema_fast": integer(9, 2, 100), "ema_slow": integer(50, 5, 400), "adx_threshold": number(25, 1, 100), "position_size": number(.2, .001, 1)}}},
	}
	c.JSON(http.StatusOK, domain.Snapshot{State: "loaded", AsOf: time.Now().UTC(), Data: templates})
}

func (h *Handler) unsupported(capability string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"state": "unsupported_capability", "as_of": time.Now().UTC(), "data": nil,
			"required_capability": capability,
		})
	}
}

func write(c *gin.Context, value domain.Snapshot, err error) {
	if err != nil {
		writeError(c, err, err.Error())
		return
	}
	c.JSON(http.StatusOK, value)
}

func writeError(c *gin.Context, err error, message string) {
	status, code, retryable := http.StatusInternalServerError, "INTERNAL", false
	switch {
	case errors.Is(err, application.ErrInvalid):
		status, code = http.StatusBadRequest, "INVALID_ARGUMENT"
	case errors.Is(err, application.ErrForbidden):
		status, code = http.StatusForbidden, "FORBIDDEN"
	case errors.Is(err, application.ErrNotFound):
		status, code = http.StatusNotFound, "NOT_FOUND"
	case errors.Is(err, application.ErrConflict):
		status, code = http.StatusConflict, "IDEMPOTENCY_CONFLICT"
	case errors.Is(err, application.ErrUnavailable):
		status, code, retryable = http.StatusServiceUnavailable, "DEPENDENCY_UNAVAILABLE", true
	case errors.Is(err, application.ErrUnsupported):
		status, code = http.StatusUnprocessableEntity, "UNSUPPORTED_CAPABILITY"
	}
	c.AbortWithStatusJSON(status, gin.H{
		"code": code, "message": message, "correlation_id": correlationID(c),
		"retryable": retryable, "field_errors": []any{}, "required_capability": capabilityFrom(message),
	})
}

func capabilityFrom(message string) string {
	if index := strings.Index(message, ": "); index >= 0 {
		return message[index+2:]
	}
	return ""
}

func queryLimit(c *gin.Context) int {
	value, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	return value
}

func queryTime(c *gin.Context, key string, fallback time.Time) (time.Time, error) {
	if c.Query(key) == "" {
		return fallback, nil
	}
	return time.Parse(time.RFC3339, c.Query(key))
}

func correlationID(c *gin.Context) string {
	if value, ok := c.Get("CorrelationID"); ok {
		return value.(string)
	}
	return c.Writer.Header().Get("X-Correlation-ID")
}
