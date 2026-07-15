package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/middleware"
)

func (h *StorefrontHandler) CreateReview(c *gin.Context) {
	var request struct {
		Rating   int    `json:"rating"`
		Title    string `json:"title"`
		Content  string `json:"content"`
		Nickname string `json:"nickname"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		writeStorefrontError(c, repositories.ErrBadRequest)
		return
	}
	principal, ok := middleware.StorefrontPrincipal(c)
	if !ok {
		writeStorefrontError(c, repositories.ErrUnauthorized)
		return
	}
	response, err := h.useCase.CreateReview(c.Request.Context(), c.Param("id"), principal, repositories.CreateReviewInput{Rating: request.Rating, Title: request.Title, Content: request.Content})
	if err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusCreated, response)
}

func (h *StorefrontHandler) ReportReview(c *gin.Context) {
	var request struct {
		Reason      string `json:"reason"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		writeStorefrontError(c, repositories.ErrBadRequest)
		return
	}
	principal, ok := middleware.StorefrontPrincipal(c)
	if !ok {
		writeStorefrontError(c, repositories.ErrUnauthorized)
		return
	}
	response, err := h.useCase.CreateReviewReport(c.Request.Context(), c.Param("id"), principal, repositories.CreateReportInput{Reason: request.Reason, Description: request.Description})
	if err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusCreated, response)
}

func (h *StorefrontHandler) DownloadURL(c *gin.Context) {
	url, err := h.useCase.DownloadURL(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"downloadUrl": url})
}

func (h *StorefrontHandler) TrackDownload(c *gin.Context) {
	principal, ok := middleware.StorefrontPrincipal(c)
	if !ok {
		writeStorefrontError(c, repositories.ErrUnauthorized)
		return
	}
	if err := h.useCase.TrackDownload(c.Request.Context(), c.Param("id"), principal); err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{})
}

func (h *StorefrontHandler) CheckUpdates(c *gin.Context) {
	var request []repositories.InstalledBundle
	if err := c.ShouldBindJSON(&request); err != nil {
		writeStorefrontError(c, repositories.ErrBadRequest)
		return
	}
	response, err := h.useCase.CheckUpdates(c.Request.Context(), request)
	if err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusOK, response)
}

func (h *StorefrontHandler) Notifications(c *gin.Context) {
	principal, ok := middleware.StorefrontPrincipal(c)
	if !ok {
		writeStorefrontError(c, repositories.ErrUnauthorized)
		return
	}
	response, err := h.useCase.Notifications(c.Request.Context(), principal)
	if err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusOK, response)
}

func (h *StorefrontHandler) MarkNotificationRead(c *gin.Context) {
	principal, ok := middleware.StorefrontPrincipal(c)
	if !ok {
		writeStorefrontError(c, repositories.ErrUnauthorized)
		return
	}
	if err := h.useCase.MarkNotificationRead(c.Request.Context(), c.Param("id"), principal); err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{})
}

func (h *StorefrontHandler) PaymentMethods(c *gin.Context) {
	response, err := h.useCase.PaymentMethods(c.Request.Context())
	if err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusOK, response)
}

func (h *StorefrontHandler) SavePaymentMethod(c *gin.Context) {
	var request struct {
		CardToken string `json:"cardToken"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		writeStorefrontError(c, repositories.ErrBadRequest)
		return
	}
	response, err := h.useCase.SavePaymentMethod(c.Request.Context(), request.CardToken)
	if err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusCreated, response)
}

func (h *StorefrontHandler) Checkout(c *gin.Context) {
	var request struct {
		BundleID        string `json:"bundleId"`
		PaymentMethodID string `json:"paymentMethodId"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		writeStorefrontError(c, repositories.ErrBadRequest)
		return
	}
	principal, ok := middleware.StorefrontPrincipal(c)
	if !ok {
		writeStorefrontError(c, repositories.ErrUnauthorized)
		return
	}
	response, err := h.useCase.Checkout(c.Request.Context(), principal, request.BundleID, request.PaymentMethodID, c.GetHeader("Idempotency-Key"))
	if err != nil {
		writeStorefrontError(c, err)
		return
	}
	c.JSON(http.StatusOK, response)
}
