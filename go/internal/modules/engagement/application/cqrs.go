package application

import (
	"context"

	shared "trading/control-gateway/internal/shared/application"
)

type NotificationFeedQuery struct{ Principal shared.Principal }
type NotificationFeedHandler struct{ service *Service }

func NewNotificationFeedHandler(service *Service) NotificationFeedHandler {
	return NotificationFeedHandler{service: service}
}
func (h NotificationFeedHandler) Handle(ctx context.Context, query NotificationFeedQuery) ([]Notification, error) {
	return h.service.Notifications(ctx, query.Principal)
}

type MarkNotificationReadCommand struct {
	NotificationID string
	Principal      shared.Principal
}
type MarkNotificationReadHandler struct{ service *Service }

func NewMarkNotificationReadHandler(service *Service) MarkNotificationReadHandler {
	return MarkNotificationReadHandler{service: service}
}
func (h MarkNotificationReadHandler) Handle(ctx context.Context, command MarkNotificationReadCommand) (struct{}, error) {
	return struct{}{}, h.service.MarkNotificationRead(ctx, command.NotificationID, command.Principal)
}
