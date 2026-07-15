package firebase

import (
	"context"
	"errors"
	"testing"

	"firebase.google.com/go/v4/auth"

	"trading/control-gateway/internal/shared/apperror"
)

func TestVerifyIDTokenMapsFirebaseUser(t *testing.T) {
	client := NewClientWithAuth(fakeAuthClient{
		token: &auth.Token{UID: "firebase-user"},
		user: &auth.UserRecord{
			UserInfo: &auth.UserInfo{
				UID:         "firebase-user",
				Email:       "pilot@example.com",
				DisplayName: "Pilot User",
				PhotoURL:    "https://example.com/avatar.png",
			},
			ProviderUserInfo: []*auth.UserInfo{{ProviderID: "google.com"}},
		},
	})

	user, err := client.VerifyIDToken(context.Background(), "firebase-id-token")
	if err != nil {
		t.Fatal(err)
	}
	if user.LocalID != "firebase-user" || user.Email != "pilot@example.com" || user.ProviderID != "google.com" {
		t.Fatalf("unexpected firebase user: %#v", user)
	}
}

func TestVerifyIDTokenMapsAdminErrorsToUnavailable(t *testing.T) {
	client := NewClientWithAuth(fakeAuthClient{verifyErr: errors.New("admin sdk unavailable")})
	if _, err := client.VerifyIDToken(context.Background(), "firebase-id-token"); !apperror.IsCode(err, apperror.CodeUnavailable) {
		t.Fatalf("expected unavailable, got %v", err)
	}
}

func TestVerifyIDTokenRequiresConfiguredClient(t *testing.T) {
	client := NewClientWithAuth(nil)
	if _, err := client.VerifyIDToken(context.Background(), "firebase-id-token"); !apperror.IsCode(err, apperror.CodeUnavailable) {
		t.Fatalf("expected unavailable, got %v", err)
	}
}

type fakeAuthClient struct {
	token     *auth.Token
	user      *auth.UserRecord
	verifyErr error
	userErr   error
}

func (f fakeAuthClient) VerifyIDToken(context.Context, string) (*auth.Token, error) {
	return f.token, f.verifyErr
}

func (f fakeAuthClient) GetUser(context.Context, string) (*auth.UserRecord, error) {
	return f.user, f.userErr
}
