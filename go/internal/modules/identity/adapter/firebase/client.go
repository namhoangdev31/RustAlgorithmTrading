package firebase

import (
	"context"
	"errors"
	"fmt"
	"strings"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"

	application "trading/control-gateway/internal/modules/identity/application"
	"trading/control-gateway/internal/shared/apperror"
)

type Config struct {
	CredentialsFile string
	ProjectID       string
}

type authClient interface {
	VerifyIDToken(context.Context, string) (*auth.Token, error)
	GetUser(context.Context, string) (*auth.UserRecord, error)
}

type Client struct {
	auth authClient
}

func NewClient(ctx context.Context, cfg Config) (*Client, error) {
	opts := make([]option.ClientOption, 0, 1)
	if strings.TrimSpace(cfg.CredentialsFile) != "" {
		opts = append(opts, option.WithCredentialsFile(strings.TrimSpace(cfg.CredentialsFile)))
	}
	appCfg := &firebase.Config{}
	if strings.TrimSpace(cfg.ProjectID) != "" {
		appCfg.ProjectID = strings.TrimSpace(cfg.ProjectID)
	}
	app, err := firebase.NewApp(ctx, appCfg, opts...)
	if err != nil {
		return nil, fmt.Errorf("initialize firebase admin app: %w", err)
	}
	authClient, err := app.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("initialize firebase auth client: %w", err)
	}
	return NewClientWithAuth(authClient), nil
}

func NewClientWithAuth(auth authClient) *Client {
	return &Client{auth: auth}
}

func (c *Client) VerifyIDToken(ctx context.Context, idToken string) (application.FirebaseUser, error) {
	if c.auth == nil {
		return application.FirebaseUser{}, apperror.WithMessage(apperror.ErrUnavailable, "firebase auth client is not configured")
	}
	token, err := c.auth.VerifyIDToken(ctx, strings.TrimSpace(idToken))
	if err != nil {
		return application.FirebaseUser{}, mapAuthError(err)
	}
	if token == nil || token.UID == "" {
		return application.FirebaseUser{}, apperror.ErrUnauthorized
	}
	user, err := c.auth.GetUser(ctx, token.UID)
	if err != nil {
		return application.FirebaseUser{}, mapAuthError(err)
	}
	if user == nil || user.UID == "" {
		return application.FirebaseUser{}, apperror.ErrUnauthorized
	}
	return firebaseUserFromRecord(user), nil
}

func mapAuthError(err error) error {
	if err == nil {
		return nil
	}
	if auth.IsIDTokenExpired(err) || auth.IsIDTokenInvalid(err) || auth.IsUserNotFound(err) {
		return apperror.ErrUnauthorized
	}
	if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
		return apperror.Wrap(apperror.CodeUnavailable, "firebase auth request failed", err)
	}
	return apperror.Wrap(apperror.CodeUnavailable, "firebase auth request failed", err)
}

func firebaseUserFromRecord(record *auth.UserRecord) application.FirebaseUser {
	provider := "firebase"
	if record.UserInfo != nil && record.UserInfo.ProviderID != "" {
		provider = record.UserInfo.ProviderID
	}
	if provider == "firebase" && len(record.ProviderUserInfo) > 0 && record.ProviderUserInfo[0].ProviderID != "" {
		provider = record.ProviderUserInfo[0].ProviderID
	}
	return application.FirebaseUser{
		LocalID:     record.UID,
		Email:       record.Email,
		DisplayName: record.DisplayName,
		PhotoURL:    record.PhotoURL,
		ProviderID:  provider,
	}
}
