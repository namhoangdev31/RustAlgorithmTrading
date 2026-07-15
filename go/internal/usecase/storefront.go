package usecase

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/domain/usecases"
)

type StorefrontService struct {
	repo         repositories.StorefrontRepository
	signer       repositories.ArtifactSigner
	mockPayments bool
	now          func() time.Time
}

func NewStorefrontService(repo repositories.StorefrontRepository, signer repositories.ArtifactSigner, mockPayments bool) *StorefrontService {
	return &StorefrontService{repo: repo, signer: signer, mockPayments: mockPayments, now: func() time.Time { return time.Now().UTC() }}
}

func (s *StorefrontService) ListBundles(ctx context.Context) ([]repositories.CatalogBundle, error) {
	return s.repo.ListBundles(ctx)
}
func (s *StorefrontService) BundleStats(ctx context.Context, id string) (repositories.BundleStatsView, error) {
	return s.repo.GetBundleStats(ctx, id)
}
func (s *StorefrontService) Promotions(ctx context.Context, id string) ([]repositories.PromotionView, error) {
	return s.repo.ListPromotions(ctx, id, s.now())
}
func (s *StorefrontService) Featured(ctx context.Context) (repositories.FeaturedApp, error) {
	return s.repo.GetFeatured(ctx, s.now())
}
func (s *StorefrontService) AppsWeLove(ctx context.Context) ([]repositories.MiniApp, error) {
	return s.repo.ListAppsWeLove(ctx)
}
func (s *StorefrontService) Collections(ctx context.Context) ([]repositories.AppCollection, error) {
	return s.repo.ListCollections(ctx)
}

func (s *StorefrontService) Personalized(ctx context.Context, principal usecases.Principal) ([]repositories.MiniApp, error) {
	id, err := principalUUID(principal)
	if err != nil {
		return nil, err
	}
	return s.repo.ListPersonalized(ctx, id)
}

func (s *StorefrontService) Reviews(ctx context.Context, bundleID string) ([]repositories.ReviewView, error) {
	return s.repo.ListReviews(ctx, bundleID)
}

func (s *StorefrontService) CreateReview(ctx context.Context, bundleID string, principal usecases.Principal, input repositories.CreateReviewInput) (repositories.CreateReviewResult, error) {
	if input.Rating < 1 || input.Rating > 5 {
		return repositories.CreateReviewResult{}, fmt.Errorf("%w: rating must be between 1 and 5", repositories.ErrBadRequest)
	}
	input.Title, input.Content = strings.TrimSpace(input.Title), strings.TrimSpace(input.Content)
	if len(input.Title) > 255 || input.Content == "" || len(input.Content) > 5000 {
		return repositories.CreateReviewResult{}, fmt.Errorf("%w: invalid review content", repositories.ErrBadRequest)
	}
	id, err := principalUUID(principal)
	if err != nil {
		return repositories.CreateReviewResult{}, err
	}
	return s.repo.CreateReview(ctx, bundleID, id, input)
}

func (s *StorefrontService) CreateReviewReport(ctx context.Context, reviewID string, principal usecases.Principal, input repositories.CreateReportInput) (repositories.CreateReportResult, error) {
	input.Reason, input.Description = strings.TrimSpace(input.Reason), strings.TrimSpace(input.Description)
	if input.Reason == "" || len(input.Reason) > 100 || len(input.Description) > 5000 {
		return repositories.CreateReportResult{}, fmt.Errorf("%w: invalid report", repositories.ErrBadRequest)
	}
	id, err := principalUUID(principal)
	if err != nil {
		return repositories.CreateReportResult{}, err
	}
	return s.repo.CreateReviewReport(ctx, reviewID, id, input)
}

func (s *StorefrontService) DownloadURL(ctx context.Context, bundleID string) (string, error) {
	release, err := s.repo.FindActiveRelease(ctx, bundleID)
	if err != nil {
		return "", err
	}
	if release.Artifact == nil {
		return "", repositories.ErrNotFound
	}
	if s.signer == nil {
		return "", repositories.ErrUnavailable
	}
	return s.signer.PresignDownload(ctx, *release.Artifact, 15*time.Minute)
}

func (s *StorefrontService) TrackDownload(ctx context.Context, bundleID string, principal usecases.Principal) error {
	id, err := principalUUID(principal)
	if err != nil {
		return err
	}
	return s.repo.TrackDownload(ctx, bundleID, id, s.now())
}

func (s *StorefrontService) CheckUpdates(ctx context.Context, installed []repositories.InstalledBundle) ([]repositories.UpdateView, error) {
	if len(installed) == 0 || len(installed) > 100 {
		return nil, fmt.Errorf("%w: update request must contain 1 to 100 bundles", repositories.ErrBadRequest)
	}
	result := make([]repositories.UpdateView, 0, len(installed))
	for _, current := range installed {
		if strings.TrimSpace(current.BundleID) == "" || current.CurrentBuildNumber < 0 {
			return nil, fmt.Errorf("%w: invalid installed bundle", repositories.ErrBadRequest)
		}
		release, err := s.repo.FindActiveRelease(ctx, current.BundleID)
		if errors.Is(err, repositories.ErrNotFound) {
			result = append(result, repositories.UpdateView{BundleID: current.BundleID, LatestVersion: current.CurrentVersion, LatestBuildNumber: current.CurrentBuildNumber})
			continue
		}
		if err != nil {
			return nil, err
		}
		item := repositories.UpdateView{BundleID: current.BundleID, LatestVersion: release.Version, LatestBuildNumber: release.BuildNumber, Changelog: release.Changelog}
		if release.BuildNumber > current.CurrentBuildNumber {
			if release.Artifact == nil {
				return nil, repositories.ErrNotFound
			}
			if s.signer == nil {
				return nil, repositories.ErrUnavailable
			}
			url, err := s.signer.PresignDownload(ctx, *release.Artifact, 15*time.Minute)
			if err != nil {
				return nil, err
			}
			item.UpdateAvailable, item.DownloadURL = true, &url
		}
		result = append(result, item)
	}
	return result, nil
}

func (s *StorefrontService) Notifications(ctx context.Context, principal usecases.Principal) ([]repositories.NotificationView, error) {
	id, err := principalUUID(principal)
	if err != nil {
		return nil, err
	}
	return s.repo.ListNotifications(ctx, id)
}

func (s *StorefrontService) MarkNotificationRead(ctx context.Context, notificationID string, principal usecases.Principal) error {
	id, err := principalUUID(principal)
	if err != nil {
		return err
	}
	return s.repo.MarkNotificationRead(ctx, notificationID, id, s.now())
}

func (s *StorefrontService) PaymentMethods(context.Context) ([]repositories.PaymentMethodView, error) {
	if !s.mockPayments {
		return nil, repositories.ErrUnavailable
	}
	return []repositories.PaymentMethodView{{ID: "mock_card_4242", Type: "credit_card", Brand: "Visa", Last4: "4242", IsDefault: true}}, nil
}

func (s *StorefrontService) SavePaymentMethod(_ context.Context, cardToken string) (map[string]string, error) {
	if !s.mockPayments {
		return nil, repositories.ErrUnavailable
	}
	if !strings.HasPrefix(strings.TrimSpace(cardToken), "tok_") {
		return nil, fmt.Errorf("%w: invalid sandbox card token", repositories.ErrBadRequest)
	}
	return map[string]string{"status": "saved", "id": "mock_card_4242"}, nil
}

func (s *StorefrontService) Checkout(ctx context.Context, principal usecases.Principal, bundleID, paymentMethodID, idempotencyKey string) (repositories.CheckoutResult, error) {
	if !s.mockPayments {
		return repositories.CheckoutResult{}, repositories.ErrUnavailable
	}
	if strings.TrimSpace(bundleID) == "" || strings.TrimSpace(paymentMethodID) == "" || strings.TrimSpace(idempotencyKey) == "" {
		return repositories.CheckoutResult{}, fmt.Errorf("%w: bundleId, paymentMethodId and Idempotency-Key are required", repositories.ErrBadRequest)
	}
	if paymentMethodID != "mock_card_4242" {
		return repositories.CheckoutResult{}, fmt.Errorf("%w: unknown mock payment method", repositories.ErrBadRequest)
	}
	if len(idempotencyKey) > 255 {
		return repositories.CheckoutResult{}, fmt.Errorf("%w: Idempotency-Key is too long", repositories.ErrBadRequest)
	}
	id, err := principalUUID(principal)
	if err != nil {
		return repositories.CheckoutResult{}, err
	}
	return s.repo.MockCheckout(ctx, id, bundleID, idempotencyKey, s.now())
}

func principalUUID(principal usecases.Principal) (uuid.UUID, error) {
	id, err := uuid.Parse(principal.UserID)
	if err != nil {
		return uuid.Nil, repositories.ErrUnauthorized
	}
	return id, nil
}
