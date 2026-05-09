package http

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"trading/observability-api/internal/auth"
	"trading/observability-api/internal/health"
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
				if store != nil {
					if store.Postgres() != nil {
						if t, err := store.Postgres().QueryTrades(limit, offset, symbol, side); err == nil {
							trades = t
						}
					} else if store.SQLite() != nil {
						if t, err := store.SQLite().QueryTrades(limit, offset, symbol, side); err == nil {
							trades = t
						}
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

				if store != nil {
					if store.Postgres() != nil {
						trade, ok, err = store.Postgres().QueryTradeByID(tradeID)
					} else if store.SQLite() != nil {
						trade, ok, err = store.SQLite().QueryTradeByID(tradeID)
					}
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
				if store != nil {
					if store.Postgres() != nil {
						if s, err := store.Postgres().QueryTradeStatsSummary(symbol, timeRange); err == nil {
							payload = s
						}
					} else if store.SQLite() != nil {
						if s, err := store.SQLite().QueryTradeStatsSummary(symbol, timeRange); err == nil {
							payload = s
						}
					}
				}
				writeJSON(w, http.StatusOK, payload)
			})

			r.Get("/execution/quality", func(w http.ResponseWriter, r *http.Request) {
				payload := map[string]interface{}{}
				if store != nil {
					if store.Postgres() != nil {
						if s, err := store.Postgres().QueryExecutionQuality(); err == nil {
							payload = s
						}
					} else if store.SQLite() != nil {
						if s, err := store.SQLite().QueryExecutionQuality(); err == nil {
							payload = s
						}
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
