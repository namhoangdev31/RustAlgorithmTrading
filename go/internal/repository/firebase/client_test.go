package firebase

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"trading/control-gateway/internal/domain/repositories"
)

func TestAuthenticatePasswordUsesFirebaseIdentityToolkitContract(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/accounts:signInWithPassword" || r.URL.Query().Get("key") != "api-key" {
			t.Fatalf("unexpected firebase request: %s", r.URL.String())
		}
		var payload map[string]any
		_ = json.NewDecoder(r.Body).Decode(&payload)
		if payload["email"] != "user@example.com" || payload["password"] != "secret" || payload["returnSecureToken"] != true {
			t.Fatalf("unexpected payload: %#v", payload)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"localId":"firebase-id","email":"user@example.com","displayName":"Store User"}`))
	}))
	defer server.Close()

	user, err := NewClientWithBaseURL("api-key", server.URL).AuthenticatePassword(context.Background(), "user@example.com", "secret")
	if err != nil {
		t.Fatalf("authenticate password: %v", err)
	}
	if user.LocalID != "firebase-id" || user.Email != "user@example.com" || user.ProviderID != "firebase" {
		t.Fatalf("unexpected user: %+v", user)
	}
}

func TestVerifyIDTokenMapsRejectedFirebaseTokenToUnauthorized(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, `{"error":{"message":"INVALID_ID_TOKEN"}}`, http.StatusBadRequest)
	}))
	defer server.Close()
	_, err := NewClientWithBaseURL("api-key", server.URL).VerifyIDToken(context.Background(), "bad-token")
	if err != repositories.ErrUnauthorized {
		t.Fatalf("expected unauthorized, got %v", err)
	}
}

func TestMissingFirebaseKeyFailsClosed(t *testing.T) {
	_, err := NewClientWithBaseURL("", "http://unused").VerifyIDToken(context.Background(), "token")
	if err == nil || !strings.Contains(err.Error(), repositories.ErrUnavailable.Error()) {
		t.Fatalf("expected unavailable, got %v", err)
	}
}
