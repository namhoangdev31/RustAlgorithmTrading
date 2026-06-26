package server

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"

	"trading/observability-api/internal/alerts"
	"trading/observability-api/internal/config"
	"trading/observability-api/internal/health"
	"trading/observability-api/internal/middleware"
	"trading/observability-api/internal/storage"
	"trading/observability-api/internal/ws"
)

func buildTestRouter() http.Handler {
	gin.SetMode(gin.TestMode)
	cfg := &config.Config{}

	s := NewServer(cfg)
	s.store = storage.NewStore(nil, nil)
	s.wsManager = ws.NewManager()
	s.healthAggregator = health.NewAggregator(s.store, s.wsManager)
	s.incidentManager = alerts.NewManager()

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CorrelationID())
	r.Use(middleware.Logger())
	r.Use(middleware.SetupCors())

	s.mapRoutes(r)
	return r
}

func TestHealthEndpoint(t *testing.T) {
	r := buildTestRouter()
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

func TestAPIKeyAuthRequiredWhenConfigured(t *testing.T) {
	t.Setenv("OBSERVABILITY_API_KEY", "phase3-key")
	r := buildTestRouter()

	req := httptest.NewRequest(http.MethodGet, "/api/metrics/current", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}

	req2 := httptest.NewRequest(http.MethodGet, "/api/metrics/current", nil)
	req2.Header.Set("X-API-Key", "phase3-key")
	rec2 := httptest.NewRecorder()
	r.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec2.Code)
	}
}

func TestCORSHeadersPresent(t *testing.T) {
	_ = os.Setenv("OBSERVABILITY_API_KEY", "")
	r := buildTestRouter()
	req := httptest.NewRequest(http.MethodOptions, "/health", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "GET")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK && rec.Code != http.StatusNoContent {
		t.Fatalf("unexpected CORS status code: %d", rec.Code)
	}
	if rec.Header().Get("Access-Control-Allow-Origin") == "" {
		t.Fatalf("expected Access-Control-Allow-Origin header")
	}
}

func TestIncidentLifecycleEndpoints(t *testing.T) {
	t.Setenv("OBSERVABILITY_API_KEY", "")
	r := buildTestRouter()

	createBody := map[string]interface{}{
		"severity":       "P0",
		"component":      "risk",
		"reason_code":    "RISK_BLOCK",
		"correlation_id": "cid-100",
	}
	raw, _ := json.Marshal(createBody)
	req := httptest.NewRequest(http.MethodPost, "/api/system/incidents", bytes.NewReader(raw))
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rec.Code)
	}

	var created map[string]interface{}
	_ = json.Unmarshal(rec.Body.Bytes(), &created)
	id, ok := created["incident_id"].(string)
	if !ok || id == "" {
		t.Fatalf("missing incident_id in response: %s", rec.Body.String())
	}

	ackReq := httptest.NewRequest(http.MethodPost, "/api/system/incidents/"+id+"/acknowledge?owner=ops", nil)
	ackRec := httptest.NewRecorder()
	r.ServeHTTP(ackRec, ackReq)
	if ackRec.Code != http.StatusOK {
		t.Fatalf("expected 200 acknowledge, got %d", ackRec.Code)
	}

	resolveReq := httptest.NewRequest(http.MethodPost, "/api/system/incidents/"+id+"/resolve?evidence=verified", nil)
	resolveRec := httptest.NewRecorder()
	r.ServeHTTP(resolveRec, resolveReq)
	if resolveRec.Code != http.StatusOK {
		t.Fatalf("expected 200 resolve, got %d", resolveRec.Code)
	}
}

func TestIntegrityValidateEndpoint(t *testing.T) {
	t.Setenv("OBSERVABILITY_API_KEY", "")
	r := buildTestRouter()
	raw := []byte(`{"PnlDriftPct":0.25,"FalseAllowDelta":1}`)
	req := httptest.NewRequest(http.MethodPost, "/api/system/integrity/validate", bytes.NewReader(raw))
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var payload map[string]interface{}
	_ = json.Unmarshal(rec.Body.Bytes(), &payload)
	if valid, ok := payload["is_valid"].(bool); !ok || valid {
		t.Fatalf("expected is_valid=false, got %v", payload["is_valid"])
	}
}
