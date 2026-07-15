package s3

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"trading/control-gateway/internal/modules/catalog/domain"
	"trading/control-gateway/internal/shared/apperror"
)

type S3Signer struct {
	client *s3.PresignClient
}

type S3Config struct {
	Endpoint        string
	Region          string
	AccessKeyID     string
	SecretAccessKey string
	ForcePathStyle  bool
}

func NewS3Signer(ctx context.Context, input S3Config) (*S3Signer, error) {
	if strings.TrimSpace(input.AccessKeyID) == "" || strings.TrimSpace(input.SecretAccessKey) == "" {
		return nil, apperror.WithMessage(apperror.ErrUnavailable, "artifact credentials are not configured")
	}
	region := strings.TrimSpace(input.Region)
	if region == "" {
		region = "auto"
	}
	cfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithRegion(region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(input.AccessKeyID, input.SecretAccessKey, "")),
	)
	if err != nil {
		return nil, fmt.Errorf("load artifact signer config: %w", err)
	}
	client := s3.NewFromConfig(cfg, func(options *s3.Options) {
		options.UsePathStyle = input.ForcePathStyle
		if strings.TrimSpace(input.Endpoint) != "" {
			options.BaseEndpoint = aws.String(strings.TrimRight(input.Endpoint, "/"))
		}
	})
	return &S3Signer{client: s3.NewPresignClient(client)}, nil
}

func (s *S3Signer) PresignDownload(ctx context.Context, artifact domain.BundleArtifact, expires time.Duration) (string, error) {
	if s == nil || s.client == nil {
		return "", apperror.ErrUnavailable
	}
	if artifact.StorageBucket == "" || artifact.StorageKey == "" {
		return "", apperror.ErrNotFound
	}
	request, err := s.client.PresignGetObject(ctx, &s3.GetObjectInput{Bucket: aws.String(artifact.StorageBucket), Key: aws.String(artifact.StorageKey)}, func(options *s3.PresignOptions) { options.Expires = expires })
	if err != nil {
		return "", fmt.Errorf("%w: presign artifact download", apperror.ErrUnavailable)
	}
	if !strings.HasPrefix(request.URL, "http://") && !strings.HasPrefix(request.URL, "https://") {
		return "", fmt.Errorf("%w: signer returned a non-http url", apperror.ErrUnavailable)
	}
	return request.URL, nil
}
