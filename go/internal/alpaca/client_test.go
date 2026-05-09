package alpaca

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestGetAccount(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v2/account" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"cash":"1000","portfolio_value":"1500","buying_power":"500","equity":"1500","status":"ACTIVE"}`))
	}))
	defer ts.Close()

	c, err := NewClient(Config{BaseURL: ts.URL, APIKey: "k", SecretKey: "s"})
	if err != nil {
		t.Fatal(err)
	}
	acc, err := c.GetAccount(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if acc.Cash != 1000 || acc.Status != "ACTIVE" {
		t.Fatalf("unexpected account: %+v", acc)
	}
}

func TestRetries429ThenSuccess(t *testing.T) {
	calls := 0
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		if calls < 3 {
			w.WriteHeader(http.StatusTooManyRequests)
			_, _ = w.Write([]byte(`{"error":"rate"}`))
			return
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`[]`))
	}))
	defer ts.Close()

	c, err := NewClient(Config{BaseURL: ts.URL, APIKey: "k", SecretKey: "s", MaxRetries: 3, RetryDelay: time.Millisecond})
	if err != nil {
		t.Fatal(err)
	}
	_, err = c.GetPositions(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if calls != 3 {
		t.Fatalf("expected 3 calls, got %d", calls)
	}
}

func TestPlaceMarketOrder(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v2/orders" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		if r.Method != http.MethodPost {
			t.Fatalf("unexpected method: %s", r.Method)
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(fmt.Sprintf(`{"id":"oid-1","status":"new","symbol":"AAPL","created_at":"%s"}`, time.Now().UTC().Format(time.RFC3339))))
	}))
	defer ts.Close()

	c, err := NewClient(Config{BaseURL: ts.URL, APIKey: "k", SecretKey: "s"})
	if err != nil {
		t.Fatal(err)
	}
	resp, err := c.PlaceMarketOrder(context.Background(), "AAPL", 10, "buy", "day")
	if err != nil {
		t.Fatal(err)
	}
	if resp.Symbol != "AAPL" {
		t.Fatalf("unexpected resp: %+v", resp)
	}
}
