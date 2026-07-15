package config

import (
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Environment   string
	RunMode       string
	Server        Server
	Storage       Storage
	Alpaca        Alpaca
	Storefront    Storefront
	Edge          Edge
	Scheduler     Scheduler
	Events        Events
	QuantAnt      QuantAnt
	Observability Observability
}

type Server struct {
	Host            string
	Port            string
	TelemetryAPIKey string
}

type Storage struct {
	DatabaseURL string
	QuestDBURL  string
	RedisURL    string
}

type Alpaca struct {
	BaseURL     string
	DataBaseURL string
	APIKey      string
	SecretKey   string
}

type Storefront struct {
	Enabled                bool
	MockPaymentsEnabled    bool
	FirebaseAPIKey         string
	JWTSecret              string
	JWTIssuer              string
	JWTAudience            string
	AccessTTL              time.Duration
	RefreshTTL             time.Duration
	ArtifactEndpoint       string
	ArtifactRegion         string
	ArtifactAccessKeyID    string
	ArtifactSecretKey      string
	ArtifactForcePathStyle bool
	ArtifactBucket         string
	ArtifactProvider       string
	ArtifactPublicURL      string
}

type Edge struct {
	Host                    string
	Port                    string
	TLSPort                 string
	StorageRoot             string
	ControlPlaneURL         string
	InternalAPIKey          string
	ControlPlaneTLSCertPath string
	ControlPlaneTLSKeyPath  string
	ControlPlaneTLSCAPath   string
	ServiceID               string
	ServiceSecret           string
	IPFSGatewayURL          string
	ArweaveGatewayURL       string
}

type Scheduler struct {
	Enabled             bool
	HostID              string
	DevicePepper        string
	EncryptionKey       string
	PreviewCleanupURL   string
	PreviewCleanupToken string
	StorageSyncURL      string
	StorageSyncToken    string
	SSLRenewalURL       string
	SSLRenewalToken     string
	CleanupDBOnly       bool
	Schedules           map[string]string
}

type Events struct {
	NATSURL        string
	StreamName     string
	SubjectPrefix  string
	OutboxInterval time.Duration
	OutboxLeaseTTL time.Duration
	OutboxBatch    int
	MaxAttempts    int
}

type QuantAnt struct {
	Enabled             bool
	LiveEnabled         bool
	StrategyLiveEnabled bool
	LiveSessionTTL      time.Duration
	ExecutionSubject    string
	CommandStream       string
}

type Observability struct {
	ServiceName  string
	OTLPEndpoint string
	Tracing      bool
	Metrics      bool
}

func Load() (*Config, error) {
	v := viper.New()
	v.AutomaticEnv()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	setDefaults(v)

	cfg := &Config{
		Environment: v.GetString("APP_ENV"),
		RunMode:     v.GetString("GATEWAY_RUN_MODE"),
		Server:      Server{Host: v.GetString("HOST"), Port: v.GetString("PORT"), TelemetryAPIKey: v.GetString("TELEMETRY_API_KEY")},
		Storage:     Storage{DatabaseURL: v.GetString("DATABASE_URL"), QuestDBURL: v.GetString("QUESTDB_PG_URL"), RedisURL: v.GetString("REDIS_URL")},
		Alpaca:      Alpaca{BaseURL: v.GetString("ALPACA_BASE_URL"), DataBaseURL: v.GetString("ALPACA_DATA_BASE_URL"), APIKey: v.GetString("ALPACA_API_KEY"), SecretKey: v.GetString("ALPACA_SECRET_KEY")},
		Storefront: Storefront{
			Enabled: v.GetBool("STOREFRONT_API_ENABLED"), MockPaymentsEnabled: v.GetBool("STOREFRONT_MOCK_PAYMENTS_ENABLED"),
			FirebaseAPIKey: v.GetString("FIREBASE_API_KEY"), JWTSecret: v.GetString("STOREFRONT_JWT_SECRET"),
			JWTIssuer: v.GetString("STOREFRONT_JWT_ISSUER"), JWTAudience: v.GetString("STOREFRONT_JWT_AUDIENCE"),
			AccessTTL: v.GetDuration("STOREFRONT_ACCESS_TTL"), RefreshTTL: v.GetDuration("STOREFRONT_REFRESH_TTL"),
			ArtifactEndpoint: v.GetString("LEPOS_ARTIFACT_ENDPOINT"), ArtifactRegion: v.GetString("LEPOS_ARTIFACT_REGION"),
			ArtifactAccessKeyID: v.GetString("LEPOS_ARTIFACT_ACCESS_KEY_ID"), ArtifactSecretKey: v.GetString("LEPOS_ARTIFACT_SECRET_ACCESS_KEY"),
			ArtifactForcePathStyle: v.GetBool("LEPOS_ARTIFACT_FORCE_PATH_STYLE"), ArtifactBucket: v.GetString("LEPOS_ARTIFACT_BUCKET"),
			ArtifactProvider: v.GetString("LEPOS_ARTIFACT_PROVIDER"), ArtifactPublicURL: v.GetString("LEPOS_ARTIFACT_PUBLIC_URL"),
		},
		Edge: Edge{
			Host: v.GetString("HOST"), Port: v.GetString("EDGE_PORT"), TLSPort: v.GetString("TLS_PORT"),
			StorageRoot: v.GetString("LEPOS_STORAGE_ROOT"), ControlPlaneURL: v.GetString("LEPOS_CONTROL_PLANE_URL"),
			InternalAPIKey: v.GetString("LEPOS_INTERNAL_API_KEY"), ControlPlaneTLSCertPath: v.GetString("LEPOS_CONTROL_PLANE_TLS_CERT"),
			ControlPlaneTLSKeyPath: v.GetString("LEPOS_CONTROL_PLANE_TLS_KEY"), ControlPlaneTLSCAPath: v.GetString("LEPOS_CONTROL_PLANE_TLS_CA"),
			ServiceID: v.GetString("LEPOS_SERVICE_ID"), ServiceSecret: v.GetString("LEPOS_SERVICE_SECRET"),
			IPFSGatewayURL: v.GetString("LEPOS_IPFS_GATEWAY_URL"), ArweaveGatewayURL: v.GetString("LEPOS_ARWEAVE_GATEWAY_URL"),
		},
		Scheduler: Scheduler{
			Enabled: v.GetBool("LEPOS_SCHEDULER_ENABLED"), HostID: v.GetString("HOSTNAME"),
			DevicePepper: v.GetString("TELEMETRY_DEVICE_PEPPER"), EncryptionKey: v.GetString("ENCRYPTION_KEY"),
			PreviewCleanupURL: v.GetString("LEPOS_PREVIEW_CLEANUP_ADAPTER_URL"), PreviewCleanupToken: v.GetString("LEPOS_PREVIEW_CLEANUP_ADAPTER_TOKEN"),
			StorageSyncURL: v.GetString("LEPOS_STORAGE_SYNC_ADAPTER_URL"), StorageSyncToken: v.GetString("LEPOS_STORAGE_SYNC_ADAPTER_TOKEN"),
			SSLRenewalURL: v.GetString("LEPOS_SSL_RENEWAL_ADAPTER_URL"), SSLRenewalToken: v.GetString("LEPOS_SSL_RENEWAL_ADAPTER_TOKEN"),
			CleanupDBOnly: v.GetBool("LEPOS_CLEANUP_PREVIEWS_WITHOUT_ADAPTER"),
			Schedules:     schedulerSchedules(v),
		},
		Events: Events{
			NATSURL: v.GetString("NATS_URL"), StreamName: v.GetString("NATS_STREAM_NAME"), SubjectPrefix: v.GetString("NATS_SUBJECT_PREFIX"),
			OutboxInterval: v.GetDuration("OUTBOX_POLL_INTERVAL"), OutboxLeaseTTL: v.GetDuration("OUTBOX_LEASE_TTL"),
			OutboxBatch: v.GetInt("OUTBOX_BATCH_SIZE"), MaxAttempts: v.GetInt("OUTBOX_MAX_ATTEMPTS"),
		},
		QuantAnt: QuantAnt{
			Enabled: v.GetBool("QUANTANT_ENABLED"), LiveEnabled: v.GetBool("QUANTANT_LIVE_ENABLED"),
			StrategyLiveEnabled: v.GetBool("QUANTANT_STRATEGY_LIVE_ENABLED"), LiveSessionTTL: v.GetDuration("QUANTANT_LIVE_SESSION_TTL"),
			ExecutionSubject: v.GetString("QUANTANT_EXECUTION_SUBJECT"), CommandStream: v.GetString("QUANTANT_COMMAND_STREAM"),
		},
		Observability: Observability{
			ServiceName: v.GetString("OTEL_SERVICE_NAME"), OTLPEndpoint: v.GetString("OTEL_EXPORTER_OTLP_ENDPOINT"),
			Tracing: v.GetBool("TRACING_ENABLED"), Metrics: v.GetBool("METRICS_ENABLED"),
		},
	}
	if err := cfg.Validate(); err != nil {
		return nil, err
	}
	return cfg, nil
}

func (c *Config) Validate() error {
	switch c.RunMode {
	case "both", "control-plane", "edge-gateway":
	default:
		return fmt.Errorf("invalid GATEWAY_RUN_MODE %q", c.RunMode)
	}
	if c.Storefront.MockPaymentsEnabled && !c.Storefront.Enabled {
		return errors.New("STOREFRONT_MOCK_PAYMENTS_ENABLED requires STOREFRONT_API_ENABLED")
	}
	controlPlane := c.RunMode == "both" || c.RunMode == "control-plane"
	if controlPlane {
		if err := c.ValidateQuant(); err != nil {
			return fmt.Errorf("quant configuration: %w", err)
		}
		if err := c.ValidateOTA(); err != nil {
			return fmt.Errorf("ota configuration: %w", err)
		}
	}
	if err := c.ValidateEdge(); err != nil {
		return err
	}
	return nil
}

// ValidateQuant validates only dependencies owned by the Quant component.
func (c *Config) ValidateQuant() error {
	if strings.TrimSpace(c.Storage.DatabaseURL) == "" {
		return errors.New("DATABASE_URL is required")
	}
	if c.QuantAnt.Enabled {
		if !c.Storefront.Enabled {
			return errors.New("QUANTANT_ENABLED requires STOREFRONT_API_ENABLED for JWT identity")
		}
		if strings.TrimSpace(c.Events.NATSURL) == "" {
			return errors.New("QUANTANT_ENABLED requires NATS_URL")
		}
		if c.QuantAnt.LiveEnabled && c.QuantAnt.LiveSessionTTL > 5*time.Minute {
			return errors.New("QUANTANT_LIVE_SESSION_TTL must not exceed 5m")
		}
	}
	if strings.TrimSpace(c.Storage.QuestDBURL) == "" {
		return errors.New("QUESTDB_PG_URL is required")
	}
	return nil
}

// ValidateOTA validates only dependencies owned by the OTA component.
func (c *Config) ValidateOTA() error {
	if strings.TrimSpace(c.Storage.DatabaseURL) == "" {
		return errors.New("DATABASE_URL is required")
	}
	if c.Storefront.MockPaymentsEnabled && !c.Storefront.Enabled {
		return errors.New("STOREFRONT_MOCK_PAYMENTS_ENABLED requires STOREFRONT_API_ENABLED")
	}
	if c.Scheduler.Enabled {
		if strings.TrimSpace(c.Storage.RedisURL) == "" {
			return errors.New("REDIS_URL is required when the scheduler is enabled")
		}
		if strings.TrimSpace(c.Scheduler.HostID) == "" {
			return errors.New("HOSTNAME is required when the scheduler is enabled")
		}
	}
	if c.Storefront.Enabled {
		if len(c.Storefront.JWTSecret) < 32 {
			return errors.New("STOREFRONT_JWT_SECRET must be at least 32 bytes")
		}
		if strings.TrimSpace(c.Storefront.FirebaseAPIKey) == "" {
			return errors.New("FIREBASE_API_KEY is required when Storefront is enabled")
		}
		if strings.TrimSpace(c.Storefront.ArtifactProvider) == "" || strings.TrimSpace(c.Storefront.ArtifactBucket) == "" {
			return errors.New("artifact provider and bucket are required when Storefront is enabled")
		}
		if strings.TrimSpace(c.Storefront.ArtifactAccessKeyID) == "" || strings.TrimSpace(c.Storefront.ArtifactSecretKey) == "" {
			return errors.New("artifact credentials are required when Storefront is enabled")
		}
		if strings.EqualFold(strings.TrimSpace(c.Storefront.ArtifactProvider), "minio") {
			if strings.TrimSpace(c.Storefront.ArtifactRegion) == "" {
				return errors.New("LEPOS_ARTIFACT_REGION is required for MinIO")
			}
			if !c.Storefront.ArtifactForcePathStyle {
				return errors.New("LEPOS_ARTIFACT_FORCE_PATH_STYLE must be true for MinIO")
			}
			endpoint, err := url.ParseRequestURI(strings.TrimSpace(c.Storefront.ArtifactEndpoint))
			if err != nil || (endpoint.Scheme != "http" && endpoint.Scheme != "https") || endpoint.Host == "" {
				return errors.New("LEPOS_ARTIFACT_ENDPOINT must be an absolute HTTP(S) URL for MinIO")
			}
		}
	}
	return nil
}

// ValidateEdge validates edge-only settings without coupling them to Quant or OTA.
func (c *Config) ValidateEdge() error {
	if c.RunMode != "control-plane" && c.Edge.ServiceSecret == "" && c.Environment == "production" {
		return errors.New("LEPOS_SERVICE_SECRET is required for edge in production")
	}
	return nil
}

func setDefaults(v *viper.Viper) {
	defaults := map[string]any{
		"APP_ENV": "development", "GATEWAY_RUN_MODE": "both", "HOST": "127.0.0.1", "PORT": "8081",
		"EDGE_PORT": "8088", "TLS_PORT": "8443", "QUESTDB_PG_URL": "postgresql://admin:quest@localhost:8812/qdb",
		"REDIS_URL": "redis://127.0.0.1:6379/0", "ALPACA_BASE_URL": "https://paper-api.alpaca.markets",
		"ALPACA_DATA_BASE_URL": "https://data.alpaca.markets", "STOREFRONT_API_ENABLED": false,
		"STOREFRONT_MOCK_PAYMENTS_ENABLED": false, "STOREFRONT_JWT_ISSUER": "control-gateway",
		"STOREFRONT_JWT_AUDIENCE": "ios-storefront", "STOREFRONT_ACCESS_TTL": "15m",
		"STOREFRONT_REFRESH_TTL": "720h", "LEPOS_ARTIFACT_REGION": "auto", "LEPOS_ARTIFACT_BUCKET": "lepoship-artifacts",
		"LEPOS_ARTIFACT_PROVIDER": "s3", "LEPOS_STORAGE_ROOT": ".", "LEPOS_CONTROL_PLANE_URL": "http://127.0.0.1:3000",
		"LEPOS_SERVICE_ID": "edge-gateway", "LEPOS_IPFS_GATEWAY_URL": "https://ipfs.io/ipfs",
		"LEPOS_ARWEAVE_GATEWAY_URL": "https://arweave.net", "NATS_SUBJECT_PREFIX": "control-gateway", "NATS_STREAM_NAME": "CONTROL_GATEWAY_EVENTS",
		"OUTBOX_POLL_INTERVAL": "2s", "OUTBOX_LEASE_TTL": "30s", "OUTBOX_BATCH_SIZE": 100,
		"OUTBOX_MAX_ATTEMPTS": 10, "OTEL_SERVICE_NAME": "control-gateway", "TRACING_ENABLED": true, "METRICS_ENABLED": true,
		"QUANTANT_ENABLED": false, "QUANTANT_LIVE_ENABLED": false, "QUANTANT_STRATEGY_LIVE_ENABLED": false,
		"QUANTANT_LIVE_SESSION_TTL": "5m", "QUANTANT_EXECUTION_SUBJECT": "quantant.execution.commands", "QUANTANT_COMMAND_STREAM": "QUANTANT_COMMANDS",
	}
	for key, value := range defaults {
		v.SetDefault(key, value)
	}
}

func schedulerSchedules(v *viper.Viper) map[string]string {
	defaults := map[string]string{
		"bundle-abuse": "0 0 * * * *", "retention-calculator": "0 15 1 * * *", "ab-experiments": "0 */15 * * * *",
		"ranking-calculator": "0 30 0,12 * * *", "bundle-webhooks": "0 */5 * * * *", "webhook-retry": "0 */10 * * * *",
		"ssl-renew": "0 0 3 * * *", "lepoship-outbox": "0 */2 * * * *", "lepoship-reconcile": "0 */15 * * * *",
		"cleanup-previews": "0 0 2 * * *", "cleanup-waf-logs": "0 30 2 * * *", "sync-storage": "0 0 * * * *",
	}
	schedules := map[string]string{
		"bundle-abuse":         v.GetString("LEPOS_CRON_BUNDLE_ABUSE"),
		"retention-calculator": v.GetString("LEPOS_CRON_RETENTION"),
		"ab-experiments":       v.GetString("LEPOS_CRON_AB_EXPERIMENTS"),
		"ranking-calculator":   v.GetString("LEPOS_CRON_RANKING"),
		"bundle-webhooks":      v.GetString("LEPOS_CRON_BUNDLE_WEBHOOKS"),
		"webhook-retry":        v.GetString("LEPOS_CRON_WEBHOOK_RETRY"),
		"ssl-renew":            v.GetString("LEPOS_CRON_SSL_RENEW"),
		"lepoship-outbox":      v.GetString("LEPOS_CRON_OUTBOX"),
		"lepoship-reconcile":   v.GetString("LEPOS_CRON_RECONCILE"),
		"cleanup-previews":     v.GetString("LEPOS_CRON_CLEANUP_PREVIEWS"),
		"cleanup-waf-logs":     v.GetString("LEPOS_CRON_CLEANUP_WAF"),
		"sync-storage":         v.GetString("LEPOS_CRON_SYNC_STORAGE"),
	}
	for name, fallback := range defaults {
		if schedules[name] == "" {
			schedules[name] = fallback
		}
	}
	return schedules
}
