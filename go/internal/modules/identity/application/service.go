package application

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

	"trading/control-gateway/internal/modules/identity/domain"
	"trading/control-gateway/internal/shared/apperror"
)

type Config struct {
	SigningSecret string
	Issuer        string
	Audience      string
	AccessTTL     time.Duration
	RefreshTTL    time.Duration
}

type Service struct {
	repo     Repository
	firebase FirebaseProvider
	config   Config
	now      func() time.Time
}

func NewService(repo Repository, firebase FirebaseProvider, config Config) *Service {
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
	return &Service{repo: repo, firebase: firebase, config: config, now: func() time.Time { return time.Now().UTC() }}
}

func (s *Service) LoginWithFirebase(ctx context.Context, idToken string) (TokenResponse, error) {
	if err := s.ensureConfigured(); err != nil {
		return TokenResponse{}, err
	}
	if strings.TrimSpace(idToken) == "" {
		return TokenResponse{}, apperror.WithMessage(apperror.ErrInvalidArgument, "firebase id token is required")
	}
	user, err := s.firebase.VerifyIDToken(ctx, idToken)
	if err != nil {
		return TokenResponse{}, err
	}
	return s.finishFirebaseLogin(ctx, user)
}

func (s *Service) finishFirebaseLogin(ctx context.Context, firebaseUser FirebaseUser) (TokenResponse, error) {
	user, err := s.repo.UpsertFirebaseUser(ctx, firebaseUser)
	if err != nil {
		return TokenResponse{}, err
	}
	return s.issueNewSession(ctx, user)
}

func (s *Service) Refresh(ctx context.Context, refreshToken string) (TokenResponse, error) {
	if strings.TrimSpace(refreshToken) == "" {
		return TokenResponse{}, apperror.ErrUnauthorized
	}
	if err := s.ensureConfigured(); err != nil {
		return TokenResponse{}, err
	}
	nextRefresh, err := randomToken()
	if err != nil {
		return TokenResponse{}, fmt.Errorf("generate refresh token: %w", err)
	}
	now := s.now()
	user, err := s.repo.RotateSession(ctx, tokenHash(refreshToken), tokenHash(nextRefresh), s.config.RefreshTTL, now)
	if err != nil {
		return TokenResponse{}, err
	}
	access, err := s.signAccessToken(user, now)
	if err != nil {
		return TokenResponse{}, err
	}
	return TokenResponse{AccessToken: access, RefreshToken: nextRefresh, ExpiresIn: int(s.config.AccessTTL.Seconds())}, nil
}

func (s *Service) issueNewSession(ctx context.Context, user domain.User) (TokenResponse, error) {
	refresh, err := randomToken()
	if err != nil {
		return TokenResponse{}, fmt.Errorf("generate refresh token: %w", err)
	}
	now := s.now()
	if err := s.repo.CreateSession(ctx, user.ID, tokenHash(refresh), now); err != nil {
		return TokenResponse{}, err
	}
	access, err := s.signAccessToken(user, now)
	if err != nil {
		return TokenResponse{}, err
	}
	return TokenResponse{AccessToken: access, RefreshToken: refresh, ExpiresIn: int(s.config.AccessTTL.Seconds())}, nil
}

func (s *Service) Me(ctx context.Context, principal Principal) (UserView, error) {
	id, err := uuid.Parse(principal.UserID)
	if err != nil {
		return UserView{}, apperror.ErrUnauthorized
	}
	return s.repo.FindUserByID(ctx, id)
}

func (s *Service) ListUsers(ctx context.Context) ([]UserView, error) { return s.repo.ListUsers(ctx) }

func (s *Service) VerifyAccessToken(raw string) (Principal, error) {
	if err := s.ensureConfigured(); err != nil {
		return Principal{}, err
	}
	claims := &accessClaims{}
	token, err := jwt.ParseWithClaims(raw, claims, func(token *jwt.Token) (any, error) {
		if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, apperror.ErrUnauthorized
		}
		return []byte(s.config.SigningSecret), nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}), jwt.WithIssuer(s.config.Issuer), jwt.WithAudience(s.config.Audience), jwt.WithExpirationRequired())
	if err != nil || !token.Valid || claims.Subject == "" {
		return Principal{}, apperror.ErrUnauthorized
	}
	return Principal{UserID: claims.Subject, Email: claims.Email, UserType: claims.UserType}, nil
}

func (s *Service) signAccessToken(user domain.User, now time.Time) (string, error) {
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

func (s *Service) ensureConfigured() error {
	if len(s.config.SigningSecret) < 32 {
		return apperror.WithMessage(apperror.ErrUnavailable, "storefront jwt secret must be at least 32 bytes")
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
