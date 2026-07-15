package usecases

import (
	"context"

	"trading/control-gateway/internal/domain/repositories"
)

type Principal struct {
	UserID   string `json:"userId"`
	Email    string `json:"email"`
	UserType string `json:"userType"`
}

type AuthTokenResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int    `json:"expiresIn"`
}

type AuthUseCase interface {
	Login(ctx context.Context, email, password string) (AuthTokenResponse, error)
	LoginWithFirebase(ctx context.Context, idToken string) (AuthTokenResponse, error)
	Refresh(ctx context.Context, refreshToken string) (AuthTokenResponse, error)
	Me(ctx context.Context, principal Principal) (repositories.UserView, error)
	ListUsers(ctx context.Context) ([]repositories.UserView, error)
	VerifyAccessToken(raw string) (Principal, error)
}

type StorefrontUseCase interface {
	ListBundles(ctx context.Context) ([]repositories.CatalogBundle, error)
	BundleStats(ctx context.Context, bundleID string) (repositories.BundleStatsView, error)
	Promotions(ctx context.Context, bundleID string) ([]repositories.PromotionView, error)
	Featured(ctx context.Context) (repositories.FeaturedApp, error)
	AppsWeLove(ctx context.Context) ([]repositories.MiniApp, error)
	Collections(ctx context.Context) ([]repositories.AppCollection, error)
	Personalized(ctx context.Context, principal Principal) ([]repositories.MiniApp, error)
	Reviews(ctx context.Context, bundleID string) ([]repositories.ReviewView, error)
	CreateReview(ctx context.Context, bundleID string, principal Principal, input repositories.CreateReviewInput) (repositories.CreateReviewResult, error)
	CreateReviewReport(ctx context.Context, reviewID string, principal Principal, input repositories.CreateReportInput) (repositories.CreateReportResult, error)
	DownloadURL(ctx context.Context, bundleID string) (string, error)
	TrackDownload(ctx context.Context, bundleID string, principal Principal) error
	CheckUpdates(ctx context.Context, installed []repositories.InstalledBundle) ([]repositories.UpdateView, error)
	Notifications(ctx context.Context, principal Principal) ([]repositories.NotificationView, error)
	MarkNotificationRead(ctx context.Context, notificationID string, principal Principal) error
	PaymentMethods(ctx context.Context) ([]repositories.PaymentMethodView, error)
	SavePaymentMethod(ctx context.Context, cardToken string) (map[string]string, error)
	Checkout(ctx context.Context, principal Principal, bundleID, paymentMethodID, idempotencyKey string) (repositories.CheckoutResult, error)
}
