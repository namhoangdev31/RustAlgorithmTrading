package application

import (
	"context"
	"io"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) AuthenticateSDKToken(ctx context.Context, token string, scope string) (*SDKIdentity, error) {
	return s.repo.AuthenticateSDKToken(ctx, token, scope)
}

func (s *Service) IngestTelemetry(ctx context.Context, identity SDKIdentity, payload TelemetryPayload, ip string) (TelemetryResult, error) {
	return s.repo.IngestTelemetry(ctx, identity, payload, ip)
}

func (s *Service) CheckOTA(ctx context.Context, identity SDKIdentity, req OTACheckRequest) (OTACheckResponse, error) {
	return s.repo.CheckOTA(ctx, identity, req)
}

func (s *Service) CreateReleaseUpload(ctx context.Context, req ReleaseUploadRequest, file io.Reader, size int64) (ReleaseUploadResponse, error) {
	return s.repo.CreateReleaseUpload(ctx, req, file, size)
}

func (s *Service) IssueLicense(ctx context.Context, req LicenseIssueRequest) (LicenseIssueResponse, error) {
	return s.repo.IssueLicense(ctx, req)
}

func (s *Service) VerifyLicense(ctx context.Context, identity SDKIdentity, req LicenseVerifyRequest) (LicenseVerifyResponse, error) {
	return s.repo.VerifyLicense(ctx, identity, req)
}

func (s *Service) RunCronJob(ctx context.Context, name string) (CronJobResult, error) {
	return s.repo.RunCronJob(ctx, name)
}

func (s *Service) RunCronJobWithTrigger(ctx context.Context, name string, trigger string) (CronJobResult, error) {
	return s.repo.RunCronJobWithTrigger(ctx, name, trigger)
}

func (s *Service) ListCronJobStatus(ctx context.Context) (CronJobStatusResponse, error) {
	return s.repo.ListCronJobStatus(ctx)
}
