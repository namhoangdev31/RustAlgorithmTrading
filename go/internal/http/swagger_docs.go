package http

import (
	"trading/observability-api/internal/models"
)

var _ = models.Metrics{}

// AlpacaMarketOrderRequest represents the request payload for a market order.
type AlpacaMarketOrderRequest struct {
	Symbol      string  `json:"symbol" example:"AAPL"`
	Qty         float64 `json:"qty" example:"10.0"`
	Side        string  `json:"side" example:"buy"`
	TimeInForce string  `json:"time_in_force" example:"day"`
}

// AlpacaLimitOrderRequest represents the request payload for a limit order.
type AlpacaLimitOrderRequest struct {
	Symbol      string  `json:"symbol" example:"AAPL"`
	Qty         float64 `json:"qty" example:"10.0"`
	Side        string  `json:"side" example:"buy"`
	LimitPrice  float64 `json:"limit_price" example:"150.25"`
	TimeInForce string  `json:"time_in_force" example:"day"`
}

// TriggerIncidentRequest represents the request payload to trigger a manual incident.
type TriggerIncidentRequest struct {
	Severity       string                 `json:"severity" example:"critical"`
	Component      string                 `json:"component" example:"execution"`
	ReasonCode     string                 `json:"reason_code" example:"high_slippage"`
	CorrelationID  string                 `json:"correlation_id" example:"err-98274"`
	Evidence       map[string]interface{} `json:"evidence"`
	Owner          string                 `json:"owner" example:"oncall_engineer"`
}

// @Summary Get Root API Info
// @Description Retrieve basic service information and sub-endpoints
// @Tags root
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router / [get]
func _rootDocs() {}

// @Summary Health Check
// @Description Retrieve full health status of the application and its dependencies
// @Tags health
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /health [get]
func _healthCheckDocs() {}

// @Summary Readiness Check
// @Description Verify if the application is ready to accept traffic
// @Tags health
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /health/ready [get]
func _readinessCheckDocs() {}

// @Summary Liveness Check
// @Description Verify if the application is still alive and running
// @Tags health
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /health/live [get]
func _livenessCheckDocs() {}

// @Summary WebSocket Live Metrics
// @Description Establish a WebSocket connection to stream real-time trading metrics
// @Tags websocket
// @Router /ws/metrics [get]
func _wsMetricsDocs() {}

// @Summary Get Current Metrics
// @Description Retrieve the latest consolidated trading and system performance metrics
// @Tags metrics
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/metrics/current [get]
func _currentMetricsDocs() {}

// @Summary Get Metrics History
// @Description Query historical metrics matching filters (time range, symbols, metric types)
// @Tags metrics
// @Accept json
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Param request body models.MetricsHistoryRequest true "Query filters"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/metrics/history [post]
func _metricsHistoryDocs() {}

// @Summary Get Metrics Symbols
// @Description List all symbols with stored metrics
// @Tags metrics
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/metrics/symbols [get]
func _metricsSymbolsDocs() {}

// @Summary Get Performance Summary
// @Description Query high-level portfolio and performance statistics summary
// @Tags metrics
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/metrics/summary [get]
func _metricsSummaryDocs() {}

// @Summary List Trades
// @Description Query trades history with support for pagination and filtering
// @Tags trades
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Param limit query int false "Pagination limit" default(100)
// @Param offset query int false "Pagination offset" default(0)
// @Param symbol query string false "Filter by symbol"
// @Param side query string false "Filter by side (buy/sell)"
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/trades [get]
func _tradesListDocs() {}

// @Summary Get Trade Details
// @Description Retrieve comprehensive execution details for a specific trade
// @Tags trades
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Param trade_id path string true "Trade UUID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/trades/{trade_id} [get]
func _tradeDetailsDocs() {}

// @Summary Get Trades Stats Summary
// @Description Retrieve trading stats aggregated over history (win rate, profit factor, total trades)
// @Tags trades
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Success 200 {object} map[string]interface{}
// @Router /api/trades/stats/summary [get]
func _tradesSummaryDocs() {}

// @Summary Get Execution Quality Stats
// @Description Retrieve metrics detailing trade execution quality (slippage, fill latency)
// @Tags trades
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Success 200 {object} map[string]interface{}
// @Router /api/trades/execution/quality [get]
func _executionQualityDocs() {}

// @Summary Get System Health
// @Description Retrieve detailed system health details of components
// @Tags system
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Success 200 {object} map[string]interface{}
// @Router /api/system/health [get]
func _systemHealthDocs() {}

// @Summary Get System Performance
// @Description Retrieve system performance metrics (CPU, Memory, uptime)
// @Tags system
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Success 200 {object} map[string]interface{}
// @Router /api/system/performance [get]
func _systemPerformanceDocs() {}

// @Summary Get System Components
// @Description Check detailed status of subsystem components
// @Tags system
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Success 200 {object} map[string]interface{}
// @Router /api/system/components [get]
func _systemComponentsDocs() {}

// @Summary Get Recent Logs
// @Description Retrieve latest logged lines for diagnostic purposes
// @Tags system
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Param limit query int false "Maximum logs to return" default(100)
// @Param level query string false "Filter by severity level (info/warn/error)"
// @Success 200 {object} map[string]interface{}
// @Router /api/system/logs/recent [get]
func _recentLogsDocs() {}

// @Summary Acknowledge Alert
// @Description Acknowledge a specific alert notification by ID
// @Tags system
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Param alert_id path string true "Alert identifier"
// @Success 200 {object} map[string]interface{}
// @Router /api/system/alerts/acknowledge/{alert_id} [post]
func _acknowledgeAlertDocs() {}

// @Summary Get Core System Stats
// @Description Retrieve key operational stats of the Go Control Plane
// @Tags system
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Success 200 {object} map[string]interface{}
// @Router /api/system/stats [get]
func _coreStatsDocs() {}

// @Summary Get Incidents
// @Description Retrieve list of all tracked system incidents
// @Tags system
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Success 200 {object} map[string]interface{}
// @Router /api/system/incidents [get]
func _activeIncidentsDocs() {}

// @Summary Trigger Incident
// @Description Explicitly record/trigger a new system incident manually or programmatically
// @Tags system
// @Accept json
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Param request body TriggerIncidentRequest true "Incident information"
// @Success 201 {object} map[string]interface{}
// @Router /api/system/incidents [post]
func _triggerIncidentDocs() {}

// @Summary Acknowledge Incident
// @Description Mark an incident as acknowledged and assign an owner
// @Tags system
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Param incident_id path string true "Incident UUID"
// @Param owner query string false "Name of the owner resolving the incident"
// @Success 200 {object} map[string]interface{}
// @Router /api/system/incidents/{incident_id}/acknowledge [post]
func _acknowledgeIncidentDocs() {}

// @Summary Resolve Incident
// @Description Mark an active incident as resolved
// @Tags system
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Param incident_id path string true "Incident UUID"
// @Success 200 {object} map[string]interface{}
// @Router /api/system/incidents/{incident_id}/resolve [post]
func _resolveIncidentDocs() {}

// @Summary Validate Run Integrity
// @Description Check database and performance integrity of metrics against defined thresholds
// @Tags system
// @Accept json
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Param request body models.Metrics true "Metrics to validate"
// @Success 200 {object} map[string]interface{}
// @Router /api/system/integrity/validate [post]
func _integrityValidateDocs() {}

// @Summary Get Alpaca Account Info
// @Description Retrieve broker account info (balance, buying power, equity)
// @Tags alpaca
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Success 200 {object} map[string]interface{}
// @Router /api/alpaca/account [get]
func _alpacaAccountDocs() {}

// @Summary Get Alpaca Positions
// @Description List all open investment positions
// @Tags alpaca
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Success 200 {object} map[string]interface{}
// @Router /api/alpaca/positions [get]
func _alpacaPositionsDocs() {}

// @Summary Place Alpaca Market Order
// @Description Submit a new market order to buy/sell assets immediately
// @Tags alpaca
// @Accept json
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Param request body AlpacaMarketOrderRequest true "Market order parameters"
// @Success 200 {object} map[string]interface{}
// @Router /api/alpaca/orders/market [post]
func _alpacaMarketOrderDocs() {}

// @Summary Place Alpaca Limit Order
// @Description Submit a new limit order to buy/sell assets at a specified price
// @Tags alpaca
// @Accept json
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Param request body AlpacaLimitOrderRequest true "Limit order parameters"
// @Success 200 {object} map[string]interface{}
// @Router /api/alpaca/orders/limit [post]
func _alpacaLimitOrderDocs() {}

// @Summary List Alpaca Orders
// @Description List recent orders with current fulfillment status
// @Tags alpaca
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Success 200 {object} map[string]interface{}
// @Router /api/alpaca/orders [get]
func _alpacaListOrdersDocs() {}

// @Summary Cancel All Alpaca Orders
// @Description Cancel all pending/active orders
// @Tags alpaca
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Success 200 {object} map[string]interface{}
// @Router /api/alpaca/orders [delete]
func _alpacaCancelAllOrdersDocs() {}

// @Summary Cancel Alpaca Order
// @Description Cancel a specific pending order by ID
// @Tags alpaca
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Param order_id path string true "Order UUID"
// @Success 200 {object} map[string]interface{}
// @Router /api/alpaca/orders/{order_id} [delete]
func _alpacaCancelOrderDocs() {}

// @Summary Close All Positions
// @Description Liquidate all open positions (market order sells for all holds)
// @Tags alpaca
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Success 200 {object} map[string]interface{}
// @Router /api/alpaca/positions [delete]
func _alpacaClosePositionsDocs() {}

// @Summary Get Market Bars
// @Description Query historical market candlestick bars from Alpaca
// @Tags alpaca
// @Produce json
// @Param X-API-Key header string true "API Key for authorization"
// @Param symbol query string true "Stock symbol"
// @Param limit query int false "Number of bars to return" default(100)
// @Param time_frame query string false "Bar size (1Min/5Min/1Hour/1Day)" default("1Min")
// @Success 200 {object} map[string]interface{}
// @Router /api/alpaca/bars [get]
func _alpacaBarsDocs() {}
