package httpadapter

import (
	"net/http"

	"github.com/gin-gonic/gin"

	catalog "trading/control-gateway/internal/modules/catalog/application"
	"trading/control-gateway/internal/platform/httpx"
	"trading/control-gateway/internal/shared/apperror"
)

type Handler struct{ useCase *catalog.Service }

func NewHandler(useCase *catalog.Service) *Handler {
	return &Handler{useCase: useCase}
}

func (h *Handler) Bundles(c *gin.Context) {
	value, err := h.useCase.ListBundles(c.Request.Context())
	h.write(c, value, err)
}
func (h *Handler) Featured(c *gin.Context) {
	value, err := h.useCase.Featured(c.Request.Context())
	h.write(c, value, err)
}
func (h *Handler) AppsWeLove(c *gin.Context) {
	value, err := h.useCase.AppsWeLove(c.Request.Context())
	h.write(c, value, err)
}
func (h *Handler) Collections(c *gin.Context) {
	value, err := h.useCase.Collections(c.Request.Context())
	h.write(c, value, err)
}
func (h *Handler) Stats(c *gin.Context) {
	value, err := h.useCase.BundleStats(c.Request.Context(), c.Param("id"))
	h.write(c, value, err)
}
func (h *Handler) Promotions(c *gin.Context) {
	value, err := h.useCase.Promotions(c.Request.Context(), c.Param("id"))
	h.write(c, value, err)
}
func (h *Handler) Reviews(c *gin.Context) {
	value, err := h.useCase.Reviews(c.Request.Context(), c.Param("id"))
	h.write(c, value, err)
}

func (h *Handler) Personalized(c *gin.Context) {
	principal, ok := httpx.Principal(c)
	if !ok {
		httpx.WriteError(c, apperror.ErrUnauthorized)
		return
	}
	value, err := h.useCase.Personalized(c.Request.Context(), principal)
	h.write(c, value, err)
}

func (h *Handler) write(c *gin.Context, value any, err error) {
	if err != nil {
		httpx.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, value)
}
