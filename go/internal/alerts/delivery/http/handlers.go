package http

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"trading/observability-api/internal/alerts"
)

type AlertsHandlers struct {
	manager *alerts.Manager
}

func NewAlertsHandlers(manager *alerts.Manager) *AlertsHandlers {
	return &AlertsHandlers{manager: manager}
}

func (h *AlertsHandlers) MapRoutes(group *gin.RouterGroup) {
	group.GET("/incidents", h.ListIncidents)
	group.POST("/incidents", h.CreateIncident)
	group.POST("/incidents/:incident_id/acknowledge", h.AcknowledgeIncident)
	group.POST("/incidents/:incident_id/resolve", h.ResolveIncident)
	group.POST("/alerts/acknowledge/:alert_id", h.AcknowledgeAlert)
}

func (h *AlertsHandlers) ListIncidents(c *gin.Context) {
	payload := gin.H{}
	for k, v := range h.manager.List() {
		payload[k] = v
	}
	c.JSON(http.StatusOK, payload)
}

func (h *AlertsHandlers) CreateIncident(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid request body"})
		return
	}
	inc := h.manager.Create(req)
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

func (h *AlertsHandlers) AcknowledgeIncident(c *gin.Context) {
	id := c.Param("incident_id")
	owner := c.Query("owner")
	if owner == "" {
		owner = "ops"
	}
	inc, err := h.manager.Acknowledge(id, owner)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"incident_id": inc.ID, "status": inc.Status, "owner": inc.Owner, "updated_at": inc.UpdatedAt,
	})
}

func (h *AlertsHandlers) ResolveIncident(c *gin.Context) {
	id := c.Param("incident_id")
	evidence := c.Query("evidence")
	inc, err := h.manager.Resolve(id, evidence)
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

func (h *AlertsHandlers) AcknowledgeAlert(c *gin.Context) {
	alertID := c.Param("alert_id")
	c.JSON(http.StatusOK, gin.H{
		"status":   "acknowledged",
		"alert_id": alertID,
	})
}
