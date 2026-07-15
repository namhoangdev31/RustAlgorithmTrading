package middleware

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/domain/usecases"
)

func TestRequireStorefrontAuthRejectsMissingBearer(t *testing.T) {
	router := testAuthRouter(fakeVerifier{principal: usecases.Principal{UserID: "user"}})
	request := httptest.NewRequest(http.MethodGet, "/protected", nil)
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	if response.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", response.Code)
	}
}

func TestRequireStorefrontAuthSetsPrincipal(t *testing.T) {
	router := testAuthRouter(fakeVerifier{principal: usecases.Principal{UserID: "user", UserType: "admin"}})
	request := httptest.NewRequest(http.MethodGet, "/protected", nil)
	request.Header.Set("Authorization", "Bearer valid-token")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", response.Code, response.Body.String())
	}
}

func TestRequireStorefrontAdminRejectsNonAdmin(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/admin", RequireStorefrontAuth(fakeVerifier{principal: usecases.Principal{UserID: "user", UserType: "individual"}}), RequireStorefrontAdmin(), func(c *gin.Context) { c.Status(http.StatusOK) })
	request := httptest.NewRequest(http.MethodGet, "/admin", nil)
	request.Header.Set("Authorization", "Bearer valid-token")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	if response.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", response.Code)
	}
}

func TestRequireStorefrontAuthReportsUnavailableVerifier(t *testing.T) {
	router := testAuthRouter(fakeVerifier{err: repositories.ErrUnavailable})
	request := httptest.NewRequest(http.MethodGet, "/protected", nil)
	request.Header.Set("Authorization", "Bearer token")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", response.Code)
	}
}

func testAuthRouter(verifier AccessTokenVerifier) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/protected", RequireStorefrontAuth(verifier), func(c *gin.Context) {
		if _, ok := StorefrontPrincipal(c); !ok {
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		c.Status(http.StatusOK)
	})
	return router
}

type fakeVerifier struct {
	principal usecases.Principal
	err       error
}

func (f fakeVerifier) VerifyAccessToken(string) (usecases.Principal, error) {
	if f.err != nil {
		return usecases.Principal{}, f.err
	}
	if f.principal.UserID == "" {
		return usecases.Principal{}, errors.New("invalid")
	}
	return f.principal, nil
}
