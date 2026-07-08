package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"trading/observability-api/internal/domain/entities"
	"trading/observability-api/internal/domain/usecases"
)

type RiskLimitsHandler struct {
	useCase usecases.RiskLimitsUseCase
}

func NewRiskLimitsHandler(useCase usecases.RiskLimitsUseCase) *RiskLimitsHandler {
	return &RiskLimitsHandler{useCase: useCase}
}

func (h *RiskLimitsHandler) MapRoutes(group *gin.RouterGroup) {
	group.GET("/risk-limits", h.GetRiskLimits)
	group.POST("/risk-limits", h.UpdateRiskLimits)
}

func (h *RiskLimitsHandler) GetRiskLimits(c *gin.Context) {
	accountIDStr := c.Query("account_id")
	var accountID *string
	if accountIDStr != "" {
		accountID = &accountIDStr
	}

	limits, err := h.useCase.GetRiskLimits(c.Request.Context(), accountID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, limits)
}

func (h *RiskLimitsHandler) UpdateRiskLimits(c *gin.Context) {
	var limits entities.RiskLimits
	if err := c.ShouldBindJSON(&limits); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid risk limits payload: " + err.Error()})
		return
	}

	username := c.Query("updated_by")
	if username == "" {
		username = "admin"
	}

	err := h.useCase.UpdateRiskLimits(c.Request.Context(), &limits, username)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "risk limits updated and broadcasted"})
}
