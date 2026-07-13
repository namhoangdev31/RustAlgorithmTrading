package lepoship

import (
	"context"
	"io"

	"trading/control-gateway/internal/domain/repositories"
)

type Service struct {
	repo repositories.LepoShipRepository
}

func NewService(repo repositories.LepoShipRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) AuthenticateSDKToken(ctx context.Context, token string, scope string) (*repositories.SDKIdentity, error) {
	return s.repo.AuthenticateSDKToken(ctx, token, scope)
}

func (s *Service) IngestTelemetry(ctx context.Context, identity repositories.SDKIdentity, payload repositories.TelemetryPayload, ip string) (repositories.TelemetryResult, error) {
	return s.repo.IngestTelemetry(ctx, identity, payload, ip)
}

func (s *Service) CheckOTA(ctx context.Context, identity repositories.SDKIdentity, req repositories.OTACheckRequest) (repositories.OTACheckResponse, error) {
	return s.repo.CheckOTA(ctx, identity, req)
}

func (s *Service) CreateReleaseUpload(ctx context.Context, req repositories.ReleaseUploadRequest, file io.Reader, size int64) (repositories.ReleaseUploadResponse, error) {
	return s.repo.CreateReleaseUpload(ctx, req, file, size)
}

func (s *Service) IssueLicense(ctx context.Context, req repositories.LicenseIssueRequest) (repositories.LicenseIssueResponse, error) {
	return s.repo.IssueLicense(ctx, req)
}

func (s *Service) VerifyLicense(ctx context.Context, identity repositories.SDKIdentity, req repositories.LicenseVerifyRequest) (repositories.LicenseVerifyResponse, error) {
	return s.repo.VerifyLicense(ctx, identity, req)
}

func (s *Service) RunCronJob(ctx context.Context, name string) (repositories.CronJobResult, error) {
	return s.repo.RunCronJob(ctx, name)
}
