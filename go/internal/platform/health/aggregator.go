package health

import (
	"encoding/json"
	"net/http"
	"time"
)

type Aggregator struct {
	connections Connections
	checks      []DependencyCheck
	startTime   time.Time
}

type Connections interface {
	ConnectionCount() int
	Stats() map[string]any
}

type DependencyCheck struct {
	Name     string
	Required bool
	Check    func() error
}

func New(connections Connections, checks ...DependencyCheck) *Aggregator {
	return &Aggregator{
		connections: connections, checks: checks, startTime: time.Now(),
	}
}

func (a *Aggregator) HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "healthy",
		"service": "observability-api-go",
	})
}

func (a *Aggregator) ReadinessCheckHandler(w http.ResponseWriter, r *http.Request) {
	collectors := map[string]interface{}{}
	ready := true
	for _, dependency := range a.checks {
		dependencyReady := dependency.Check != nil && dependency.Check() == nil
		collectors[dependency.Name] = map[string]interface{}{"ready": dependencyReady, "required": dependency.Required, "status": readinessStatus(dependencyReady)}
		if dependency.Required {
			ready = ready && dependencyReady
		}
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
	statuses := map[string]interface{}{}
	for _, dependency := range a.checks {
		statuses[dependency.Name] = readinessStatus(dependency.Check != nil && dependency.Check() == nil)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status": "healthy",
		"components": map[string]interface{}{
			"observability_api": map[string]interface{}{"status": "healthy"},
			"websocket":         map[string]interface{}{"status": "healthy", "connections": a.connectionCount()},
		},
		"resources":   map[string]float64{},
		"connections": statuses,
	})
}

func (a *Aggregator) ComponentsSnapshot() map[string]interface{} {
	components := map[string]interface{}{
		"websocket": map[string]interface{}{
			"status": "healthy", "connections": a.connectionCount(), "stats": a.connectionStats(),
		},
	}
	for _, dependency := range a.checks {
		components[dependency.Name] = map[string]interface{}{"status": readinessStatus(dependency.Check != nil && dependency.Check() == nil)}
	}
	return map[string]interface{}{
		"status":     "healthy",
		"components": components,
		"timestamp":  time.Now().UTC().Format(time.RFC3339),
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
