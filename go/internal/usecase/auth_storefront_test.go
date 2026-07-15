package usecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	"trading/control-gateway/internal/domain/entities"
	"trading/control-gateway/internal/domain/repositories"
)

func TestAuthServiceLoginStoresOnlyRefreshHashAndIssuesJWT(t *testing.T) {
	userID := uuid.New()
	email := "user@example.com"
	repo := &fakeAuthRepository{user: entities.User{ID: userID, Email: &email, Provider: "firebase", UserType: "admin"}}
	firebase := fakeFirebaseProvider{user: repositories.FirebaseUser{LocalID: "firebase-user", Email: email}}
	service := NewAuthService(repo, firebase, AuthConfig{SigningSecret: "01234567890123456789012345678901", Issuer: "issuer", Audience: "audience", AccessTTL: 15 * time.Minute, RefreshTTL: 30 * 24 * time.Hour})

	response, err := service.Login(context.Background(), email, "password")
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}
	if response.ExpiresIn != 900 || response.AccessToken == "" || response.RefreshToken == "" {
		t.Fatalf("unexpected token response: %+v", response)
	}
	if repo.createdHash == "" || repo.createdHash == response.RefreshToken || len(repo.createdHash) != 64 {
		t.Fatalf("refresh token was not stored as sha256: %q", repo.createdHash)
	}
	principal, err := service.VerifyAccessToken(response.AccessToken)
	if err != nil {
		t.Fatalf("verify access token: %v", err)
	}
	if principal.UserID != userID.String() || principal.Email != email || principal.UserType != "admin" {
		t.Fatalf("unexpected principal: %+v", principal)
	}
}

func TestAuthServiceRefreshRotatesAndRejectsReplay(t *testing.T) {
	userID := uuid.New()
	email := "user@example.com"
	repo := &fakeAuthRepository{user: entities.User{ID: userID, Email: &email, Provider: "firebase", UserType: "individual"}}
	service := NewAuthService(repo, fakeFirebaseProvider{}, AuthConfig{SigningSecret: "01234567890123456789012345678901"})
	repo.expectedOldHash = tokenHash("first-refresh")

	response, err := service.Refresh(context.Background(), "first-refresh")
	if err != nil {
		t.Fatalf("refresh failed: %v", err)
	}
	if response.RefreshToken == "first-refresh" || repo.rotatedHash != tokenHash(response.RefreshToken) {
		t.Fatalf("refresh was not rotated")
	}
	if _, err := service.Refresh(context.Background(), "first-refresh"); !errors.Is(err, repositories.ErrUnauthorized) {
		t.Fatalf("expected replay rejection, got %v", err)
	}
}

func TestAuthServiceRejectsExpiredAccessToken(t *testing.T) {
	repo := &fakeAuthRepository{}
	service := NewAuthService(repo, fakeFirebaseProvider{}, AuthConfig{SigningSecret: "01234567890123456789012345678901", AccessTTL: time.Minute})
	issuedAt := time.Now().UTC().Add(-2 * time.Minute)
	service.now = func() time.Time { return issuedAt }
	email := "expired@example.com"
	repo.user = entities.User{ID: uuid.New(), Email: &email, Provider: "firebase", UserType: "individual"}
	response, err := service.issueNewSession(context.Background(), repo.user)
	if err != nil {
		t.Fatalf("issue token: %v", err)
	}
	if _, err := service.VerifyAccessToken(response.AccessToken); !errors.Is(err, repositories.ErrUnauthorized) {
		t.Fatalf("expected expired token rejection, got %v", err)
	}
}

type fakeFirebaseProvider struct {
	user repositories.FirebaseUser
	err  error
}

func (f fakeFirebaseProvider) AuthenticatePassword(context.Context, string, string) (repositories.FirebaseUser, error) {
	return f.user, f.err
}
func (f fakeFirebaseProvider) VerifyIDToken(context.Context, string) (repositories.FirebaseUser, error) {
	return f.user, f.err
}

type fakeAuthRepository struct {
	user                                      entities.User
	createdHash, expectedOldHash, rotatedHash string
	rotated                                   bool
}

func (f *fakeAuthRepository) UpsertFirebaseUser(context.Context, repositories.FirebaseUser) (entities.User, error) {
	return f.user, nil
}
func (f *fakeAuthRepository) CreateSession(_ context.Context, _ uuid.UUID, hash string, _ time.Time) error {
	f.createdHash = hash
	return nil
}
func (f *fakeAuthRepository) RotateSession(_ context.Context, oldHash, newHash string, _ time.Duration, _ time.Time) (entities.User, error) {
	if f.rotated || oldHash != f.expectedOldHash {
		return entities.User{}, repositories.ErrUnauthorized
	}
	f.rotated, f.rotatedHash = true, newHash
	return f.user, nil
}
func (f *fakeAuthRepository) FindUserByID(context.Context, uuid.UUID) (repositories.UserView, error) {
	return repositories.UserView{ID: f.user.ID.String()}, nil
}
func (f *fakeAuthRepository) ListUsers(context.Context) ([]repositories.UserView, error) {
	return []repositories.UserView{}, nil
}
