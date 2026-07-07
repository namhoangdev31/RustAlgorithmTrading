package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"trading/observability-api/internal/domain/usecases"
)

// AlertHandler handles HTTP requests relating to alerts and incidents.
type AlertHandler struct {
	useCase usecases.AlertUseCase
}

// NewAlertHandler creates a new instance of AlertHandler.
func NewAlertHandler(useCase usecases.AlertUseCase) *AlertHandler {
	return &AlertHandler{useCase: useCase}
}

// MapRoutes registers alert endpoints.
func (h *AlertHandler) MapRoutes(group *gin.RouterGroup) {
	group.GET("/incidents", h.ListIncidents)
	group.POST("/incidents", h.CreateIncident)
	group.POST("/incidents/:incident_id/acknowledge", h.AcknowledgeIncident)
	group.POST("/incidents/:incident_id/resolve", h.ResolveIncident)
	group.POST("/alerts/acknowledge/:alert_id", h.AcknowledgeAlert)
}

func (h *AlertHandler) ListIncidents(c *gin.Context) {
	payload := gin.H{}
	for k, v := range h.useCase.ListIncidents() {
		payload[k] = v
	}
	c.JSON(http.StatusOK, payload)
}

func (h *AlertHandler) CreateIncident(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid request body"})
		return
	}
	inc := h.useCase.CreateIncident(req)
	c.JSON(http.StatusCreated, gin.H{
		"incident_id":    inc.ID,
		"severity":       inc.Severity,
		"component":      inc.Component,
		"reason_code":    inc.ReasonCode,
		"correlation_id": inc.CorrelationID,
		"status":         inc.Status,
		"owner":          inc.Owner,
		"evidence":       inc.Evidence,
		"created_at":     inc.CreatedAt,
		"updated_at":     inc.UpdatedAt,
	})
}

func (h *AlertHandler) AcknowledgeIncident(c *gin.Context) {
	id := c.Param("incident_id")
	owner := c.Query("owner")
	if owner == "" {
		owner = "ops"
	}
	inc, err := h.useCase.AcknowledgeIncident(id, owner)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"incident_id": inc.ID, "status": inc.Status, "owner": inc.Owner, "updated_at": inc.UpdatedAt,
	})
}

func (h *AlertHandler) ResolveIncident(c *gin.Context) {
	id := c.Param("incident_id")
	evidence := c.Query("evidence")
	inc, err := h.useCase.ResolveIncident(id, evidence)
	if err != nil {
		code := http.StatusBadRequest
		if err.Error() == "incident not found" {
			code = http.StatusNotFound
		}
		c.JSON(code, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"incident_id": inc.ID, "status": inc.Status, "evidence": inc.Evidence, "updated_at": inc.UpdatedAt,
	})
}

func (h *AlertHandler) AcknowledgeAlert(c *gin.Context) {
	alertID := c.Param("alert_id")
	resp, err := h.useCase.AcknowledgeAlert(alertID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}
