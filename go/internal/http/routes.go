package http

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"trading/observability-api/internal/alerts"
	"trading/observability-api/internal/alpaca"
	"trading/observability-api/internal/auth"
	"trading/observability-api/internal/health"
	"trading/observability-api/internal/integrity"
	"trading/observability-api/internal/ratelimit"
	"trading/observability-api/internal/storage"
	"trading/observability-api/internal/ws"
)

type metricsHistoryRequest struct {
	TimeRange   string   `json:"time_range"`
	StartTime   string   `json:"start_time"`
	EndTime     string   `json:"end_time"`
	MetricTypes []string `json:"metric_types"`
	Symbols     []string `json:"symbols"`
	Interval    string   `json:"interval"`
}

func SetupRoutes(store *storage.Store, wsManager *ws.Manager, healthAggregator *health.Aggregator) *chi.Mux {
	r := chi.NewRouter()
	incidentManager := alerts.NewManager()
	var alpacaClient *alpaca.Client
	if c, err := alpaca.NewClient(alpaca.Config{
		BaseURL:   os.Getenv("ALPACA_BASE_URL"),
		APIKey:    os.Getenv("ALPACA_API_KEY"),
		SecretKey: os.Getenv("ALPACA_SECRET_KEY"),
	}); err == nil {
		alpacaClient = c
	}

	r.Use(middleware.RequestID)
	r.Use(CorrelationID)
	r.Use(middleware.RealIP)
	r.Use(Logger)
	r.Use(middleware.Recoverer)
	r.Use(SetupCors())

	limiter := ratelimit.NewLimiter(10000, time.Minute)
	r.Use(limiter.Middleware)

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"service":   "Trading Observability API",
			"version":   "1.0.0",
			"docs":      "/docs",
			"websocket": "/ws/metrics",
			"endpoints": map[string]string{
				"metrics": "/api/metrics",
				"trades":  "/api/trades",
				"system":  "/api/system",
			},
		})
	})

	r.Get("/health", healthAggregator.HealthCheckHandler)
	r.Get("/health/ready", healthAggregator.ReadinessCheckHandler)
	r.Get("/health/live", healthAggregator.LivenessCheckHandler)
	r.Get("/ws/metrics", wsManager.ServeWS)

	r.Route("/api", func(r chi.Router) {
		r.Use(auth.APIKeyAuth)

		r.Route("/metrics", func(r chi.Router) {
			r.Get("/current", func(w http.ResponseWriter, r *http.Request) {
				now := time.Now().UTC().Format(time.RFC3339)
				payload := map[string]interface{}{
					"timestamp":   now,
					"market_data": map[string]interface{}{},
					"strategy":    map[string]interface{}{},
					"execution":   map[string]interface{}{},
					"system":      map[string]interface{}{},
				}
				if store != nil && store.DuckDB() != nil {
					summary, err := store.DuckDB().QueryPerformanceSummary()
					if err == nil {
						payload["strategy"] = summary
					}
				}
				writeJSON(w, http.StatusOK, payload)
			})

			r.Post("/history", func(w http.ResponseWriter, r *http.Request) {
				req := metricsHistoryRequest{}
				_ = json.NewDecoder(r.Body).Decode(&req)
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
				writeJSON(w, http.StatusOK, map[string]interface{}{
					"start_time": start,
					"end_time":   end,
					"interval":   req.Interval,
					"data":       data,
					"count":      len(data),
				})
			})

			r.Get("/symbols", func(w http.ResponseWriter, r *http.Request) {
				writeJSON(w, http.StatusOK, map[string]interface{}{
					"symbols": []string{},
					"count":   0,
				})
			})

			r.Get("/summary", func(w http.ResponseWriter, r *http.Request) {
				summary := map[string]interface{}{}
				if store != nil && store.DuckDB() != nil {
					s, err := store.DuckDB().QueryPerformanceSummary()
					if err == nil {
						summary = s
					}
				}
				writeJSON(w, http.StatusOK, summary)
			})
		})

		r.Route("/trades", func(r chi.Router) {
			r.Get("/", func(w http.ResponseWriter, r *http.Request) {
				limit := parseIntWithDefault(r.URL.Query().Get("limit"), 100)
				offset := parseIntWithDefault(r.URL.Query().Get("offset"), 0)
				symbol := r.URL.Query().Get("symbol")
				side := r.URL.Query().Get("side")

				trades := []map[string]interface{}{}
				if store != nil && store.Postgres() != nil {
					if t, err := store.Postgres().QueryTrades(limit, offset, symbol, side); err == nil {
						trades = t
					}
				}
				writeJSON(w, http.StatusOK, map[string]interface{}{
					"trades": trades,
					"total":  len(trades),
					"limit":  limit,
					"offset": offset,
				})
			})

			r.Get("/{trade_id}", func(w http.ResponseWriter, r *http.Request) {
				tradeID := chi.URLParam(r, "trade_id")
				var trade map[string]interface{}
				var ok bool
				var err error

				if store != nil && store.Postgres() != nil {
					trade, ok, err = store.Postgres().QueryTradeByID(tradeID)
				}

				if err != nil || !ok {
					writeJSON(w, http.StatusNotFound, map[string]interface{}{"detail": "Trade not found"})
					return
				}
				writeJSON(w, http.StatusOK, trade)
			})

			r.Get("/stats/summary", func(w http.ResponseWriter, r *http.Request) {
				timeRange := r.URL.Query().Get("time_range")
				if timeRange == "" {
					timeRange = "24h"
				}
				symbol := r.URL.Query().Get("symbol")
				payload := map[string]interface{}{}
				if store != nil && store.Postgres() != nil {
					if s, err := store.Postgres().QueryTradeStatsSummary(symbol, timeRange); err == nil {
						payload = s
					}
				}
				writeJSON(w, http.StatusOK, payload)
			})

			r.Get("/execution/quality", func(w http.ResponseWriter, r *http.Request) {
				payload := map[string]interface{}{}
				if store != nil && store.Postgres() != nil {
					if s, err := store.Postgres().QueryExecutionQuality(); err == nil {
						payload = s
					}
				}
				writeJSON(w, http.StatusOK, payload)
			})
		})

		r.Route("/system", func(r chi.Router) {
			r.Get("/health", healthAggregator.SystemHealthHandler)
			r.Get("/performance", func(w http.ResponseWriter, r *http.Request) {
				var history []map[string]interface{}
				if store != nil && store.DuckDB() != nil {
					if h, err := store.DuckDB().QueryPerformanceHistory(50); err == nil {
						history = h
					}
				}
				writeJSON(w, http.StatusOK, map[string]interface{}{
					"history": history,
					"count":   len(history),
				})
			})
			r.Get("/components", func(w http.ResponseWriter, r *http.Request) {
				writeJSON(w, http.StatusOK, healthAggregator.ComponentsSnapshot())
			})
			r.Get("/logs/recent", func(w http.ResponseWriter, r *http.Request) {
				level := r.URL.Query().Get("level")
				if level == "" {
					level = "INFO"
				}
				limit := parseIntWithDefault(r.URL.Query().Get("limit"), 100)
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
				writeJSON(w, http.StatusOK, map[string]interface{}{
					"logs":  logs,
					"count": len(logs),
					"level": level,
				})
			})
			r.Post("/alerts/acknowledge/{alert_id}", func(w http.ResponseWriter, r *http.Request) {
				alertID := chi.URLParam(r, "alert_id")
				writeJSON(w, http.StatusOK, map[string]interface{}{
					"status":   "acknowledged",
					"alert_id": alertID,
				})
			})
			r.Get("/stats", func(w http.ResponseWriter, r *http.Request) {
				resp := map[string]interface{}{
					"api": map[string]interface{}{
						"running":               true,
						"websocket_connections": wsManager.ConnectionCount(),
						"total_messages_sent":   wsManager.Stats()["total_messages_sent"],
					},
					"collectors": map[string]interface{}{},
				}
				writeJSON(w, http.StatusOK, resp)
			})
			r.Get("/incidents", func(w http.ResponseWriter, r *http.Request) {
				payload := map[string]interface{}{}
				for k, v := range incidentManager.List() {
					payload[k] = v
				}
				writeJSON(w, http.StatusOK, payload)
			})
			r.Post("/incidents", func(w http.ResponseWriter, r *http.Request) {
				req := map[string]interface{}{}
				if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
					writeJSON(w, http.StatusBadRequest, map[string]interface{}{"detail": "invalid request body"})
					return
				}
				inc := incidentManager.Create(req)
				writeJSON(w, http.StatusCreated, map[string]interface{}{
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
			r.Post("/incidents/{incident_id}/acknowledge", func(w http.ResponseWriter, r *http.Request) {
				id := chi.URLParam(r, "incident_id")
				owner := r.URL.Query().Get("owner")
				if owner == "" {
					owner = "ops"
				}
				inc, err := incidentManager.Acknowledge(id, owner)
				if err != nil {
					writeJSON(w, http.StatusNotFound, map[string]interface{}{"detail": err.Error()})
					return
				}
				writeJSON(w, http.StatusOK, map[string]interface{}{
					"incident_id": inc.ID, "status": inc.Status, "owner": inc.Owner, "updated_at": inc.UpdatedAt,
				})
			})
			r.Post("/incidents/{incident_id}/resolve", func(w http.ResponseWriter, r *http.Request) {
				id := chi.URLParam(r, "incident_id")
				evidence := r.URL.Query().Get("evidence")
				inc, err := incidentManager.Resolve(id, evidence)
				if err != nil {
					code := http.StatusBadRequest
					if err.Error() == "incident not found" {
						code = http.StatusNotFound
					}
					writeJSON(w, code, map[string]interface{}{"detail": err.Error()})
					return
				}
				writeJSON(w, http.StatusOK, map[string]interface{}{
					"incident_id": inc.ID, "status": inc.Status, "evidence": inc.Evidence, "updated_at": inc.UpdatedAt,
				})
			})
			r.Post("/integrity/validate", func(w http.ResponseWriter, r *http.Request) {
				var metrics integrity.Metrics
				if err := json.NewDecoder(r.Body).Decode(&metrics); err != nil {
					writeJSON(w, http.StatusBadRequest, map[string]interface{}{"detail": "invalid metrics payload"})
					return
				}
				report := integrity.ValidateRunIntegrity(metrics, integrity.DefaultThresholds())
				writeJSON(w, http.StatusOK, map[string]interface{}{
					"is_valid": report.IsValid,
					"reasons":  report.Reasons,
					"metrics":  report.Metrics,
				})
			})
		})

		r.Route("/alpaca", func(r chi.Router) {
			r.Get("/account", func(w http.ResponseWriter, r *http.Request) {
				if alpacaClient == nil {
					writeJSON(w, http.StatusServiceUnavailable, map[string]interface{}{"detail": "alpaca client unavailable"})
					return
				}
				acc, err := alpacaClient.GetAccount(r.Context())
				if err != nil {
					writeJSON(w, http.StatusBadGateway, map[string]interface{}{"detail": err.Error()})
					return
				}
				writeJSON(w, http.StatusOK, map[string]interface{}{
					"cash":            acc.Cash,
					"portfolio_value": acc.PortfolioValue,
					"buying_power":    acc.BuyingPower,
					"equity":          acc.Equity,
					"status":          acc.Status,
				})
			})
			r.Get("/positions", func(w http.ResponseWriter, r *http.Request) {
				if alpacaClient == nil {
					writeJSON(w, http.StatusServiceUnavailable, map[string]interface{}{"detail": "alpaca client unavailable"})
					return
				}
				positions, err := alpacaClient.GetPositions(r.Context())
				if err != nil {
					writeJSON(w, http.StatusBadGateway, map[string]interface{}{"detail": err.Error()})
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
				writeJSON(w, http.StatusOK, map[string]interface{}{"positions": resp})
			})
			r.Post("/orders/market", func(w http.ResponseWriter, r *http.Request) {
				if alpacaClient == nil {
					writeJSON(w, http.StatusServiceUnavailable, map[string]interface{}{"detail": "alpaca client unavailable"})
					return
				}
				var req struct {
					Symbol      string  `json:"symbol"`
					Qty         float64 `json:"qty"`
					Side        string  `json:"side"`
					TimeInForce string  `json:"time_in_force"`
				}
				if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
					writeJSON(w, http.StatusBadRequest, map[string]interface{}{"detail": "invalid request body"})
					return
				}
				order, err := alpacaClient.PlaceMarketOrder(r.Context(), req.Symbol, req.Qty, req.Side, req.TimeInForce)
				if err != nil {
					writeJSON(w, http.StatusBadGateway, map[string]interface{}{"detail": err.Error()})
					return
				}
				writeJSON(w, http.StatusOK, map[string]interface{}{
					"id":         order.ID,
					"status":     order.Status,
					"symbol":     order.Symbol,
					"created_at": order.CreatedAt,
				})
			})
			r.Post("/orders/limit", func(w http.ResponseWriter, r *http.Request) {
				if alpacaClient == nil {
					writeJSON(w, http.StatusServiceUnavailable, map[string]interface{}{"detail": "alpaca client unavailable"})
					return
				}
				var req struct {
					Symbol      string  `json:"symbol"`
					Qty         float64 `json:"qty"`
					Side        string  `json:"side"`
					LimitPrice  float64 `json:"limit_price"`
					TimeInForce string  `json:"time_in_force"`
				}
				if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
					writeJSON(w, http.StatusBadRequest, map[string]interface{}{"detail": "invalid request body"})
					return
				}
				order, err := alpacaClient.PlaceLimitOrder(r.Context(), req.Symbol, req.Qty, req.Side, req.LimitPrice, req.TimeInForce)
				if err != nil {
					writeJSON(w, http.StatusBadGateway, map[string]interface{}{"detail": err.Error()})
					return
				}
				writeJSON(w, http.StatusOK, map[string]interface{}{
					"id":         order.ID,
					"status":     order.Status,
					"symbol":     order.Symbol,
					"created_at": order.CreatedAt,
				})
			})
			r.Get("/orders", func(w http.ResponseWriter, r *http.Request) {
				if alpacaClient == nil {
					writeJSON(w, http.StatusServiceUnavailable, map[string]interface{}{"detail": "alpaca client unavailable"})
					return
				}
				status := r.URL.Query().Get("status")
				orders, err := alpacaClient.GetOrders(r.Context(), status)
				if err != nil {
					writeJSON(w, http.StatusBadGateway, map[string]interface{}{"detail": err.Error()})
					return
				}
				writeJSON(w, http.StatusOK, map[string]interface{}{"orders": orders})
			})
			r.Delete("/orders", func(w http.ResponseWriter, r *http.Request) {
				if alpacaClient == nil {
					writeJSON(w, http.StatusServiceUnavailable, map[string]interface{}{"detail": "alpaca client unavailable"})
					return
				}
				if err := alpacaClient.CancelAllOrders(r.Context()); err != nil {
					writeJSON(w, http.StatusBadGateway, map[string]interface{}{"detail": err.Error()})
					return
				}
				writeJSON(w, http.StatusOK, map[string]interface{}{"status": "ok"})
			})
			r.Delete("/orders/{order_id}", func(w http.ResponseWriter, r *http.Request) {
				if alpacaClient == nil {
					writeJSON(w, http.StatusServiceUnavailable, map[string]interface{}{"detail": "alpaca client unavailable"})
					return
				}
				orderID := chi.URLParam(r, "order_id")
				if err := alpacaClient.CancelOrder(r.Context(), orderID); err != nil {
					writeJSON(w, http.StatusBadGateway, map[string]interface{}{"detail": err.Error()})
					return
				}
				writeJSON(w, http.StatusOK, map[string]interface{}{"status": "ok"})
			})
			r.Delete("/positions", func(w http.ResponseWriter, r *http.Request) {
				if alpacaClient == nil {
					writeJSON(w, http.StatusServiceUnavailable, map[string]interface{}{"detail": "alpaca client unavailable"})
					return
				}
				positions, err := alpacaClient.CloseAllPositions(r.Context())
				if err != nil {
					writeJSON(w, http.StatusBadGateway, map[string]interface{}{"detail": err.Error()})
					return
				}
				writeJSON(w, http.StatusOK, map[string]interface{}{"orders": positions})
			})
			r.Get("/bars", func(w http.ResponseWriter, r *http.Request) {
				if alpacaClient == nil {
					writeJSON(w, http.StatusServiceUnavailable, map[string]interface{}{"detail": "alpaca client unavailable"})
					return
				}
				symbol := r.URL.Query().Get("symbol")
				start := r.URL.Query().Get("start")
				end := r.URL.Query().Get("end")
				timeframe := r.URL.Query().Get("timeframe")
				if symbol == "" || start == "" || end == "" {
					writeJSON(w, http.StatusBadRequest, map[string]interface{}{"detail": "symbol/start/end are required"})
					return
				}
				payload, err := alpacaClient.GetHistoricalBars(r.Context(), symbol, start, end, timeframe)
				if err != nil {
					writeJSON(w, http.StatusBadGateway, map[string]interface{}{"detail": err.Error()})
					return
				}
				writeJSON(w, http.StatusOK, payload)
			})
		})
	})

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

func writeJSON(w http.ResponseWriter, code int, payload map[string]interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(payload)
}
