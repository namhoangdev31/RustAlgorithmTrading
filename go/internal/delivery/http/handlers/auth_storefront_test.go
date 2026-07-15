package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/domain/usecases"
)

func TestAuthLoginResponseMatchesIOSContract(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewAuthStorefrontHandler(fakeAuthUseCase{tokens: usecases.AuthTokenResponse{AccessToken: "access", RefreshToken: "refresh", ExpiresIn: 900}})
	router := gin.New()
	router.POST("/api/v1/auth/login", handler.Login)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBufferString(`{"email":"user@example.com","password":"secret"}`))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", response.Code, response.Body.String())
	}
	var payload map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["accessToken"] != "access" || payload["refreshToken"] != "refresh" || payload["expiresIn"] != float64(900) {
		t.Fatalf("unexpected auth payload: %#v", payload)
	}
}

func TestAuthLoginUsesSafeErrorEnvelope(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler := NewAuthStorefrontHandler(fakeAuthUseCase{err: repositories.ErrUnauthorized})
	router := gin.New()
	router.POST("/api/v1/auth/login", handler.Login)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBufferString(`{"email":"user@example.com","password":"bad"}`))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	if response.Code != http.StatusUnauthorized || response.Body.String() != `{"error":"unauthorized"}` {
		t.Fatalf("unexpected error response: %d %s", response.Code, response.Body.String())
	}
}

type fakeAuthUseCase struct {
	tokens usecases.AuthTokenResponse
	err    error
}

func (f fakeAuthUseCase) Login(context.Context, string, string) (usecases.AuthTokenResponse, error) {
	return f.tokens, f.err
}
func (f fakeAuthUseCase) LoginWithFirebase(context.Context, string) (usecases.AuthTokenResponse, error) {
	return f.tokens, f.err
}
func (f fakeAuthUseCase) Refresh(context.Context, string) (usecases.AuthTokenResponse, error) {
	return f.tokens, f.err
}
func (f fakeAuthUseCase) Me(context.Context, usecases.Principal) (repositories.UserView, error) {
	return repositories.UserView{}, f.err
}
func (f fakeAuthUseCase) ListUsers(context.Context) ([]repositories.UserView, error) {
	return []repositories.UserView{}, f.err
}
func (f fakeAuthUseCase) VerifyAccessToken(string) (usecases.Principal, error) {
	return usecases.Principal{}, f.err
}
