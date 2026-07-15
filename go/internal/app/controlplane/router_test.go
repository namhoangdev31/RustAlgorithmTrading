package controlplane

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestMetricsRouteUsesConfiguredAPIKey(t *testing.T) {
	router := NewRouter(RouterDependencies{ServiceName: "test", APIKey: "secret"})

	unauthorized := httptest.NewRecorder()
	router.ServeHTTP(unauthorized, httptest.NewRequest(http.MethodGet, "/metrics", nil))
	if unauthorized.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 without API key, got %d", unauthorized.Code)
	}

	authorized := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	request.Header.Set("X-API-Key", "secret")
	router.ServeHTTP(authorized, request)
	if authorized.Code != http.StatusOK {
		t.Fatalf("expected 200 with API key, got %d", authorized.Code)
	}
}
