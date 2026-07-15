package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/domain/usecases"
	"trading/control-gateway/internal/middleware"
)

type StorefrontHandler struct{ useCase usecases.StorefrontUseCase }

func NewStorefrontHandler(useCase usecases.StorefrontUseCase) *StorefrontHandler {
	return &StorefrontHandler{useCase: useCase}
}

func (h *StorefrontHandler) Bundles(c *gin.Context) {
	value, err := h.useCase.ListBundles(c.Request.Context())
	h.write(c, value, err)
}
func (h *StorefrontHandler) Featured(c *gin.Context) {
	value, err := h.useCase.Featured(c.Request.Context())
	h.write(c, value, err)
}
func (h *StorefrontHandler) AppsWeLove(c *gin.Context) {
	value, err := h.useCase.AppsWeLove(c.Request.Context())
	h.write(c, value, err)
}
func (h *StorefrontHandler) Collections(c *gin.Context) {
	value, err := h.useCase.Collections(c.Request.Context())
	h.write(c, value, err)
}
func (h *StorefrontHandler) Stats(c *gin.Context) {
	value, err := h.useCase.BundleStats(c.Request.Context(), c.Param("id"))
	h.write(c, value, err)
}
func (h *StorefrontHandler) Promotions(c *gin.Context) {
	value, err := h.useCase.Promotions(c.Request.Context(), c.Param("id"))
	h.write(c, value, err)
}
func (h *StorefrontHandler) Reviews(c *gin.Context) {
	value, err := h.useCase.Reviews(c.Request.Context(), c.Param("id"))
	h.write(c, value, err)
}

func (h *StorefrontHandler) Personalized(c *gin.Context) {
	principal, ok := middleware.StorefrontPrincipal(c)
	if !ok {
		writeStorefrontError(c, repositories.ErrUnauthorized)
		return
	}
	value, err := h.useCase.Personalized(c.Request.Context(), principal)
	h.write(c, value, err)
}

func (h *StorefrontHandler) write(c *gin.Context, value any, err error) {
	if err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusOK, value)
}
