package collector

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestParser(t *testing.T) {
	parser := NewParser()
	text := `
# HELP test_metric A test metric
# TYPE test_metric counter
test_metric{symbol="AAPL"} 123.45
# TYPE gauge_metric gauge
gauge_metric 50.0
`
	metrics, err := parser.Parse(text, "test_service")
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}

	if len(metrics) != 2 {
		t.Errorf("Expected 2 metrics, got %d", len(metrics))
	}

	foundCounter := false
	for _, m := range metrics {
		if m.Name == "test_metric" {
			foundCounter = true
			if m.Value != 123.45 {
				t.Errorf("Expected value 123.45, got %f", m.Value)
			}
			if m.Labels["symbol"] != "AAPL" {
				t.Errorf("Expected symbol AAPL, got %s", m.Labels["symbol"])
			}
			if m.Type != Counter {
				t.Errorf("Expected Counter type, got %s", m.Type)
			}
		}
	}
	if !foundCounter {
		t.Error("test_metric not found")
	}
}

func TestScraper(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("# TYPE test_gauge gauge\ntest_gauge 42.0\n"))
	}))
	defer server.Close()

	scraper := NewScraper(map[string]string{"test": server.URL})
	results := scraper.ScrapeAll(context.Background())

	res, ok := results["test"]
	if !ok {
		t.Fatal("Result for 'test' not found")
	}
	if res.Error != nil {
		t.Fatalf("Scrape failed: %v", res.Error)
	}
	if len(res.Metrics) != 1 {
		t.Fatalf("Expected 1 metric, got %d", len(res.Metrics))
	}
	if res.Metrics[0].Value != 42.0 {
		t.Errorf("Expected value 42.0, got %f", res.Metrics[0].Value)
	}
}
