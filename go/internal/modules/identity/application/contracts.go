package application

import (
	"context"
	"time"

	"github.com/google/uuid"

	"trading/control-gateway/internal/modules/identity/domain"
	shared "trading/control-gateway/internal/shared/application"
)

type Principal = shared.Principal

type TokenResponse struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    int
}

type FirebaseUser struct {
	LocalID     string
	Email       string
	DisplayName string
	PhotoURL    string
	ProviderID  string
}

type UserView struct {
	ID        string
	Email     *string
	Phone     *string
	SocialID  *string
	FirstName *string
	LastName  *string
	FullName  *string
	PhotoURL  *string
	UserType  string
	CreatedAt time.Time
	UpdatedAt *time.Time
}

type FirebaseProvider interface {
	VerifyIDToken(context.Context, string) (FirebaseUser, error)
}

type Repository interface {
	UpsertFirebaseUser(context.Context, FirebaseUser) (domain.User, error)
	CreateSession(context.Context, uuid.UUID, string, time.Time) error
	RotateSession(context.Context, string, string, time.Duration, time.Time) (domain.User, error)
	FindUserByID(context.Context, uuid.UUID) (UserView, error)
	ListUsers(context.Context) ([]UserView, error)
}

type Commands interface {
	LoginWithFirebase(context.Context, string) (TokenResponse, error)
	Refresh(context.Context, string) (TokenResponse, error)
}

type Queries interface {
	Me(context.Context, Principal) (UserView, error)
	ListUsers(context.Context) ([]UserView, error)
	VerifyAccessToken(string) (Principal, error)
}

type ServicePort interface {
	Commands
	Queries
}
