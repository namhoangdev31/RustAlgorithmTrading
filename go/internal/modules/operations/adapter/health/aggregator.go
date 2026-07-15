package health

import (
	"encoding/json"
	"net/http"
	"time"
)

type Aggregator struct {
	questDBCheck  func() error
	postgresCheck func() error
	connections   interface {
		ConnectionCount() int
		Stats() map[string]any
	}
	required  map[string]func() error
	startTime time.Time
}

func New(questDBCheck, postgresCheck func() error, connections interface {
	ConnectionCount() int
	Stats() map[string]any
}, required ...map[string]func() error) *Aggregator {
	checks := map[string]func() error{}
	if len(required) > 0 && required[0] != nil {
		checks = required[0]
	}
	return &Aggregator{
		questDBCheck: questDBCheck, postgresCheck: postgresCheck, connections: connections, required: checks, startTime: time.Now(),
	}
}

func (a *Aggregator) HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "healthy",
		"service": "observability-api-go",
	})
}

func (a *Aggregator) ReadinessCheckHandler(w http.ResponseWriter, r *http.Request) {
	questReady := a.questDBCheck != nil && a.questDBCheck() == nil
	postgresReady := a.postgresCheck != nil && a.postgresCheck() == nil

	collectors := map[string]interface{}{
		"questdb": map[string]interface{}{
			"ready":  questReady,
			"status": readinessStatus(questReady),
		},
		"postgres": map[string]interface{}{
			"ready":  postgresReady,
			"status": readinessStatus(postgresReady),
		},
	}
	ready := questReady || postgresReady
	for name, check := range a.required {
		dependencyReady := check != nil && check() == nil
		collectors[name] = map[string]interface{}{"ready": dependencyReady, "status": readinessStatus(dependencyReady)}
		ready = ready && dependencyReady
	}
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
		"websocket_connections": a.connectionCount(),
		"uptime_seconds":        time.Since(a.startTime).Seconds(),
	})
}

func (a *Aggregator) SystemHealthHandler(w http.ResponseWriter, r *http.Request) {
	questStatus := "error"
	if a.questDBCheck != nil && a.questDBCheck() == nil {
		questStatus = "connected"
	}
	postgresStatus := "error"
	if a.postgresCheck != nil && a.postgresCheck() == nil {
		postgresStatus = "connected"
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status": "healthy",
		"components": map[string]interface{}{
			"observability_api": map[string]interface{}{"status": "healthy"},
			"websocket":         map[string]interface{}{"status": "healthy", "connections": a.connectionCount()},
		},
		"resources": map[string]float64{},
		"connections": map[string]interface{}{
			"questdb":  questStatus,
			"postgres": postgresStatus,
		},
	})
}

func (a *Aggregator) ComponentsSnapshot() map[string]interface{} {
	return map[string]interface{}{
		"status": "healthy",
		"components": map[string]interface{}{
			"websocket": map[string]interface{}{
				"status":      "healthy",
				"connections": a.connectionCount(),
				"stats":       a.connectionStats(),
			},
			"questdb": map[string]interface{}{
				"status": readinessStatus(a.questDBCheck != nil && a.questDBCheck() == nil),
			},
			"postgres": map[string]interface{}{
				"status": readinessStatus(a.postgresCheck != nil && a.postgresCheck() == nil),
			},
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
}

func (a *Aggregator) connectionCount() int {
	if a.connections == nil {
		return 0
	}
	return a.connections.ConnectionCount()
}

func (a *Aggregator) connectionStats() map[string]any {
	if a.connections == nil {
		return map[string]any{}
	}
	return a.connections.Stats()
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
