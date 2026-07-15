package firebase

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"trading/control-gateway/internal/domain/repositories"
)

const defaultBaseURL = "https://identitytoolkit.googleapis.com/v1"

type Client struct {
	apiKey  string
	baseURL string
	http    *http.Client
}

func NewClient(apiKey string) *Client {
	return NewClientWithBaseURL(apiKey, defaultBaseURL)
}

func NewClientWithBaseURL(apiKey, baseURL string) *Client {
	return &Client{apiKey: strings.TrimSpace(apiKey), baseURL: strings.TrimRight(baseURL, "/"), http: &http.Client{Timeout: 10 * time.Second}}
}

func (c *Client) AuthenticatePassword(ctx context.Context, email, password string) (repositories.FirebaseUser, error) {
	var response firebaseUser
	if err := c.request(ctx, "accounts:signInWithPassword", map[string]any{"email": email, "password": password, "returnSecureToken": true}, &response); err != nil {
		return repositories.FirebaseUser{}, err
	}
	return response.domain(), nil
}

func (c *Client) VerifyIDToken(ctx context.Context, idToken string) (repositories.FirebaseUser, error) {
	var response struct {
		Users []firebaseUser `json:"users"`
	}
	if err := c.request(ctx, "accounts:lookup", map[string]any{"idToken": idToken}, &response); err != nil {
		return repositories.FirebaseUser{}, err
	}
	if len(response.Users) == 0 || response.Users[0].LocalID == "" {
		return repositories.FirebaseUser{}, repositories.ErrUnauthorized
	}
	return response.Users[0].domain(), nil
}

func (c *Client) request(ctx context.Context, method string, body any, output any) error {
	if c.apiKey == "" {
		return fmt.Errorf("%w: firebase api key is not configured", repositories.ErrUnavailable)
	}
	raw, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal firebase request: %w", err)
	}
	endpoint := c.baseURL + "/" + method + "?key=" + url.QueryEscape(c.apiKey)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(raw))
	if err != nil {
		return fmt.Errorf("create firebase request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("%w: firebase request failed", repositories.ErrUnavailable)
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		if resp.StatusCode >= 500 {
			return repositories.ErrUnavailable
		}
		return repositories.ErrUnauthorized
	}
	if err := json.NewDecoder(resp.Body).Decode(output); err != nil {
		return fmt.Errorf("decode firebase response: %w", err)
	}
	return nil
}

type firebaseUser struct {
	LocalID          string `json:"localId"`
	Email            string `json:"email"`
	DisplayName      string `json:"displayName"`
	PhotoURL         string `json:"photoUrl"`
	ProviderID       string `json:"providerId"`
	ProviderUserInfo []struct {
		ProviderID string `json:"providerId"`
	} `json:"providerUserInfo"`
}

func (u firebaseUser) domain() repositories.FirebaseUser {
	provider := u.ProviderID
	if provider == "" && len(u.ProviderUserInfo) > 0 {
		provider = u.ProviderUserInfo[0].ProviderID
	}
	if provider == "" {
		provider = "firebase"
	}
	return repositories.FirebaseUser{LocalID: u.LocalID, Email: u.Email, DisplayName: u.DisplayName, PhotoURL: u.PhotoURL, ProviderID: provider}
}
