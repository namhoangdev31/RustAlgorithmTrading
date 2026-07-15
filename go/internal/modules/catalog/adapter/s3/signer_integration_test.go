//go:build integration

package s3

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awss3 "github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"

	"trading/control-gateway/internal/modules/catalog/domain"
)

func TestMinIOPresignedDownload(t *testing.T) {
	endpoint := os.Getenv("TEST_MINIO_ENDPOINT")
	if endpoint == "" {
		t.Skip("TEST_MINIO_ENDPOINT is not configured")
	}
	bucket := os.Getenv("TEST_MINIO_BUCKET")
	if bucket == "" {
		bucket = "lepoship-artifacts"
	}
	ctx := context.Background()
	signer, err := NewS3Signer(ctx, S3Config{Endpoint: endpoint, Region: "us-east-1", AccessKeyID: os.Getenv("TEST_MINIO_ACCESS_KEY_ID"), SecretAccessKey: os.Getenv("TEST_MINIO_SECRET_ACCESS_KEY"), ForcePathStyle: true})
	if err != nil {
		t.Fatal(err)
	}
	_, err = signer.objectAPI.CreateBucket(ctx, &awss3.CreateBucketInput{Bucket: aws.String(bucket)})
	if err != nil && !strings.Contains(err.Error(), "BucketAlreadyOwnedByYou") && !strings.Contains(err.Error(), "BucketAlreadyExists") {
		t.Fatal(err)
	}
	key := "integration/" + uuid.NewString() + ".zip"
	payload := []byte("ios-compatible-artifact")
	_, err = signer.objectAPI.PutObject(ctx, &awss3.PutObjectInput{Bucket: aws.String(bucket), Key: aws.String(key), Body: strings.NewReader(string(payload))})
	if err != nil {
		t.Fatal(err)
	}
	defer signer.objectAPI.DeleteObject(ctx, &awss3.DeleteObjectInput{Bucket: aws.String(bucket), Key: aws.String(key)})
	url, err := signer.PresignDownload(ctx, domain.BundleArtifact{StorageBucket: bucket, StorageKey: key}, 15*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	response, err := http.Get(url)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		t.Fatalf("download returned %d", response.StatusCode)
	}
	body, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	want, got := sha256.Sum256(payload), sha256.Sum256(body)
	if hex.EncodeToString(got[:]) != hex.EncodeToString(want[:]) {
		t.Fatal("download checksum mismatch")
	}
}
