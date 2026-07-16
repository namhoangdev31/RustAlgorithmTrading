package executor

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	awss3 "github.com/aws/aws-sdk-go-v2/service/s3"

	"trading/control-gateway/internal/modules/verification/domain"
)

type StorageConfig struct {
	Endpoint, Region, AccessKeyID, SecretKey, Provider, Bucket string
	ForcePathStyle                                             bool
}

type ObjectStore struct {
	client   *awss3.Client
	provider string
	bucket   string
}

func NewObjectStore(ctx context.Context, cfg StorageConfig) (*ObjectStore, error) {
	if cfg.Endpoint == "" || cfg.AccessKeyID == "" || cfg.SecretKey == "" || cfg.Bucket == "" {
		return nil, errors.New("LepoShip artifact storage is not configured")
	}
	region := cfg.Region
	if region == "" {
		region = "us-east-1"
	}
	awsCfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithRegion(region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretKey, "")),
	)
	if err != nil {
		return nil, err
	}
	client := awss3.NewFromConfig(awsCfg, func(options *awss3.Options) {
		options.UsePathStyle = cfg.ForcePathStyle
		options.BaseEndpoint = aws.String(cfg.Endpoint)
	})
	provider := cfg.Provider
	if provider == "" {
		provider = "s3"
	}
	return &ObjectStore{client: client, provider: provider, bucket: cfg.Bucket}, nil
}

func (s *ObjectStore) Download(ctx context.Context, artifact domain.ArtifactIdentity, destination string) error {
	response, err := s.client.GetObject(ctx, &awss3.GetObjectInput{Bucket: aws.String(artifact.Bucket), Key: aws.String(artifact.Key)})
	if err != nil {
		return fmt.Errorf("download artifact: %w", err)
	}
	defer response.Body.Close()
	file, err := os.OpenFile(destination, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0o600)
	if err != nil {
		return err
	}
	hash := sha256.New()
	written, copyErr := io.Copy(io.MultiWriter(file, hash), io.LimitReader(response.Body, artifact.SizeBytes+1))
	closeErr := file.Close()
	if copyErr != nil {
		return copyErr
	}
	if closeErr != nil {
		return closeErr
	}
	if written != artifact.SizeBytes || hex.EncodeToString(hash.Sum(nil)) != artifact.ChecksumSHA256 {
		return errors.New("artifact size or SHA-256 does not match dispatch provenance")
	}
	return nil
}

func (s *ObjectStore) UploadEvidence(ctx context.Context, runID, attemptID, kind, contentType, source string) (domain.Evidence, error) {
	file, err := os.Open(source)
	if err != nil {
		return domain.Evidence{}, err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil {
		return domain.Evidence{}, err
	}
	if info.Size() <= 0 || info.Size() > 50<<20 {
		return domain.Evidence{}, errors.New("evidence size must be between 1 byte and 50 MiB")
	}
	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return domain.Evidence{}, err
	}
	checksum := hex.EncodeToString(hash.Sum(nil))
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return domain.Evidence{}, err
	}
	key := filepath.ToSlash(filepath.Join("verification", runID, attemptID, filepath.Base(source)))
	_, err = s.client.PutObject(ctx, &awss3.PutObjectInput{
		Bucket: aws.String(s.bucket), Key: aws.String(key), Body: file,
		ContentType: aws.String(contentType), Metadata: map[string]string{"checksumsha256": checksum},
	})
	if err != nil {
		return domain.Evidence{}, fmt.Errorf("upload evidence: %w", err)
	}
	return domain.Evidence{Kind: kind, Provider: s.provider, Bucket: s.bucket, Key: key, ChecksumSHA256: checksum, SizeBytes: info.Size(), ContentType: contentType, Sensitivity: "restricted"}, nil
}

func (s *ObjectStore) UploadBundle(ctx context.Context, bucket, key, source, contentType string) (domain.ArtifactIdentity, error) {
	file, err := os.Open(source)
	if err != nil {
		return domain.ArtifactIdentity{}, err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil {
		return domain.ArtifactIdentity{}, err
	}
	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return domain.ArtifactIdentity{}, err
	}
	checksum := hex.EncodeToString(hash.Sum(nil))
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return domain.ArtifactIdentity{}, err
	}
	if bucket == "" {
		bucket = s.bucket
	}
	_, err = s.client.PutObject(ctx, &awss3.PutObjectInput{Bucket: aws.String(bucket), Key: aws.String(key), Body: file, ContentType: aws.String(contentType), Metadata: map[string]string{"checksumsha256": checksum}})
	if err != nil {
		return domain.ArtifactIdentity{}, err
	}
	return domain.ArtifactIdentity{Provider: s.provider, Bucket: bucket, Key: key, ChecksumSHA256: checksum, SizeBytes: info.Size(), ContentType: contentType}, nil
}
