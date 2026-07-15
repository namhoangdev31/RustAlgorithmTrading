package usecase

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"trading/control-gateway/internal/domain/entities"
	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/domain/usecases"
)

type AuthConfig struct {
	SigningSecret string
	Issuer        string
	Audience      string
	AccessTTL     time.Duration
	RefreshTTL    time.Duration
}

type AuthService struct {
	repo     repositories.AuthRepository
	firebase repositories.FirebaseAuthProvider
	config   AuthConfig
	now      func() time.Time
}

func NewAuthService(repo repositories.AuthRepository, firebase repositories.FirebaseAuthProvider, config AuthConfig) *AuthService {
	if config.Issuer == "" {
		config.Issuer = "control-gateway"
	}
	if config.Audience == "" {
		config.Audience = "ios-storefront"
	}
	if config.AccessTTL <= 0 {
		config.AccessTTL = 15 * time.Minute
	}
	if config.RefreshTTL <= 0 {
		config.RefreshTTL = 30 * 24 * time.Hour
	}
	return &AuthService{repo: repo, firebase: firebase, config: config, now: func() time.Time { return time.Now().UTC() }}
}

func (s *AuthService) Login(ctx context.Context, email, password string) (usecases.AuthTokenResponse, error) {
	if err := s.ensureConfigured(); err != nil {
		return usecases.AuthTokenResponse{}, err
	}
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || strings.TrimSpace(password) == "" {
		return usecases.AuthTokenResponse{}, fmt.Errorf("%w: email and password are required", repositories.ErrBadRequest)
	}
	user, err := s.firebase.AuthenticatePassword(ctx, email, password)
	if err != nil {
		return usecases.AuthTokenResponse{}, err
	}
	return s.finishFirebaseLogin(ctx, user)
}

func (s *AuthService) LoginWithFirebase(ctx context.Context, idToken string) (usecases.AuthTokenResponse, error) {
	if err := s.ensureConfigured(); err != nil {
		return usecases.AuthTokenResponse{}, err
	}
	if strings.TrimSpace(idToken) == "" {
		return usecases.AuthTokenResponse{}, fmt.Errorf("%w: firebase id token is required", repositories.ErrBadRequest)
	}
	user, err := s.firebase.VerifyIDToken(ctx, idToken)
	if err != nil {
		return usecases.AuthTokenResponse{}, err
	}
	return s.finishFirebaseLogin(ctx, user)
}

func (s *AuthService) finishFirebaseLogin(ctx context.Context, firebaseUser repositories.FirebaseUser) (usecases.AuthTokenResponse, error) {
	user, err := s.repo.UpsertFirebaseUser(ctx, firebaseUser)
	if err != nil {
		return usecases.AuthTokenResponse{}, err
	}
	return s.issueNewSession(ctx, user)
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (usecases.AuthTokenResponse, error) {
	if strings.TrimSpace(refreshToken) == "" {
		return usecases.AuthTokenResponse{}, repositories.ErrUnauthorized
	}
	if err := s.ensureConfigured(); err != nil {
		return usecases.AuthTokenResponse{}, err
	}
	nextRefresh, err := randomToken()
	if err != nil {
		return usecases.AuthTokenResponse{}, fmt.Errorf("generate refresh token: %w", err)
	}
	now := s.now()
	user, err := s.repo.RotateSession(ctx, tokenHash(refreshToken), tokenHash(nextRefresh), s.config.RefreshTTL, now)
	if err != nil {
		return usecases.AuthTokenResponse{}, err
	}
	access, err := s.signAccessToken(user, now)
	if err != nil {
		return usecases.AuthTokenResponse{}, err
	}
	return usecases.AuthTokenResponse{AccessToken: access, RefreshToken: nextRefresh, ExpiresIn: int(s.config.AccessTTL.Seconds())}, nil
}

func (s *AuthService) issueNewSession(ctx context.Context, user entities.User) (usecases.AuthTokenResponse, error) {
	if err := s.ensureConfigured(); err != nil {
		return usecases.AuthTokenResponse{}, err
	}
	refresh, err := randomToken()
	if err != nil {
		return usecases.AuthTokenResponse{}, fmt.Errorf("generate refresh token: %w", err)
	}
	now := s.now()
	if err := s.repo.CreateSession(ctx, user.ID, tokenHash(refresh), now); err != nil {
		return usecases.AuthTokenResponse{}, err
	}
	access, err := s.signAccessToken(user, now)
	if err != nil {
		return usecases.AuthTokenResponse{}, err
	}
	return usecases.AuthTokenResponse{AccessToken: access, RefreshToken: refresh, ExpiresIn: int(s.config.AccessTTL.Seconds())}, nil
}

func (s *AuthService) Me(ctx context.Context, principal usecases.Principal) (repositories.UserView, error) {
	id, err := uuid.Parse(principal.UserID)
	if err != nil {
		return repositories.UserView{}, repositories.ErrUnauthorized
	}
	return s.repo.FindUserByID(ctx, id)
}

func (s *AuthService) ListUsers(ctx context.Context) ([]repositories.UserView, error) {
	return s.repo.ListUsers(ctx)
}

func (s *AuthService) VerifyAccessToken(raw string) (usecases.Principal, error) {
	if err := s.ensureConfigured(); err != nil {
		return usecases.Principal{}, err
	}
	claims := &accessClaims{}
	token, err := jwt.ParseWithClaims(raw, claims, func(token *jwt.Token) (any, error) {
		if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, repositories.ErrUnauthorized
		}
		return []byte(s.config.SigningSecret), nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}), jwt.WithIssuer(s.config.Issuer), jwt.WithAudience(s.config.Audience), jwt.WithExpirationRequired())
	if err != nil || !token.Valid || claims.Subject == "" {
		return usecases.Principal{}, repositories.ErrUnauthorized
	}
	return usecases.Principal{UserID: claims.Subject, Email: claims.Email, UserType: claims.UserType}, nil
}

func (s *AuthService) signAccessToken(user entities.User, now time.Time) (string, error) {
	email := ""
	if user.Email != nil {
		email = *user.Email
	}
	claims := accessClaims{Email: email, UserType: user.UserType, RegisteredClaims: jwt.RegisteredClaims{
		Issuer: s.config.Issuer, Subject: user.ID.String(), Audience: jwt.ClaimStrings{s.config.Audience},
		ExpiresAt: jwt.NewNumericDate(now.Add(s.config.AccessTTL)), IssuedAt: jwt.NewNumericDate(now), NotBefore: jwt.NewNumericDate(now), ID: uuid.NewString(),
	}}
	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(s.config.SigningSecret))
	if err != nil {
		return "", fmt.Errorf("sign access token: %w", err)
	}
	return signed, nil
}

func (s *AuthService) ensureConfigured() error {
	if len(s.config.SigningSecret) < 32 {
		return fmt.Errorf("%w: storefront jwt secret must be at least 32 bytes", repositories.ErrUnavailable)
	}
	return nil
}

type accessClaims struct {
	Email    string `json:"email"`
	UserType string `json:"userType"`
	jwt.RegisteredClaims
}

func randomToken() (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(raw), nil
}

func tokenHash(token string) string {
	digest := sha256.Sum256([]byte(token))
	return hex.EncodeToString(digest[:])
}
