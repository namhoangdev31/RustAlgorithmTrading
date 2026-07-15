package usecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	"trading/control-gateway/internal/domain/entities"
	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/domain/usecases"
)

func TestCheckUpdatesUsesActiveReleaseAndPresignedHTTPURL(t *testing.T) {
	bundleID := uuid.New()
	artifact := entities.BundleArtifact{StorageBucket: "artifacts", StorageKey: "apps/app.zip"}
	repo := &fakeStorefrontRepository{release: repositories.ActiveRelease{BundleID: bundleID, Version: "1.2.0", BuildNumber: 12, Changelog: "Fixes", Artifact: &artifact}}
	signer := &fakeArtifactSigner{url: "https://cdn.example.test/app.zip?signature=test"}
	service := NewStorefrontService(repo, signer, false)

	updates, err := service.CheckUpdates(context.Background(), []repositories.InstalledBundle{{BundleID: bundleID.String(), CurrentVersion: "1.1.0", CurrentBuildNumber: 10}})
	if err != nil {
		t.Fatalf("check updates: %v", err)
	}
	if len(updates) != 1 || !updates[0].UpdateAvailable || updates[0].LatestBuildNumber != 12 || updates[0].DownloadURL == nil {
		t.Fatalf("unexpected update response: %+v", updates)
	}
	if signer.expires != 15*time.Minute {
		t.Fatalf("expected 15 minute signature, got %v", signer.expires)
	}
}

func TestCheckUpdatesDoesNotSignCurrentRelease(t *testing.T) {
	repo := &fakeStorefrontRepository{release: repositories.ActiveRelease{Version: "1.2.0", BuildNumber: 12, Artifact: &entities.BundleArtifact{}}}
	signer := &fakeArtifactSigner{url: "https://unused"}
	service := NewStorefrontService(repo, signer, false)
	updates, err := service.CheckUpdates(context.Background(), []repositories.InstalledBundle{{BundleID: "bundle", CurrentVersion: "1.2.0", CurrentBuildNumber: 12}})
	if err != nil {
		t.Fatalf("check updates: %v", err)
	}
	if updates[0].UpdateAvailable || updates[0].DownloadURL != nil || signer.calls != 0 {
		t.Fatalf("current release should not be signed: %+v", updates[0])
	}
}

func TestMockPaymentsFailClosedAndRequireIdempotency(t *testing.T) {
	principal := usecases.Principal{UserID: uuid.NewString()}
	repo := &fakeStorefrontRepository{}
	disabled := NewStorefrontService(repo, nil, false)
	if _, err := disabled.PaymentMethods(context.Background()); !errors.Is(err, repositories.ErrUnavailable) {
		t.Fatalf("expected disabled payments, got %v", err)
	}

	enabled := NewStorefrontService(repo, nil, true)
	if _, err := enabled.Checkout(context.Background(), principal, "bundle", "mock_card_4242", ""); !errors.Is(err, repositories.ErrBadRequest) {
		t.Fatalf("expected missing idempotency rejection, got %v", err)
	}
	response, err := enabled.Checkout(context.Background(), principal, "bundle", "mock_card_4242", "checkout-1")
	if err != nil {
		t.Fatalf("mock checkout: %v", err)
	}
	if response.Status != "success" || repo.checkoutKey != "checkout-1" {
		t.Fatalf("unexpected checkout: %+v key=%s", response, repo.checkoutKey)
	}
}

func TestReviewValidationRejectsSpoofableOrInvalidContentBeforeRepository(t *testing.T) {
	service := NewStorefrontService(&fakeStorefrontRepository{}, nil, false)
	principal := usecases.Principal{UserID: uuid.NewString()}
	_, err := service.CreateReview(context.Background(), "bundle", principal, repositories.CreateReviewInput{Rating: 0, Content: "content"})
	if !errors.Is(err, repositories.ErrBadRequest) {
		t.Fatalf("expected rating validation, got %v", err)
	}
	_, err = service.CreateReview(context.Background(), "bundle", principal, repositories.CreateReviewInput{Rating: 5, Content: ""})
	if !errors.Is(err, repositories.ErrBadRequest) {
		t.Fatalf("expected content validation, got %v", err)
	}
}

type fakeArtifactSigner struct {
	url     string
	err     error
	expires time.Duration
	calls   int
}

func (f *fakeArtifactSigner) PresignDownload(_ context.Context, _ entities.BundleArtifact, expires time.Duration) (string, error) {
	f.calls++
	f.expires = expires
	return f.url, f.err
}

type fakeStorefrontRepository struct {
	release     repositories.ActiveRelease
	releaseErr  error
	checkoutKey string
}

func (f *fakeStorefrontRepository) ListBundles(context.Context) ([]repositories.CatalogBundle, error) {
	return []repositories.CatalogBundle{}, nil
}
func (f *fakeStorefrontRepository) GetBundleStats(context.Context, string) (repositories.BundleStatsView, error) {
	return repositories.BundleStatsView{}, nil
}
func (f *fakeStorefrontRepository) ListPromotions(context.Context, string, time.Time) ([]repositories.PromotionView, error) {
	return []repositories.PromotionView{}, nil
}
func (f *fakeStorefrontRepository) GetFeatured(context.Context, time.Time) (repositories.FeaturedApp, error) {
	return repositories.FeaturedApp{}, nil
}
func (f *fakeStorefrontRepository) ListAppsWeLove(context.Context) ([]repositories.MiniApp, error) {
	return []repositories.MiniApp{}, nil
}
func (f *fakeStorefrontRepository) ListCollections(context.Context) ([]repositories.AppCollection, error) {
	return []repositories.AppCollection{}, nil
}
func (f *fakeStorefrontRepository) ListPersonalized(context.Context, uuid.UUID) ([]repositories.MiniApp, error) {
	return []repositories.MiniApp{}, nil
}
func (f *fakeStorefrontRepository) ListReviews(context.Context, string) ([]repositories.ReviewView, error) {
	return []repositories.ReviewView{}, nil
}
func (f *fakeStorefrontRepository) CreateReview(context.Context, string, uuid.UUID, repositories.CreateReviewInput) (repositories.CreateReviewResult, error) {
	return repositories.CreateReviewResult{Status: "submitted"}, nil
}
func (f *fakeStorefrontRepository) CreateReviewReport(context.Context, string, uuid.UUID, repositories.CreateReportInput) (repositories.CreateReportResult, error) {
	return repositories.CreateReportResult{Status: "submitted"}, nil
}
func (f *fakeStorefrontRepository) FindActiveRelease(context.Context, string) (repositories.ActiveRelease, error) {
	return f.release, f.releaseErr
}
func (f *fakeStorefrontRepository) TrackDownload(context.Context, string, uuid.UUID, time.Time) error {
	return nil
}
func (f *fakeStorefrontRepository) ListNotifications(context.Context, uuid.UUID) ([]repositories.NotificationView, error) {
	return []repositories.NotificationView{}, nil
}
func (f *fakeStorefrontRepository) MarkNotificationRead(context.Context, string, uuid.UUID, time.Time) error {
	return nil
}
func (f *fakeStorefrontRepository) MockCheckout(_ context.Context, _ uuid.UUID, _ string, key string, _ time.Time) (repositories.CheckoutResult, error) {
	f.checkoutKey = key
	return repositories.CheckoutResult{TransactionID: uuid.NewString(), Status: "success"}, nil
}
