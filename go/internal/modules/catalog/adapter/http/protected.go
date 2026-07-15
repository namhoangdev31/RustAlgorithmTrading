package httpadapter

import (
	"net/http"

	"github.com/gin-gonic/gin"

	catalog "trading/control-gateway/internal/modules/catalog/application"
	"trading/control-gateway/internal/platform/httpx"
	"trading/control-gateway/internal/shared/apperror"
)

func (h *Handler) CreateReview(c *gin.Context) {
	var request struct {
		Rating   int    `json:"rating"`
		Title    string `json:"title"`
		Content  string `json:"content"`
		Nickname string `json:"nickname"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		httpx.WriteError(c, apperror.ErrInvalidArgument)
		return
	}
	principal, ok := httpx.Principal(c)
	if !ok {
		httpx.WriteError(c, apperror.ErrUnauthorized)
		return
	}
	response, err := h.useCase.CreateReview(c.Request.Context(), c.Param("id"), principal, catalog.CreateReviewInput{Rating: request.Rating, Title: request.Title, Content: request.Content})
	if err != nil {
		httpx.WriteError(c, err)
		return
	}
	c.JSON(http.StatusCreated, response)
}

func (h *Handler) ReportReview(c *gin.Context) {
	var request struct {
		Reason      string `json:"reason"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		httpx.WriteError(c, apperror.ErrInvalidArgument)
		return
	}
	principal, ok := httpx.Principal(c)
	if !ok {
		httpx.WriteError(c, apperror.ErrUnauthorized)
		return
	}
	response, err := h.useCase.CreateReviewReport(c.Request.Context(), c.Param("id"), principal, catalog.CreateReportInput{Reason: request.Reason, Description: request.Description})
	if err != nil {
		httpx.WriteError(c, err)
		return
	}
	c.JSON(http.StatusCreated, response)
}

func (h *Handler) DownloadURL(c *gin.Context) {
	url, err := h.useCase.DownloadURL(c.Request.Context(), c.Param("id"))
	if err != nil {
		httpx.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"downloadUrl": url})
}

func (h *Handler) TrackDownload(c *gin.Context) {
	principal, ok := httpx.Principal(c)
	if !ok {
		httpx.WriteError(c, apperror.ErrUnauthorized)
		return
	}
	if err := h.useCase.TrackDownload(c.Request.Context(), c.Param("id"), principal); err != nil {
		httpx.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{})
}

func (h *Handler) CheckUpdates(c *gin.Context) {
	var request []catalog.InstalledBundle
	if err := c.ShouldBindJSON(&request); err != nil {
		httpx.WriteError(c, apperror.ErrInvalidArgument)
		return
	}
	response, err := h.useCase.CheckUpdates(c.Request.Context(), request)
	if err != nil {
		httpx.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, response)
}
