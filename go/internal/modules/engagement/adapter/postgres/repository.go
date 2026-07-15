package postgres

import (
	"context"
	"fmt"
	"time"

	"entgo.io/ent/dialect/sql"
	"github.com/google/uuid"

	entdb "trading/control-gateway/internal/data/ent"
	"trading/control-gateway/internal/data/ent/notifications"
	engagement "trading/control-gateway/internal/modules/engagement/application"
	"trading/control-gateway/internal/shared/apperror"
)

type Repository struct{ client *entdb.Client }

func New(client *entdb.Client) (*Repository, error) {
	if client == nil {
		return nil, apperror.WithMessage(apperror.ErrUnavailable, "engagement database is not configured")
	}
	return &Repository{client: client}, nil
}

func (r *Repository) ListNotifications(ctx context.Context, userID uuid.UUID) ([]engagement.Notification, error) {
	rows, err := r.client.Notifications.Query().
		Where(notifications.RecipientIdEQ(userID), notifications.DeletedAtIsNil()).
		Order(notifications.ByCreatedAt(sql.OrderDesc()), notifications.ByID()).
		Limit(200).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("list notifications: %w", err)
	}
	result := make([]engagement.Notification, 0, len(rows))
	for _, row := range rows {
		body := ""
		if row.Body != nil {
			body = *row.Body
		}
		result = append(result, engagement.Notification{
			ID: row.ID.String(), Title: row.Title, Body: body, Type: row.Type,
			IsRead: row.IsRead, CreatedAt: row.CreatedAt,
		})
	}
	return result, nil
}

func (r *Repository) MarkNotificationRead(ctx context.Context, notificationID string, userID uuid.UUID, now time.Time) error {
	id, err := uuid.Parse(notificationID)
	if err != nil {
		return apperror.WithMessage(apperror.ErrInvalidArgument, "invalid notification id")
	}
	count, err := r.client.Notifications.Update().
		Where(notifications.IDEQ(id), notifications.RecipientIdEQ(userID), notifications.DeletedAtIsNil()).
		SetIsRead(true).SetReadAt(now).SetUpdatedAt(now).Save(ctx)
	if err != nil {
		return fmt.Errorf("mark notification read: %w", err)
	}
	if count == 0 {
		return apperror.ErrNotFound
	}
	return nil
}
