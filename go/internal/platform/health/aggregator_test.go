package health

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestReadinessRequiresEveryRequiredDependency(t *testing.T) {
	aggregator := New(nil,
		DependencyCheck{Name: "postgres", Required: true, Check: func() error { return nil }},
		DependencyCheck{Name: "questdb", Required: true, Check: func() error { return errors.New("down") }},
		DependencyCheck{Name: "optional", Required: false, Check: func() error { return errors.New("down") }},
	)
	response := httptest.NewRecorder()
	aggregator.ReadinessCheckHandler(response, httptest.NewRequest(http.MethodGet, "/health/ready", nil))
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d: %s", response.Code, response.Body.String())
	}
}

func TestLivenessDoesNotDependOnExternalServices(t *testing.T) {
	aggregator := New(nil, DependencyCheck{Name: "postgres", Required: true, Check: func() error { return errors.New("down") }})
	response := httptest.NewRecorder()
	aggregator.LivenessCheckHandler(response, httptest.NewRequest(http.MethodGet, "/health/live", nil))
	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}
}
