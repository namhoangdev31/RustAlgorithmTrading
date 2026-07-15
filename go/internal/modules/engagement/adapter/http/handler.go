package httpadapter

import (
	"net/http"

	"github.com/gin-gonic/gin"

	engagement "trading/control-gateway/internal/modules/engagement/application"
	"trading/control-gateway/internal/platform/httpx"
	"trading/control-gateway/internal/shared/apperror"
)

type Handler struct {
	feed     engagement.NotificationFeedHandler
	markRead engagement.MarkNotificationReadHandler
}

func New(service *engagement.Service) *Handler {
	return &Handler{feed: engagement.NewNotificationFeedHandler(service), markRead: engagement.NewMarkNotificationReadHandler(service)}
}

func (h *Handler) Notifications(c *gin.Context) {
	principal, ok := httpx.Principal(c)
	if !ok {
		httpx.WriteError(c, apperror.ErrUnauthorized)
		return
	}
	notifications, err := h.feed.Handle(c.Request.Context(), engagement.NotificationFeedQuery{Principal: principal})
	if err != nil {
		httpx.WriteError(c, err)
		return
	}
	response := make([]gin.H, 0, len(notifications))
	for _, item := range notifications {
		response = append(response, gin.H{"id": item.ID, "title": item.Title, "body": item.Body, "type": item.Type, "isRead": item.IsRead, "createdAt": item.CreatedAt})
	}
	c.JSON(http.StatusOK, response)
}

func (h *Handler) MarkRead(c *gin.Context) {
	principal, ok := httpx.Principal(c)
	if !ok {
		httpx.WriteError(c, apperror.ErrUnauthorized)
		return
	}
	if _, err := h.markRead.Handle(c.Request.Context(), engagement.MarkNotificationReadCommand{NotificationID: c.Param("id"), Principal: principal}); err != nil {
		httpx.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{})
}
