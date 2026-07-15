package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"trading/control-gateway/internal/domain/entities"
)

var (
	ErrBadRequest   = errors.New("bad request")
	ErrUnauthorized = errors.New("unauthorized")
	ErrForbidden    = errors.New("forbidden")
	ErrNotFound     = errors.New("not found")
	ErrConflict     = errors.New("conflict")
	ErrUnavailable  = errors.New("service unavailable")
)

type FirebaseUser struct {
	LocalID     string
	Email       string
	DisplayName string
	PhotoURL    string
	ProviderID  string
}

type FirebaseAuthProvider interface {
	AuthenticatePassword(ctx context.Context, email, password string) (FirebaseUser, error)
	VerifyIDToken(ctx context.Context, idToken string) (FirebaseUser, error)
}

type AuthRepository interface {
	UpsertFirebaseUser(ctx context.Context, firebaseUser FirebaseUser) (entities.User, error)
	CreateSession(ctx context.Context, userID uuid.UUID, tokenHash string, now time.Time) error
	RotateSession(ctx context.Context, oldHash, newHash string, refreshTTL time.Duration, now time.Time) (entities.User, error)
	FindUserByID(ctx context.Context, userID uuid.UUID) (UserView, error)
	ListUsers(ctx context.Context) ([]UserView, error)
}

type UserView struct {
	ID        string     `json:"id"`
	Email     *string    `json:"email"`
	Phone     *string    `json:"phone"`
	SocialID  *string    `json:"socialId,omitempty"`
	FirstName *string    `json:"firstName,omitempty"`
	LastName  *string    `json:"lastName,omitempty"`
	FullName  *string    `json:"fullName,omitempty"`
	PhotoURL  *string    `json:"photoUrl,omitempty"`
	UserType  string     `json:"userType"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt *time.Time `json:"updatedAt,omitempty"`
}
