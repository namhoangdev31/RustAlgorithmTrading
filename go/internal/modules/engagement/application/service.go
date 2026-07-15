package application

import (
	"context"
	"time"

	"github.com/google/uuid"

	"trading/control-gateway/internal/shared/apperror"
	shared "trading/control-gateway/internal/shared/application"
)

type Notification struct {
	ID        string
	Title     string
	Body      string
	Type      string
	IsRead    bool
	CreatedAt time.Time
}

type Repository interface {
	ListNotifications(context.Context, uuid.UUID) ([]Notification, error)
	MarkNotificationRead(context.Context, string, uuid.UUID, time.Time) error
}

type Service struct {
	repo Repository
	now  func() time.Time
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo, now: func() time.Time { return time.Now().UTC() }}
}

func (s *Service) Notifications(ctx context.Context, principal shared.Principal) ([]Notification, error) {
	userID, err := uuid.Parse(principal.UserID)
	if err != nil {
		return nil, apperror.ErrUnauthorized
	}
	return s.repo.ListNotifications(ctx, userID)
}

func (s *Service) MarkNotificationRead(ctx context.Context, notificationID string, principal shared.Principal) error {
	userID, err := uuid.Parse(principal.UserID)
	if err != nil {
		return apperror.ErrUnauthorized
	}
	return s.repo.MarkNotificationRead(ctx, notificationID, userID, s.now())
}
