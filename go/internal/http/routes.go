package http

import (
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "trading/observability-api/docs"
	"trading/observability-api/internal/alerts"
	"trading/observability-api/internal/alpaca"
	"trading/observability-api/internal/auth"
	"trading/observability-api/internal/health"
	"trading/observability-api/internal/integrity"
	"trading/observability-api/internal/models"
	"trading/observability-api/internal/ratelimit"
	"trading/observability-api/internal/storage"
	"trading/observability-api/internal/ws"
)

func SetupRoutes(store *storage.Store, wsManager *ws.Manager, healthAggregator *health.Aggregator) *gin.Engine {
	r := gin.New()
	incidentManager := alerts.NewManager()
	var alpacaClient *alpaca.Client
	if c, err := alpaca.NewClient(alpaca.Config{
		BaseURL:   os.Getenv("ALPACA_BASE_URL"),
		APIKey:    os.Getenv("ALPACA_API_KEY"),
		SecretKey: os.Getenv("ALPACA_SECRET_KEY"),
	}); err == nil {
		alpacaClient = c
	}

	r.Use(gin.Recovery())
	r.Use(CorrelationID())
	r.Use(Logger())
	r.Use(SetupCors())

	limiter := ratelimit.NewLimiter(10000, time.Minute)
	r.Use(limiter.Middleware())

	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service":   "Trading Observability API",
			"version":   "1.0.0",
			"docs":      "/docs",
			"websocket": "/ws/metrics",
			"endpoints": gin.H{
				"metrics": "/api/metrics",
				"trades":  "/api/trades",
				"system":  "/api/system",
			},
		})
	})

	r.GET("/health", gin.WrapH(http.HandlerFunc(healthAggregator.HealthCheckHandler)))
	r.GET("/health/ready", gin.WrapH(http.HandlerFunc(healthAggregator.ReadinessCheckHandler)))
	r.GET("/health/live", gin.WrapH(http.HandlerFunc(healthAggregator.LivenessCheckHandler)))
	r.GET("/ws/metrics", gin.WrapH(http.HandlerFunc(wsManager.ServeWS)))

	r.GET("/docs", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/docs/index.html")
	})
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	api := r.Group("/api")
	api.Use(auth.APIKeyAuth)
	{
		metrics := api.Group("/metrics")
		{
			metrics.GET("/current", func(c *gin.Context) {
				now := time.Now().UTC().Format(time.RFC3339)
				payload := gin.H{
					"timestamp":   now,
					"market_data": gin.H{},
					"strategy":    gin.H{},
					"execution":   gin.H{},
					"system":      gin.H{},
				}
				if store != nil && store.DuckDB() != nil {
					summary, err := store.DuckDB().QueryPerformanceSummary()
					if err == nil {
						payload["strategy"] = summary
					}
				}
				c.JSON(http.StatusOK, payload)
			})

			metrics.POST("/history", func(c *gin.Context) {
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
				if store != nil && store.DuckDB() != nil {
					h, err := store.DuckDB().QueryMetricsHistory(start, end, req.MetricTypes)
					if err == nil {
						data = h
					}
				}
				c.JSON(http.StatusOK, gin.H{
					"start_time": start,
					"end_time":   end,
					"interval":   req.Interval,
					"data":       data,
					"count":      len(data),
				})
			})

			metrics.GET("/symbols", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"symbols": []string{},
					"count":   0,
				})
			})

			metrics.GET("/summary", func(c *gin.Context) {
				summary := gin.H{}
				if store != nil && store.DuckDB() != nil {
					s, err := store.DuckDB().QueryPerformanceSummary()
					if err == nil {
						summary = s
					}
				}
				c.JSON(http.StatusOK, summary)
			})
		}

		trades := api.Group("/trades")
		{
			trades.GET("", func(c *gin.Context) {
				limit := parseIntWithDefault(c.Query("limit"), 100)
				offset := parseIntWithDefault(c.Query("offset"), 0)
				symbol := c.Query("symbol")
				side := c.Query("side")

				tList := []map[string]interface{}{}
				if store != nil && store.Postgres() != nil {
					if t, err := store.Postgres().QueryTrades(limit, offset, symbol, side); err == nil {
						tList = t
					}
				}
				c.JSON(http.StatusOK, gin.H{
					"trades": tList,
					"total":  len(tList),
					"limit":  limit,
					"offset": offset,
				})
			})

			trades.GET("/:trade_id", func(c *gin.Context) {
				tradeID := c.Param("trade_id")
				var trade map[string]interface{}
				var ok bool
				var err error

				if store != nil && store.Postgres() != nil {
					trade, ok, err = store.Postgres().QueryTradeByID(tradeID)
				}

				if err != nil || !ok {
					c.JSON(http.StatusNotFound, gin.H{"detail": "Trade not found"})
					return
				}
				c.JSON(http.StatusOK, trade)
			})

			trades.GET("/stats/summary", func(c *gin.Context) {
				timeRange := c.Query("time_range")
				if timeRange == "" {
					timeRange = "24h"
				}
				symbol := c.Query("symbol")
				payload := gin.H{}
				if store != nil && store.Postgres() != nil {
					if s, err := store.Postgres().QueryTradeStatsSummary(symbol, timeRange); err == nil {
						payload = s
					}
				}
				c.JSON(http.StatusOK, payload)
			})

			trades.GET("/execution/quality", func(c *gin.Context) {
				payload := gin.H{}
				if store != nil && store.Postgres() != nil {
					if s, err := store.Postgres().QueryExecutionQuality(); err == nil {
						payload = s
					}
				}
				c.JSON(http.StatusOK, payload)
			})
		}

		system := api.Group("/system")
		{
			system.GET("/health", gin.WrapH(http.HandlerFunc(healthAggregator.SystemHealthHandler)))
			system.GET("/performance", func(c *gin.Context) {
				var history []map[string]interface{}
				if store != nil && store.DuckDB() != nil {
					if h, err := store.DuckDB().QueryPerformanceHistory(50); err == nil {
						history = h
					}
				}
				c.JSON(http.StatusOK, gin.H{
					"history": history,
					"count":   len(history),
				})
			})

			system.GET("/components", func(c *gin.Context) {
				c.JSON(http.StatusOK, healthAggregator.ComponentsSnapshot())
			})

			system.GET("/logs/recent", func(c *gin.Context) {
				level := c.Query("level")
				if level == "" {
					level = "INFO"
				}
				limit := parseIntWithDefault(c.Query("limit"), 100)
				var logs []map[string]interface{}
				if store != nil {
					if store.Postgres() != nil {
						if rows, err := store.Postgres().QueryLogs(level, limit); err == nil {
							logs = rows
						}
					} else if store.DuckDB() != nil {
						if rows, err := store.DuckDB().QueryLogs(level, limit); err == nil {
							logs = rows
						}
					}
				}
				c.JSON(http.StatusOK, gin.H{
					"logs":  logs,
					"count": len(logs),
					"level": level,
				})
			})

			system.POST("/alerts/acknowledge/:alert_id", func(c *gin.Context) {
				alertID := c.Param("alert_id")
				c.JSON(http.StatusOK, gin.H{
					"status":   "acknowledged",
					"alert_id": alertID,
				})
			})

			system.GET("/stats", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"api": gin.H{
						"running":               true,
						"websocket_connections": wsManager.ConnectionCount(),
						"total_messages_sent":   wsManager.Stats()["total_messages_sent"],
					},
					"collectors": gin.H{},
				})
			})

			system.GET("/incidents", func(c *gin.Context) {
				payload := gin.H{}
				for k, v := range incidentManager.List() {
					payload[k] = v
				}
				c.JSON(http.StatusOK, payload)
			})

			system.POST("/incidents", func(c *gin.Context) {
				var req map[string]interface{}
				if err := c.ShouldBindJSON(&req); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid request body"})
					return
				}
				inc := incidentManager.Create(req)
				c.JSON(http.StatusCreated, gin.H{
					"incident_id":    inc.ID,
					"severity":       inc.Severity,
					"component":      inc.Component,
					"reason_code":    inc.ReasonCode,
					"correlation_id": inc.CorrelationID,
					"status":         inc.Status,
					"owner":          inc.Owner,
					"evidence":       inc.Evidence,
					"created_at":     inc.CreatedAt,
					"updated_at":     inc.UpdatedAt,
				})
			})

			system.POST("/incidents/:incident_id/acknowledge", func(c *gin.Context) {
				id := c.Param("incident_id")
				owner := c.Query("owner")
				if owner == "" {
					owner = "ops"
				}
				inc, err := incidentManager.Acknowledge(id, owner)
				if err != nil {
					c.JSON(http.StatusNotFound, gin.H{"detail": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{
					"incident_id": inc.ID, "status": inc.Status, "owner": inc.Owner, "updated_at": inc.UpdatedAt,
				})
			})

			system.POST("/incidents/:incident_id/resolve", func(c *gin.Context) {
				id := c.Param("incident_id")
				evidence := c.Query("evidence")
				inc, err := incidentManager.Resolve(id, evidence)
				if err != nil {
					code := http.StatusBadRequest
					if err.Error() == "incident not found" {
						code = http.StatusNotFound
					}
					c.JSON(code, gin.H{"detail": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{
					"incident_id": inc.ID, "status": inc.Status, "evidence": inc.Evidence, "updated_at": inc.UpdatedAt,
				})
			})

			system.POST("/integrity/validate", func(c *gin.Context) {
				var metrics models.Metrics
				if err := c.ShouldBindJSON(&metrics); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid metrics payload"})
					return
				}
				report := integrity.ValidateRunIntegrity(metrics, integrity.DefaultThresholds())
				c.JSON(http.StatusOK, gin.H{
					"is_valid": report.IsValid,
					"reasons":  report.Reasons,
					"metrics":  report.Metrics,
				})
			})
		}

		alpacaRoute := api.Group("/alpaca")
		{
			alpacaRoute.GET("/account", func(c *gin.Context) {
				if alpacaClient == nil {
					c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "alpaca client unavailable"})
					return
				}
				acc, err := alpacaClient.GetAccount(c.Request.Context())
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
			})

			alpacaRoute.GET("/positions", func(c *gin.Context) {
				if alpacaClient == nil {
					c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "alpaca client unavailable"})
					return
				}
				positions, err := alpacaClient.GetPositions(c.Request.Context())
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
			})

			alpacaRoute.POST("/orders/market", func(c *gin.Context) {
				if alpacaClient == nil {
					c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "alpaca client unavailable"})
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
				order, err := alpacaClient.PlaceMarketOrder(c.Request.Context(), req.Symbol, req.Qty, req.Side, req.TimeInForce)
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
			})

			alpacaRoute.POST("/orders/limit", func(c *gin.Context) {
				if alpacaClient == nil {
					c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "alpaca client unavailable"})
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
				order, err := alpacaClient.PlaceLimitOrder(c.Request.Context(), req.Symbol, req.Qty, req.Side, req.LimitPrice, req.TimeInForce)
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
			})

			alpacaRoute.GET("/orders", func(c *gin.Context) {
				if alpacaClient == nil {
					c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "alpaca client unavailable"})
					return
				}
				status := c.Query("status")
				orders, err := alpacaClient.GetOrders(c.Request.Context(), status)
				if err != nil {
					c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{"orders": orders})
			})

			alpacaRoute.DELETE("/orders", func(c *gin.Context) {
				if alpacaClient == nil {
					c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "alpaca client unavailable"})
					return
				}
				if err := alpacaClient.CancelAllOrders(c.Request.Context()); err != nil {
					c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{"status": "ok"})
			})

			alpacaRoute.DELETE("/orders/:order_id", func(c *gin.Context) {
				if alpacaClient == nil {
					c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "alpaca client unavailable"})
					return
				}
				orderID := c.Param("order_id")
				if err := alpacaClient.CancelOrder(c.Request.Context(), orderID); err != nil {
					c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{"status": "ok"})
			})

			alpacaRoute.DELETE("/positions", func(c *gin.Context) {
				if alpacaClient == nil {
					c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "alpaca client unavailable"})
					return
				}
				positions, err := alpacaClient.CloseAllPositions(c.Request.Context())
				if err != nil {
					c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{"orders": positions})
			})

			alpacaRoute.GET("/bars", func(c *gin.Context) {
				if alpacaClient == nil {
					c.JSON(http.StatusServiceUnavailable, gin.H{"detail": "alpaca client unavailable"})
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
				payload, err := alpacaClient.GetHistoricalBars(c.Request.Context(), symbol, start, end, timeframe)
				if err != nil {
					c.JSON(http.StatusBadGateway, gin.H{"detail": err.Error()})
					return
				}
				c.JSON(http.StatusOK, payload)
			})
		}
	}

	return r
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
