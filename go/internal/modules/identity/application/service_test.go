package application

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"

	"trading/control-gateway/internal/modules/identity/domain"
	"trading/control-gateway/internal/shared/apperror"
)

func TestAccessTokenSignatureAndExpiry(t *testing.T) {
	userID := uuid.New()
	email := "pilot@example.com"
	repo := &identityRepositoryFake{user: domain.User{ID: userID, Email: &email, UserType: "admin"}}
	service := NewService(repo, firebaseFake{}, Config{SigningSecret: "01234567890123456789012345678901", Issuer: "issuer", Audience: "audience", AccessTTL: time.Minute, RefreshTTL: time.Hour})
	now := time.Now().UTC()
	service.now = func() time.Time { return now }

	tokens, err := service.LoginWithFirebase(context.Background(), "firebase-id-token")
	if err != nil {
		t.Fatal(err)
	}
	principal, err := service.VerifyAccessToken(tokens.AccessToken)
	if err != nil {
		t.Fatal(err)
	}
	if principal.UserID != userID.String() || principal.UserType != "admin" {
		t.Fatalf("unexpected principal: %#v", principal)
	}

	service.config.SigningSecret = "abcdefghijklmnopqrstuvwxyz123456"
	if _, err := service.VerifyAccessToken(tokens.AccessToken); !apperror.IsCode(err, apperror.CodeUnauthorized) {
		t.Fatalf("expected bad signature to be unauthorized, got %v", err)
	}
	service.config.SigningSecret = "01234567890123456789012345678901"
	expired, err := service.signAccessToken(repo.user, now.Add(-2*time.Minute))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := service.VerifyAccessToken(expired); !apperror.IsCode(err, apperror.CodeUnauthorized) {
		t.Fatalf("expected expired token to be unauthorized, got %v", err)
	}
}

type firebaseFake struct{}

func (firebaseFake) VerifyIDToken(context.Context, string) (FirebaseUser, error) {
	return FirebaseUser{LocalID: "firebase-user", Email: "pilot@example.com"}, nil
}

type identityRepositoryFake struct{ user domain.User }

func (r *identityRepositoryFake) UpsertFirebaseUser(context.Context, FirebaseUser) (domain.User, error) {
	return r.user, nil
}
func (r *identityRepositoryFake) CreateSession(context.Context, uuid.UUID, string, time.Time) error {
	return nil
}
func (r *identityRepositoryFake) RotateSession(context.Context, string, string, time.Duration, time.Time) (domain.User, error) {
	return r.user, nil
}
func (r *identityRepositoryFake) FindUserByID(context.Context, uuid.UUID) (UserView, error) {
	return UserView{ID: r.user.ID.String()}, nil
}
func (r *identityRepositoryFake) ListUsers(context.Context) ([]UserView, error) { return nil, nil }
