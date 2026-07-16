package s3

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	awss3 "github.com/aws/aws-sdk-go-v2/service/s3"

	"trading/control-gateway/internal/modules/verification/domain"
)

type Config struct {
	Endpoint       string
	Region         string
	AccessKeyID    string
	SecretKey      string
	ForcePathStyle bool
	Provider       string
	Bucket         string
}

type ReportStore struct {
	client   *awss3.Client
	provider string
	bucket   string
}

func New(ctx context.Context, cfg Config) (*ReportStore, error) {
	if cfg.Endpoint == "" || cfg.AccessKeyID == "" || cfg.SecretKey == "" || cfg.Bucket == "" {
		return nil, errors.New("verification report storage is not configured")
	}
	region := cfg.Region
	if region == "" {
		region = "us-east-1"
	}
	options := []func(*awsconfig.LoadOptions) error{
		awsconfig.WithRegion(region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretKey, "")),
	}
	awsCfg, err := awsconfig.LoadDefaultConfig(ctx, options...)
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
	return &ReportStore{client: client, provider: provider, bucket: cfg.Bucket}, nil
}

func (s *ReportStore) Put(ctx context.Context, snapshot domain.TerminalSnapshot) (domain.ReportRef, error) {
	htmlKey := fmt.Sprintf("verification/%s/report.html", snapshot.RunID)
	payload := map[string]any{
		"schemaVersion": "verification-report.v1",
		"runId":         snapshot.RunID, "projectId": snapshot.ProjectID, "bundleId": snapshot.BundleID, "releaseId": snapshot.ReleaseID,
		"artifactId": snapshot.ArtifactID, "artifactChecksum": snapshot.ArtifactChecksum, "status": snapshot.Status, "decision": snapshot.Decision,
		"scores":   map[string]any{"dimensions": snapshot.Dimensions, "overall": snapshot.Overall, "confidence": snapshot.Confidence, "completeness": snapshot.Completeness},
		"findings": snapshot.Findings, "policyVersionId": snapshot.PolicyVersionID, "htmlKey": htmlKey,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return domain.ReportRef{}, err
	}
	digest := sha256.Sum256(body)
	checksum := hex.EncodeToString(digest[:])
	key := fmt.Sprintf("verification/%s/report.json", snapshot.RunID)
	_, err = s.client.PutObject(ctx, &awss3.PutObjectInput{Bucket: aws.String(s.bucket), Key: aws.String(key), Body: bytes.NewReader(body), ContentType: aws.String("application/json"), Metadata: map[string]string{"checksumsha256": checksum}})
	if err != nil {
		return domain.ReportRef{}, fmt.Errorf("upload verification report: %w", err)
	}
	var html bytes.Buffer
	tmpl := template.Must(template.New("report").Parse(`<!doctype html><html><head><meta charset="utf-8"><title>Verification {{.RunID}}</title><style>body{font:14px system-ui;max-width:960px;margin:40px auto;padding:0 20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}code{word-break:break-all}</style></head><body><h1>Web Bundle Verification</h1><p><b>Run:</b> <code>{{.RunID}}</code></p><p><b>Status:</b> {{.Status}} · <b>Decision:</b> {{.Decision}} · <b>Score:</b> {{.Overall}} · <b>Confidence:</b> {{.Confidence}}</p><p><b>Artifact:</b> <code>{{.ArtifactChecksum}}</code></p><h2>Findings</h2><table><tr><th>Severity</th><th>Dimension</th><th>Rule</th><th>Title</th></tr>{{range .Findings}}<tr><td>{{.Severity}}</td><td>{{.Dimension}}</td><td>{{.RuleID}}</td><td>{{.Title}}</td></tr>{{end}}</table></body></html>`))
	if err := tmpl.Execute(&html, snapshot); err != nil {
		return domain.ReportRef{}, err
	}
	if _, err = s.client.PutObject(ctx, &awss3.PutObjectInput{Bucket: aws.String(s.bucket), Key: aws.String(htmlKey), Body: bytes.NewReader(html.Bytes()), ContentType: aws.String("text/html")}); err != nil {
		return domain.ReportRef{}, fmt.Errorf("upload verification html report: %w", err)
	}
	return domain.ReportRef{Provider: s.provider, Bucket: s.bucket, Key: key, ChecksumSHA256: checksum}, nil
}
