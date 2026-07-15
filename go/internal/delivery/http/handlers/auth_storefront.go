package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/domain/usecases"
	"trading/control-gateway/internal/middleware"
)

type AuthStorefrontHandler struct{ useCase usecases.AuthUseCase }

func NewAuthStorefrontHandler(useCase usecases.AuthUseCase) *AuthStorefrontHandler {
	return &AuthStorefrontHandler{useCase: useCase}
}

func (h *AuthStorefrontHandler) Login(c *gin.Context) {
	var request struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		writeStorefrontError(c, repositories.ErrBadRequest)
		return
	}
	response, err := h.useCase.Login(c.Request.Context(), request.Email, request.Password)
	if err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusOK, response)
}

func (h *AuthStorefrontHandler) Firebase(c *gin.Context) {
	var request struct {
		IDToken string `json:"idToken"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		writeStorefrontError(c, repositories.ErrBadRequest)
		return
	}
	response, err := h.useCase.LoginWithFirebase(c.Request.Context(), request.IDToken)
	if err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusOK, response)
}

func (h *AuthStorefrontHandler) Refresh(c *gin.Context) {
	var request struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		writeStorefrontError(c, repositories.ErrBadRequest)
		return
	}
	response, err := h.useCase.Refresh(c.Request.Context(), request.RefreshToken)
	if err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusOK, response)
}

func (h *AuthStorefrontHandler) Me(c *gin.Context) {
	principal, ok := middleware.StorefrontPrincipal(c)
	if !ok {
		writeStorefrontError(c, repositories.ErrUnauthorized)
		return
	}
	response, err := h.useCase.Me(c.Request.Context(), principal)
	if err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusOK, response)
}

func (h *AuthStorefrontHandler) Users(c *gin.Context) {
	response, err := h.useCase.ListUsers(c.Request.Context())
	if err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusOK, response)
}
