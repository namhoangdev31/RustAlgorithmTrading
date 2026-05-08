package http

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"trading/observability-api/internal/health"
	"trading/observability-api/internal/storage"
	"trading/observability-api/internal/ws"
)

func buildTestRouter() http.Handler {
	store := storage.NewStore(nil, nil)
	wsManager := ws.NewManager()
	healthAgg := health.NewAggregator(store, wsManager)
	return SetupRoutes(store, wsManager, healthAgg)
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
