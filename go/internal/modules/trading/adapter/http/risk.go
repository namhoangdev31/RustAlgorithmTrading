package httpadapter

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"trading/control-gateway/internal/modules/trading/application"
	domain "trading/control-gateway/internal/modules/trading/domain"
)

type RiskLimitsHandler struct {
	useCase application.RiskLimitsUseCase
}

func NewRiskLimitsHandler(useCase application.RiskLimitsUseCase) *RiskLimitsHandler {
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
	c.JSON(http.StatusOK, riskLimitsPayload(*limits))
}

func (h *RiskLimitsHandler) UpdateRiskLimits(c *gin.Context) {
	var payload riskLimitsPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid risk limits payload: " + err.Error()})
		return
	}

	username := c.Query("updated_by")
	if username == "" {
		username = "admin"
	}

	limits := domain.RiskLimits(payload)
	err := h.useCase.UpdateRiskLimits(c.Request.Context(), &limits, username)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "risk limits updated and broadcasted"})
}
