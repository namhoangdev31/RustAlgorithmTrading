package artifact

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"trading/control-gateway/internal/domain/entities"
	"trading/control-gateway/internal/domain/repositories"
)

func TestS3SignerCreatesHTTPPresignedURLWithoutNetworkCall(t *testing.T) {
	signer, err := NewS3Signer(context.Background(), S3Config{Endpoint: "https://objects.example.test", Region: "auto", AccessKeyID: "access", SecretAccessKey: "secret", ForcePathStyle: true})
	if err != nil {
		t.Fatalf("create signer: %v", err)
	}
	url, err := signer.PresignDownload(context.Background(), entities.BundleArtifact{StorageBucket: "apps", StorageKey: "releases/app.zip"}, 15*time.Minute)
	if err != nil {
		t.Fatalf("presign download: %v", err)
	}
	if !strings.HasPrefix(url, "https://objects.example.test/apps/releases/app.zip?") || !strings.Contains(url, "X-Amz-Signature=") {
		t.Fatalf("unexpected presigned url: %s", url)
	}
}

func TestS3SignerFailsClosedWithoutCredentials(t *testing.T) {
	_, err := NewS3Signer(context.Background(), S3Config{})
	if !errors.Is(err, repositories.ErrUnavailable) {
		t.Fatalf("expected unavailable, got %v", err)
	}
}
