package alpaca

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

type Config struct {
	BaseURL     string
	DataBaseURL string
	APIKey      string
	SecretKey   string
	HTTPClient  *http.Client
	MaxRetries  int
	RetryDelay  time.Duration
}

type Client struct {
	baseURL     string
	dataBaseURL string
	apiKey      string
	secretKey   string
	httpClient  *http.Client
	maxRetries  int
	retryDelay  time.Duration
}

type Account struct {
	Cash           float64 `json:"cash,string"`
	PortfolioValue float64 `json:"portfolio_value,string"`
	BuyingPower    float64 `json:"buying_power,string"`
	Equity         float64 `json:"equity,string"`
	Status         string  `json:"status"`
}

type Position struct {
	Symbol       string  `json:"symbol"`
	Qty          float64 `json:"qty,string"`
	AvgEntry     float64 `json:"avg_entry_price,string"`
	CurrentPrice float64 `json:"current_price,string"`
	MarketValue  float64 `json:"market_value,string"`
	UnrealizedPL float64 `json:"unrealized_pl,string"`
}

type OrderRequest struct {
	Symbol      string `json:"symbol"`
	Qty         string `json:"qty"`
	Side        string `json:"side"`
	Type        string `json:"type"`
	TimeInForce string `json:"time_in_force"`
}

type OrderResponse struct {
	ID        string `json:"id"`
	Status    string `json:"status"`
	Symbol    string `json:"symbol"`
	CreatedAt string `json:"created_at"`
}

func NewClient(cfg Config) (*Client, error) {
	if strings.TrimSpace(cfg.APIKey) == "" || strings.TrimSpace(cfg.SecretKey) == "" {
		return nil, errors.New("missing alpaca credentials")
	}
	if strings.TrimSpace(cfg.BaseURL) == "" {
		cfg.BaseURL = getenvOrDefault("ALPACA_BASE_URL", "https://paper-api.alpaca.markets")
	}
	if strings.TrimSpace(cfg.DataBaseURL) == "" {
		cfg.DataBaseURL = getenvOrDefault("ALPACA_DATA_BASE_URL", "https://data.alpaca.markets")
	}
	if cfg.HTTPClient == nil {
		cfg.HTTPClient = &http.Client{Timeout: 12 * time.Second}
	}
	if cfg.MaxRetries <= 0 {
		cfg.MaxRetries = 3
	}
	if cfg.RetryDelay <= 0 {
		cfg.RetryDelay = 200 * time.Millisecond
	}

	return &Client{
		baseURL:     strings.TrimRight(cfg.BaseURL, "/"),
		dataBaseURL: strings.TrimRight(cfg.DataBaseURL, "/"),
		apiKey:      cfg.APIKey,
		secretKey:   cfg.SecretKey,
		httpClient:  cfg.HTTPClient,
		maxRetries:  cfg.MaxRetries,
		retryDelay:  cfg.RetryDelay,
	}, nil
}

func (c *Client) GetAccount(ctx context.Context) (Account, error) {
	var out Account
	err := c.doTradingJSON(ctx, http.MethodGet, "/v2/account", nil, &out)
	return out, err
}

func (c *Client) GetPositions(ctx context.Context) ([]Position, error) {
	var out []Position
	err := c.doTradingJSON(ctx, http.MethodGet, "/v2/positions", nil, &out)
	return out, err
}

func (c *Client) GetHistoricalBars(ctx context.Context, symbol, startISO, endISO, timeframe string) (map[string]any, error) {
	if timeframe == "" {
		timeframe = "1Day"
	}
	q := url.Values{}
	q.Set("start", startISO)
	q.Set("end", endISO)
	q.Set("timeframe", timeframe)
	path := fmt.Sprintf("/v2/stocks/%s/bars?%s", url.PathEscape(symbol), q.Encode())
	var out map[string]any
	err := c.doDataJSON(ctx, http.MethodGet, path, nil, &out)
	return out, err
}

func (c *Client) PlaceMarketOrder(ctx context.Context, symbol string, qty float64, side string, tif string) (OrderResponse, error) {
	if tif == "" {
		tif = "day"
	}
	req := OrderRequest{
		Symbol:      symbol,
		Qty:         fmt.Sprintf("%.8f", qty),
		Side:        strings.ToLower(side),
		Type:        "market",
		TimeInForce: strings.ToLower(tif),
	}
	var out OrderResponse
	err := c.doTradingJSON(ctx, http.MethodPost, "/v2/orders", req, &out)
	return out, err
}

func (c *Client) PlaceLimitOrder(ctx context.Context, symbol string, qty float64, side string, limitPrice float64, tif string) (OrderResponse, error) {
	if tif == "" {
		tif = "day"
	}
	req := map[string]any{
		"symbol":        symbol,
		"qty":           fmt.Sprintf("%.8f", qty),
		"side":          strings.ToLower(side),
		"type":          "limit",
		"limit_price":   fmt.Sprintf("%.8f", limitPrice),
		"time_in_force": strings.ToLower(tif),
	}
	var out OrderResponse
	err := c.doTradingJSON(ctx, http.MethodPost, "/v2/orders", req, &out)
	return out, err
}

func (c *Client) GetOrders(ctx context.Context, status string) ([]map[string]any, error) {
	if status == "" {
		status = "all"
	}
	path := fmt.Sprintf("/v2/orders?status=%s", url.QueryEscape(status))
	var out []map[string]any
	err := c.doTradingJSON(ctx, http.MethodGet, path, nil, &out)
	return out, err
}

func (c *Client) CancelOrder(ctx context.Context, orderID string) error {
	return c.doTradingJSON(ctx, http.MethodDelete, "/v2/orders/"+url.PathEscape(orderID), nil, nil)
}

func (c *Client) CancelAllOrders(ctx context.Context) error {
	return c.doTradingJSON(ctx, http.MethodDelete, "/v2/orders", nil, nil)
}

func (c *Client) CloseAllPositions(ctx context.Context) ([]map[string]any, error) {
	var out []map[string]any
	err := c.doTradingJSON(ctx, http.MethodDelete, "/v2/positions", nil, &out)
	return out, err
}

func (c *Client) doTradingJSON(ctx context.Context, method, path string, reqBody any, out any) error {
	return c.doJSON(ctx, c.baseURL+path, method, reqBody, out)
}

func (c *Client) doDataJSON(ctx context.Context, method, path string, reqBody any, out any) error {
	return c.doJSON(ctx, c.dataBaseURL+path, method, reqBody, out)
}

func (c *Client) doJSON(ctx context.Context, fullURL, method string, reqBody any, out any) error {
	var payload []byte
	var err error
	if reqBody != nil {
		payload, err = json.Marshal(reqBody)
		if err != nil {
			return err
		}
	}

	for attempt := 0; attempt <= c.maxRetries; attempt++ {
		req, err := http.NewRequestWithContext(ctx, method, fullURL, bytes.NewReader(payload))
		if err != nil {
			return err
		}
		req.Header.Set("APCA-API-KEY-ID", c.apiKey)
		req.Header.Set("APCA-API-SECRET-KEY", c.secretKey)
		req.Header.Set("Content-Type", "application/json")

		resp, err := c.httpClient.Do(req)
		if err != nil {
			if attempt < c.maxRetries {
				time.Sleep(c.retryDelay)
				continue
			}
			return err
		}

		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		if resp.StatusCode >= 500 || resp.StatusCode == 429 {
			if attempt < c.maxRetries {
				time.Sleep(c.retryDelay)
				continue
			}
		}

		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			return fmt.Errorf("alpaca status=%d body=%s", resp.StatusCode, string(body))
		}

		if out != nil && len(body) > 0 {
			if err := json.Unmarshal(body, out); err != nil {
				return err
			}
		}
		return nil
	}
	return errors.New("unreachable retry state")
}

func getenvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); strings.TrimSpace(v) != "" {
		return v
	}
	return fallback
}
