package postgres

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
)

type rankingBundleScore struct {
	ID             uuid.UUID
	Category       *string
	ActiveInstalls int64
	Rating         float64
	RatingCount    int64
	D1Retention    *float64
	D7Retention    *float64
	D30Retention   *float64
	PaidOrders     int64
	OverallScore   float64
}

type lepoSSLDomainConfig struct {
	ID          string     `json:"id"`
	Domain      string     `json:"domain"`
	ProjectID   uuid.UUID  `json:"projectId"`
	DNSProvider *string    `json:"dnsProvider,omitempty"`
	ExpiresAt   *time.Time `json:"certExpiresAt,omitempty"`
}

type lepoSSLRenewalResponse struct {
	SSLStatus     string     `json:"sslStatus"`
	CertIssuedAt  *time.Time `json:"certIssuedAt"`
	CertExpiresAt *time.Time `json:"certExpiresAt"`
	CertPEMRef    string     `json:"certPemRef"`
	KeyPEMRef     string     `json:"keyPemRef"`
}

func firstFloat(values ...*float64) float64 {
	for _, value := range values {
		if value != nil {
			return *value
		}
	}
	return 0
}

func uniqueCategories(rows []rankingBundleScore) []string {
	seen := map[string]struct{}{}
	for _, row := range rows {
		seen[coalescePtr(row.Category, "General")] = struct{}{}
	}
	categories := make([]string, 0, len(seen))
	for category := range seen {
		categories = append(categories, category)
	}
	sort.Strings(categories)
	return categories
}

func sortedByCategory(rows []rankingBundleScore, category string) []rankingBundleScore {
	filtered := make([]rankingBundleScore, 0)
	for _, row := range rows {
		if coalescePtr(row.Category, "General") == category {
			filtered = append(filtered, row)
		}
	}
	sort.Slice(filtered, func(i, j int) bool { return filtered[i].OverallScore > filtered[j].OverallScore })
	return filtered
}

func coalescePtr(value *string, fallback string) string {
	if value == nil || strings.TrimSpace(*value) == "" {
		return fallback
	}
	return *value
}

func (r *LepoShipRepository) renewDomainCertificate(ctx context.Context, adapterURL, token string, domain lepoSSLDomainConfig) (lepoSSLRenewalResponse, bool) {
	status, body, ok := postJSON(ctx, adapterURL, domain, map[string]string{
		"Authorization": bearerToken(token), "User-Agent": "LepoShip-SSL-Renewal/2026.1",
	})
	if !ok {
		return lepoSSLRenewalResponse{}, false
	}
	var response lepoSSLRenewalResponse
	if strings.TrimSpace(body) == "" {
		return response, true
	}
	if err := json.Unmarshal([]byte(body), &response); err != nil {
		return lepoSSLRenewalResponse{SSLStatus: fmt.Sprintf("RENEWED_HTTP_%d", status)}, true
	}
	return response, true
}

func postJSON(ctx context.Context, targetURL string, payload any, headers map[string]string) (int, string, bool) {
	data, err := json.Marshal(payload)
	if err != nil {
		return 0, err.Error(), false
	}
	return postWebhook(ctx, targetURL, string(data), headers)
}

func postWebhook(ctx context.Context, targetURL, payload string, headers map[string]string) (int, string, bool) {
	reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(reqCtx, http.MethodPost, targetURL, bytes.NewBufferString(payload))
	if err != nil {
		return 0, err.Error(), false
	}
	req.Header.Set("Content-Type", "application/json")
	for key, value := range headers {
		if value != "" {
			req.Header.Set(key, value)
		}
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return 0, err.Error(), false
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	return resp.StatusCode, string(body), resp.StatusCode >= 200 && resp.StatusCode < 300
}

func bearerToken(token string) string {
	token = strings.TrimSpace(token)
	if token == "" {
		return ""
	}
	return "Bearer " + token
}

func envBool(key string) bool {
	switch strings.ToLower(strings.TrimSpace(os.Getenv(key))) {
	case "1", "true", "yes", "y", "on":
		return true
	default:
		return false
	}
}

func hmacHex(secret, payload string) string {
	if secret == "" {
		return ""
	}
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(payload))
	return hex.EncodeToString(mac.Sum(nil))
}

func truncate(value string, limit int) string {
	if len(value) <= limit {
		return value
	}
	return value[:limit]
}

func sha256Hex(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func deviceFingerprint(deviceID, pepper string) string {
	if deviceID == "" {
		return ""
	}
	mac := hmac.New(sha256.New, []byte(pepper))
	_, _ = mac.Write([]byte(deviceID))
	return hex.EncodeToString(mac.Sum(nil))
}

func offlineToken(entitlementID, deviceID string) string {
	mac := hmac.New(sha256.New, []byte(os.Getenv("ENCRYPTION_KEY")))
	_, _ = mac.Write([]byte(entitlementID + ":" + deviceID))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func randomToken(size int) (string, error) {
	buf := make([]byte, size)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

func optionalString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
func stringValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
func coalesce(value, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}

func eventTime(raw string, fallback time.Time) time.Time {
	if raw == "" {
		return fallback
	}
	parsed, err := time.Parse(time.RFC3339, raw)
	if err != nil || parsed.After(fallback.Add(5*time.Minute)) || parsed.Before(fallback.AddDate(0, 0, -30)) {
		return fallback
	}
	return parsed.UTC()
}

func artifactURLParts(_ string, _ string, storageKey string) string {
	base := os.Getenv("LEPOS_ARTIFACT_PUBLIC_URL")
	if base == "" {
		return ""
	}
	parsed, err := url.Parse(base)
	if err != nil {
		return strings.TrimRight(base, "/") + "/" + strings.TrimLeft(storageKey, "/")
	}
	parsed.Path = path.Join(parsed.Path, storageKey)
	return parsed.String()
}
