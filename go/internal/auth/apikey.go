package auth

import (
	"net/http"
	"os"
)

// APIKeyAuth enforces internal API key policy.
// If OBSERVABILITY_API_KEY is empty, auth is permissive for local/dev parity.
func APIKeyAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		expected := os.Getenv("OBSERVABILITY_API_KEY")
		if expected == "" {
			next.ServeHTTP(w, r)
			return
		}
		if r.Header.Get("X-API-Key") != expected {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"detail":"Unauthorized"}`))
			return
		}
		next.ServeHTTP(w, r)
	})
}
