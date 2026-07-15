package application

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"trading/control-gateway/internal/shared/apperror"
	shared "trading/control-gateway/internal/shared/application"
)

type Service struct {
	repo   Repository
	signer ArtifactSigner
	now    func() time.Time
}

func NewService(repo Repository, signer ArtifactSigner) *Service {
	return &Service{repo: repo, signer: signer, now: func() time.Time { return time.Now().UTC() }}
}

func (s *Service) ListBundles(ctx context.Context) ([]CatalogBundle, error) {
	return s.repo.ListBundles(ctx)
}
func (s *Service) BundleStats(ctx context.Context, id string) (BundleStatsView, error) {
	return s.repo.GetBundleStats(ctx, id)
}
func (s *Service) Promotions(ctx context.Context, id string) ([]PromotionView, error) {
	return s.repo.ListPromotions(ctx, id, s.now())
}
func (s *Service) Featured(ctx context.Context) (FeaturedApp, error) {
	return s.repo.GetFeatured(ctx, s.now())
}
func (s *Service) AppsWeLove(ctx context.Context) ([]MiniApp, error) {
	return s.repo.ListAppsWeLove(ctx)
}
func (s *Service) Collections(ctx context.Context) ([]AppCollection, error) {
	return s.repo.ListCollections(ctx)
}

func (s *Service) Personalized(ctx context.Context, principal shared.Principal) ([]MiniApp, error) {
	id, err := principalUUID(principal)
	if err != nil {
		return nil, err
	}
	return s.repo.ListPersonalized(ctx, id)
}

func (s *Service) Reviews(ctx context.Context, bundleID string) ([]ReviewView, error) {
	return s.repo.ListReviews(ctx, bundleID)
}

func (s *Service) CreateReview(ctx context.Context, bundleID string, principal shared.Principal, input CreateReviewInput) (CreateReviewResult, error) {
	if input.Rating < 1 || input.Rating > 5 {
		return CreateReviewResult{}, fmt.Errorf("%w: rating must be between 1 and 5", apperror.ErrInvalidArgument)
	}
	input.Title, input.Content = strings.TrimSpace(input.Title), strings.TrimSpace(input.Content)
	if len(input.Title) > 255 || input.Content == "" || len(input.Content) > 5000 {
		return CreateReviewResult{}, fmt.Errorf("%w: invalid review content", apperror.ErrInvalidArgument)
	}
	id, err := principalUUID(principal)
	if err != nil {
		return CreateReviewResult{}, err
	}
	return s.repo.CreateReview(ctx, bundleID, id, input)
}

func (s *Service) CreateReviewReport(ctx context.Context, reviewID string, principal shared.Principal, input CreateReportInput) (CreateReportResult, error) {
	input.Reason, input.Description = strings.TrimSpace(input.Reason), strings.TrimSpace(input.Description)
	if input.Reason == "" || len(input.Reason) > 100 || len(input.Description) > 5000 {
		return CreateReportResult{}, fmt.Errorf("%w: invalid report", apperror.ErrInvalidArgument)
	}
	id, err := principalUUID(principal)
	if err != nil {
		return CreateReportResult{}, err
	}
	return s.repo.CreateReviewReport(ctx, reviewID, id, input)
}

func (s *Service) DownloadURL(ctx context.Context, bundleID string) (string, error) {
	release, err := s.repo.FindActiveRelease(ctx, bundleID)
	if err != nil {
		return "", err
	}
	if release.Artifact == nil {
		return "", apperror.ErrNotFound
	}
	if s.signer == nil {
		return "", apperror.ErrUnavailable
	}
	return s.signer.PresignDownload(ctx, *release.Artifact, 15*time.Minute)
}

func (s *Service) TrackDownload(ctx context.Context, bundleID string, principal shared.Principal) error {
	id, err := principalUUID(principal)
	if err != nil {
		return err
	}
	return s.repo.TrackDownload(ctx, bundleID, id, s.now())
}

func (s *Service) CheckUpdates(ctx context.Context, installed []InstalledBundle) ([]UpdateView, error) {
	if len(installed) == 0 || len(installed) > 100 {
		return nil, fmt.Errorf("%w: update request must contain 1 to 100 bundles", apperror.ErrInvalidArgument)
	}
	result := make([]UpdateView, 0, len(installed))
	for _, current := range installed {
		if strings.TrimSpace(current.BundleID) == "" || current.CurrentBuildNumber < 0 {
			return nil, fmt.Errorf("%w: invalid installed bundle", apperror.ErrInvalidArgument)
		}
		release, err := s.repo.FindActiveRelease(ctx, current.BundleID)
		if errors.Is(err, apperror.ErrNotFound) {
			result = append(result, UpdateView{BundleID: current.BundleID, LatestVersion: current.CurrentVersion, LatestBuildNumber: current.CurrentBuildNumber})
			continue
		}
		if err != nil {
			return nil, err
		}
		item := UpdateView{BundleID: current.BundleID, LatestVersion: release.Version, LatestBuildNumber: release.BuildNumber, Changelog: release.Changelog}
		if release.BuildNumber > current.CurrentBuildNumber {
			if release.Artifact == nil {
				return nil, apperror.ErrNotFound
			}
			if s.signer == nil {
				return nil, apperror.ErrUnavailable
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

func principalUUID(principal shared.Principal) (uuid.UUID, error) {
	id, err := uuid.Parse(principal.UserID)
	if err != nil {
		return uuid.Nil, apperror.ErrUnauthorized
	}
	return id, nil
}
