package health

import (
	"encoding/json"
	"net/http"
	"time"

	"trading/observability-api/internal/storage"
	"trading/observability-api/internal/ws"
)

type Aggregator struct {
	store     *storage.Store
	wsManager *ws.Manager
	startTime time.Time
}

func NewAggregator(store *storage.Store, wsManager *ws.Manager) *Aggregator {
	return &Aggregator{
		store:     store,
		wsManager: wsManager,
		startTime: time.Now(),
	}
}

func (a *Aggregator) HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "healthy",
		"service": "observability-api-go",
	})
}

func (a *Aggregator) ReadinessCheckHandler(w http.ResponseWriter, r *http.Request) {
	duckReady := a.store != nil && a.store.PingDuckDB() == nil
	sqliteReady := a.store != nil && a.store.PingSQLite() == nil

	collectors := map[string]interface{}{
		"duckdb": map[string]interface{}{
			"ready":  duckReady,
			"status": readinessStatus(duckReady),
		},
		"sqlite": map[string]interface{}{
			"ready":  sqliteReady,
			"status": readinessStatus(sqliteReady),
		},
	}
	ready := duckReady || sqliteReady
	code := http.StatusOK
	if !ready {
		code = http.StatusServiceUnavailable
	}
	writeJSON(w, code, map[string]interface{}{
		"ready":      ready,
		"collectors": collectors,
		"timestamp":  time.Now().Unix(),
	})
}

func (a *Aggregator) LivenessCheckHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"alive":                 true,
		"websocket_connections": a.wsManager.ConnectionCount(),
		"uptime_seconds":        time.Since(a.startTime).Seconds(),
	})
}

func (a *Aggregator) SystemHealthHandler(w http.ResponseWriter, r *http.Request) {
	duckStatus := "error"
	if a.store != nil && a.store.PingDuckDB() == nil {
		duckStatus = "connected"
	}
	sqliteStatus := "error"
	if a.store != nil && a.store.PingSQLite() == nil {
		sqliteStatus = "connected"
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status": "healthy",
		"components": map[string]interface{}{
			"observability_api": map[string]interface{}{"status": "healthy"},
			"websocket":         map[string]interface{}{"status": "healthy", "connections": a.wsManager.ConnectionCount()},
		},
		"resources": map[string]float64{},
		"connections": map[string]interface{}{
			"duckdb": duckStatus,
			"sqlite": sqliteStatus,
		},
	})
}

func (a *Aggregator) ComponentsSnapshot() map[string]interface{} {
	return map[string]interface{}{
		"status": "healthy",
		"components": map[string]interface{}{
			"websocket": map[string]interface{}{
				"status":      "healthy",
				"connections": a.wsManager.ConnectionCount(),
				"stats":       a.wsManager.Stats(),
			},
			"duckdb": map[string]interface{}{
				"status": readinessStatus(a.store != nil && a.store.PingDuckDB() == nil),
			},
			"sqlite": map[string]interface{}{
				"status": readinessStatus(a.store != nil && a.store.PingSQLite() == nil),
			},
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
}

func readinessStatus(ok bool) string {
	if ok {
		return "connected"
	}
	return "error"
}

func writeJSON(w http.ResponseWriter, code int, v map[string]interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}
