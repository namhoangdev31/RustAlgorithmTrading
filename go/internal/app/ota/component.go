package ota

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/redis/go-redis/v9"
	"golang.org/x/sync/errgroup"

	cataloghttp "trading/control-gateway/internal/modules/catalog/adapter/http"
	catalogpostgres "trading/control-gateway/internal/modules/catalog/adapter/postgres"
	catalogs3 "trading/control-gateway/internal/modules/catalog/adapter/s3"
	catalogapp "trading/control-gateway/internal/modules/catalog/application"
	commercehttp "trading/control-gateway/internal/modules/commerce/adapter/http"
	commercepostgres "trading/control-gateway/internal/modules/commerce/adapter/postgres"
	commerceapp "trading/control-gateway/internal/modules/commerce/application"
	distributionhttp "trading/control-gateway/internal/modules/distribution/adapter/http"
	distributionpostgres "trading/control-gateway/internal/modules/distribution/adapter/postgres"
	distributionredis "trading/control-gateway/internal/modules/distribution/adapter/redis"
	distributionscheduler "trading/control-gateway/internal/modules/distribution/adapter/scheduler"
	distributionapp "trading/control-gateway/internal/modules/distribution/application"
	engagementhttp "trading/control-gateway/internal/modules/engagement/adapter/http"
	engagementpostgres "trading/control-gateway/internal/modules/engagement/adapter/postgres"
	engagementapp "trading/control-gateway/internal/modules/engagement/application"
	identityfirebase "trading/control-gateway/internal/modules/identity/adapter/firebase"
	identityhttp "trading/control-gateway/internal/modules/identity/adapter/http"
	identitypostgres "trading/control-gateway/internal/modules/identity/adapter/postgres"
	identityapp "trading/control-gateway/internal/modules/identity/application"
	"trading/control-gateway/internal/platform/cache"
	"trading/control-gateway/internal/platform/config"
	"trading/control-gateway/internal/platform/database"
	"trading/control-gateway/internal/platform/events"
	"trading/control-gateway/internal/platform/health"
)

// Component owns OTA, Storefront, LepoShip distribution, and their workers.
// Quant Trading adapters are intentionally absent from this composition root.
type Component struct {
	distribution    *distributionhttp.Handler
	identity        *identityhttp.Handler
	catalog         *cataloghttp.Handler
	commerce        *commercehttp.Handler
	engagement      *engagementhttp.Handler
	identityService identityhttp.AccessTokenVerifier
	scheduler       *distributionscheduler.Scheduler
	dispatcher      *events.Dispatcher
	checks          []health.DependencyCheck
	postgres        *database.Postgres
	redis           *redis.Client
	nats            *nats.Conn
	closeOnce       sync.Once
}

func Build(ctx context.Context, cfg *config.Config) (*Component, error) {
	if err := cfg.ValidateOTA(); err != nil {
		return nil, fmt.Errorf("validate ota: %w", err)
	}
	postgres, err := database.OpenPostgres(ctx, cfg.Storage.DatabaseURL)
	if err != nil {
		return nil, err
	}
	component := &Component{postgres: postgres}
	built := false
	defer func() {
		if !built {
			_ = component.Close()
		}
	}()

	if cfg.Storage.RedisURL != "" {
		component.redis, err = cache.OpenRedis(ctx, cfg.Storage.RedisURL)
		if err != nil {
			if cfg.Scheduler.Enabled {
				return nil, fmt.Errorf("connect ota scheduler redis: %w", err)
			}
			slog.Warn("ota_redis_unavailable", "error", err)
			component.redis = nil
		}
	}

	var jetStream *events.JetStreamPublisher
	if cfg.Events.NATSURL != "" {
		component.nats, err = nats.Connect(cfg.Events.NATSURL)
		if err != nil {
			return nil, fmt.Errorf("connect ota nats: %w", err)
		}
		jetStream, err = events.NewJetStreamPublisher(component.nats, cfg.Events.SubjectPrefix, cfg.Events.StreamName)
		if err != nil {
			return nil, err
		}
	}

	distributionRepo, err := distributionpostgres.New(postgres.Ent(), distributionpostgres.Config{
		DevicePepper: cfg.Scheduler.DevicePepper, EncryptionKey: cfg.Scheduler.EncryptionKey,
		ArtifactBucket: cfg.Storefront.ArtifactBucket, ArtifactProvider: cfg.Storefront.ArtifactProvider,
		ArtifactPublicURL: cfg.Storefront.ArtifactPublicURL, PreviewCleanupURL: cfg.Scheduler.PreviewCleanupURL,
		PreviewCleanupToken: cfg.Scheduler.PreviewCleanupToken, CleanupDBOnly: cfg.Scheduler.CleanupDBOnly,
		StorageSyncURL: cfg.Scheduler.StorageSyncURL, StorageSyncToken: cfg.Scheduler.StorageSyncToken,
		SSLRenewalURL: cfg.Scheduler.SSLRenewalURL, SSLRenewalToken: cfg.Scheduler.SSLRenewalToken,
		SchedulerEnabled: cfg.Scheduler.Enabled, Schedules: cfg.Scheduler.Schedules,
	})
	if err != nil {
		return nil, err
	}
	distributionService := distributionapp.NewService(distributionRepo)
	component.distribution = distributionhttp.New(distributionService, component.redis, cfg.Edge.ServiceSecret)
	var distributedLock distributionapp.DistributedLock
	if component.redis != nil {
		distributedLock = distributionredis.NewLock(component.redis)
	}
	component.scheduler = distributionscheduler.New(distributionService, distributedLock, distributionscheduler.Config{
		Enabled: cfg.Scheduler.Enabled, HostID: cfg.Scheduler.HostID, Schedules: cfg.Scheduler.Schedules,
	})
	if err := component.scheduler.RegisterDefaults(); err != nil {
		return nil, fmt.Errorf("register ota scheduler: %w", err)
	}

	localBus := events.NewLocalBus()
	var remote events.Publisher
	if jetStream != nil {
		remote = jetStream
	}
	component.dispatcher = events.NewDispatcher(events.NewOutboxStore(postgres), events.NewCompositePublisher(localBus, remote), events.DispatcherConfig{
		Interval: cfg.Events.OutboxInterval, LeaseTTL: cfg.Events.OutboxLeaseTTL,
		BatchSize: cfg.Events.OutboxBatch, MaxAttempts: cfg.Events.MaxAttempts,
	})

	var artifactSigner *catalogs3.S3Signer
	component.identity, component.catalog, component.commerce, component.engagement, component.identityService, artifactSigner, err = buildStorefront(ctx, cfg, postgres)
	if err != nil {
		return nil, err
	}
	component.checks = []health.DependencyCheck{
		{Name: "ota_postgres", Required: true, Check: func() error { return postgres.Ping(context.Background()) }},
	}
	if cfg.Scheduler.Enabled {
		component.checks = append(component.checks, health.DependencyCheck{Name: "ota_redis", Required: true, Check: func() error {
			if component.redis == nil {
				return errors.New("redis not configured")
			}
			return component.redis.Ping(context.Background()).Err()
		}})
	}
	if cfg.Events.NATSURL != "" {
		component.checks = append(component.checks, health.DependencyCheck{Name: "ota_jetstream", Required: true, Check: func() error {
			if component.nats == nil || !component.nats.IsConnected() || jetStream == nil {
				return errors.New("jetstream not connected")
			}
			return jetStream.Check(context.Background())
		}})
	}
	if cfg.Storefront.Enabled {
		component.checks = append(component.checks, health.DependencyCheck{Name: "ota_artifact_storage", Required: true, Check: func() error {
			if artifactSigner == nil {
				return errors.New("artifact storage not configured")
			}
			checkCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
			defer cancel()
			return artifactSigner.Check(checkCtx, cfg.Storefront.ArtifactBucket)
		}})
	}
	built = true
	return component, nil
}

func buildStorefront(ctx context.Context, cfg *config.Config, postgres *database.Postgres) (*identityhttp.Handler, *cataloghttp.Handler, *commercehttp.Handler, *engagementhttp.Handler, *identityapp.Service, *catalogs3.S3Signer, error) {
	if !cfg.Storefront.Enabled {
		return nil, nil, nil, nil, nil, nil, nil
	}
	identityRepo, err := identitypostgres.New(postgres.Ent())
	if err != nil {
		return nil, nil, nil, nil, nil, nil, err
	}
	firebaseClient, err := identityfirebase.NewClient(ctx, identityfirebase.Config{
		CredentialsFile: cfg.Storefront.FirebaseCredentialsFile,
		ProjectID:       cfg.Storefront.FirebaseProjectID,
	})
	if err != nil {
		return nil, nil, nil, nil, nil, nil, fmt.Errorf("initialize firebase admin: %w", err)
	}
	identityService := identityapp.NewService(identityRepo, firebaseClient, identityapp.Config{
		SigningSecret: cfg.Storefront.JWTSecret, Issuer: cfg.Storefront.JWTIssuer, Audience: cfg.Storefront.JWTAudience,
		AccessTTL: cfg.Storefront.AccessTTL, RefreshTTL: cfg.Storefront.RefreshTTL,
	})
	catalogRepo, err := catalogpostgres.New(postgres.Ent())
	if err != nil {
		return nil, nil, nil, nil, nil, nil, err
	}
	signer, err := catalogs3.NewS3Signer(ctx, catalogs3.S3Config{
		Endpoint: cfg.Storefront.ArtifactEndpoint, Region: cfg.Storefront.ArtifactRegion,
		AccessKeyID: cfg.Storefront.ArtifactAccessKeyID, SecretAccessKey: cfg.Storefront.ArtifactSecretKey,
		ForcePathStyle: cfg.Storefront.ArtifactForcePathStyle,
	})
	if err != nil {
		return nil, nil, nil, nil, nil, nil, fmt.Errorf("configure ota artifact signer: %w", err)
	}
	catalogService := catalogapp.NewService(catalogRepo, signer)
	commerceRepo, err := commercepostgres.New(postgres)
	if err != nil {
		return nil, nil, nil, nil, nil, nil, err
	}
	commerceService := commerceapp.NewService(commerceRepo, postgres, events.NewOutboxStore(postgres), cfg.Storefront.MockPaymentsEnabled)
	engagementRepo, err := engagementpostgres.New(postgres.Ent())
	if err != nil {
		return nil, nil, nil, nil, nil, nil, err
	}
	return identityhttp.New(identityService), cataloghttp.NewHandler(catalogService), commercehttp.New(commerceService), engagementhttp.New(engagementapp.NewService(engagementRepo)), identityService, signer, nil
}

func (c *Component) ReadinessChecks() []health.DependencyCheck { return c.checks }

func (c *Component) AccessTokenVerifier() identityhttp.AccessTokenVerifier {
	if c == nil {
		return nil
	}
	return c.identityService
}

func (c *Component) Run(ctx context.Context) error {
	c.scheduler.Start()
	group, runCtx := errgroup.WithContext(ctx)
	group.Go(func() error { return c.dispatcher.Run(runCtx) })
	err := group.Wait()
	c.scheduler.Stop()
	_ = c.Close()
	return err
}

func (c *Component) Close() error {
	var closeErr error
	c.closeOnce.Do(func() {
		if c.nats != nil {
			c.nats.Close()
		}
		if c.redis != nil {
			closeErr = errors.Join(closeErr, c.redis.Close())
		}
		closeErr = errors.Join(closeErr, c.postgres.Close())
	})
	return closeErr
}
