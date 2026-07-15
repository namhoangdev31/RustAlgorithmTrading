package httpadapter

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	identity "trading/control-gateway/internal/modules/identity/application"
)

type verifierFake struct {
	principal identity.Principal
	err       error
}

func (v verifierFake) VerifyAccessToken(string) (identity.Principal, error) {
	return v.principal, v.err
}

func TestAuthAndAdminMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/protected", RequireAuth(verifierFake{principal: identity.Principal{UserID: "user", UserType: "user"}}), func(c *gin.Context) { c.Status(http.StatusNoContent) })
	router.GET("/admin", RequireAuth(verifierFake{principal: identity.Principal{UserID: "user", UserType: "user"}}), RequireAdmin(), func(c *gin.Context) { c.Status(http.StatusNoContent) })

	missing := httptest.NewRecorder()
	router.ServeHTTP(missing, httptest.NewRequest(http.MethodGet, "/protected", nil))
	if missing.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", missing.Code)
	}

	protected := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/protected", nil)
	request.Header.Set("Authorization", "Bearer token")
	router.ServeHTTP(protected, request)
	if protected.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", protected.Code)
	}

	admin := httptest.NewRecorder()
	request = httptest.NewRequest(http.MethodGet, "/admin", nil)
	request.Header.Set("Authorization", "Bearer token")
	router.ServeHTTP(admin, request)
	if admin.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", admin.Code)
	}

}
