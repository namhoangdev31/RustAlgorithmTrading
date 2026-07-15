package controlplane

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

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
	operationsalerts "trading/control-gateway/internal/modules/operations/adapter/alerts"
	operationshealth "trading/control-gateway/internal/modules/operations/adapter/health"
	operationshttp "trading/control-gateway/internal/modules/operations/adapter/http"
	operationsquestdb "trading/control-gateway/internal/modules/operations/adapter/questdb"
	operationsworker "trading/control-gateway/internal/modules/operations/adapter/worker"
	operationsws "trading/control-gateway/internal/modules/operations/adapter/ws"
	operationsapp "trading/control-gateway/internal/modules/operations/application"
	tradingalpaca "trading/control-gateway/internal/modules/trading/adapter/alpaca"
	tradinghttp "trading/control-gateway/internal/modules/trading/adapter/http"
	tradingpostgres "trading/control-gateway/internal/modules/trading/adapter/postgres"
	tradingredis "trading/control-gateway/internal/modules/trading/adapter/redis"
	tradingapp "trading/control-gateway/internal/modules/trading/application"
	"trading/control-gateway/internal/platform/cache"
	"trading/control-gateway/internal/platform/config"
	"trading/control-gateway/internal/platform/database"
	"trading/control-gateway/internal/platform/events"
	"trading/control-gateway/internal/platform/httpserver"
)

type App struct {
	server     *httpserver.Server
	collector  *operationsworker.MetricsCollector
	websocket  *operationsws.Manager
	scheduler  *distributionscheduler.Scheduler
	dispatcher *events.Dispatcher
	postgres   *database.Postgres
	questdb    *database.QuestDB
	redis      *redis.Client
	nats       *nats.Conn
}

func Build(ctx context.Context, cfg *config.Config) (*App, error) {
	var postgres *database.Postgres
	var questdb *database.QuestDB
	var redisClient *redis.Client
	var natsConnection *nats.Conn
	built := false
	defer func() {
		if built {
			return
		}
		if natsConnection != nil {
			natsConnection.Close()
		}
		if redisClient != nil {
			_ = redisClient.Close()
		}
		if questdb != nil {
			_ = questdb.Close()
		}
		if postgres != nil {
			_ = postgres.Close()
		}
	}()
	var err error
	if cfg.Storage.DatabaseURL != "" {
		postgres, err = database.OpenPostgres(ctx, cfg.Storage.DatabaseURL)
		if err != nil {
			return nil, err
		}
	}
	var qerr error
	questdb, qerr = database.NewQuestDBReader(cfg.Storage.QuestDBURL)
	if qerr != nil {
		slog.Warn("questdb_unavailable", "error", qerr)
		questdb = nil
	}
	var rerr error
	redisClient, rerr = cache.OpenRedis(ctx, cfg.Storage.RedisURL)
	if rerr != nil {
		slog.Warn("redis_unavailable", "error", rerr)
		redisClient = nil
	}

	if cfg.Events.NATSURL != "" {
		natsConnection, err = nats.Connect(cfg.Events.NATSURL)
		if err != nil {
			return nil, fmt.Errorf("connect nats: %w", err)
		}
	}
	requiredChecks := map[string]func() error{}
	if cfg.Events.NATSURL != "" {
		requiredChecks["nats"] = func() error {
			if natsConnection == nil || !natsConnection.IsConnected() {
				return errors.New("nats not connected")
			}
			return nil
		}
	}
	wsManager := operationsws.NewManager()
	health := operationshealth.New(func() error {
		if questdb == nil {
			return errors.New("questdb not configured")
		}
		return questdb.Ping()
	}, func() error {
		if postgres == nil {
			return errors.New("postgres not configured")
		}
		return postgres.Ping(context.Background())
	}, wsManager, requiredChecks)
	metricRepo := operationsquestdb.NewMetricRepository(questdb)
	systemRepo := operationsquestdb.NewSystemRepository(questdb, database.EntClient(postgres))
	incidentRepo := operationsalerts.NewManager()
	alertHandler := operationshttp.NewAlertHandler(operationsapp.NewAlertUseCase(incidentRepo))
	metricHandler := operationshttp.NewMetricHandler(operationsapp.NewMetricUseCase(metricRepo))
	systemHandler := operationshttp.NewSystemHandler(operationsapp.NewSystemUseCase(systemRepo, health, wsManager))
	collector := operationsworker.New(metricRepo, wsManager)

	tradeHandler := tradinghttp.NewTradeHandler(tradingapp.NewTradeUseCase(tradingpostgres.NewTradeRepository(database.EntClient(postgres))))
	riskRepo := tradingpostgres.NewRiskLimitsRepository(database.EntClient(postgres))
	var riskPublisher tradingapp.RiskPublisher
	if redisClient != nil {
		riskPublisher = tradingredis.NewPublisher(redisClient)
	}
	riskHandler := tradinghttp.NewRiskLimitsHandler(tradingapp.NewRiskLimitsUseCase(riskRepo, riskPublisher))
	var alpacaRepo tradingapp.AlpacaRepository
	if client, clientErr := tradingalpaca.NewClient(tradingalpaca.Config{BaseURL: cfg.Alpaca.BaseURL, DataBaseURL: cfg.Alpaca.DataBaseURL, APIKey: cfg.Alpaca.APIKey, SecretKey: cfg.Alpaca.SecretKey}); clientErr == nil {
		alpacaRepo = client
	}
	alpacaHandler := tradinghttp.NewAlpacaHandler(tradingapp.NewAlpacaUseCase(alpacaRepo))

	var distributionHandler *distributionhttp.Handler
	var scheduler *distributionscheduler.Scheduler
	var dispatcher *events.Dispatcher
	if postgres != nil {
		distributionRepo, repoErr := distributionpostgres.New(postgres.Ent(), distributionpostgres.Config{DevicePepper: cfg.Scheduler.DevicePepper, EncryptionKey: cfg.Scheduler.EncryptionKey, ArtifactBucket: cfg.Storefront.ArtifactBucket, ArtifactProvider: cfg.Storefront.ArtifactProvider, ArtifactPublicURL: cfg.Storefront.ArtifactPublicURL, PreviewCleanupURL: cfg.Scheduler.PreviewCleanupURL, PreviewCleanupToken: cfg.Scheduler.PreviewCleanupToken, CleanupDBOnly: cfg.Scheduler.CleanupDBOnly, StorageSyncURL: cfg.Scheduler.StorageSyncURL, StorageSyncToken: cfg.Scheduler.StorageSyncToken, SSLRenewalURL: cfg.Scheduler.SSLRenewalURL, SSLRenewalToken: cfg.Scheduler.SSLRenewalToken, SchedulerEnabled: cfg.Scheduler.Enabled, Schedules: cfg.Scheduler.Schedules})
		if repoErr != nil {
			return nil, repoErr
		}
		distributionService := distributionapp.NewService(distributionRepo)
		distributionHandler = distributionhttp.New(distributionService, redisClient, cfg.Edge.ServiceSecret)
		var distributedLock distributionapp.DistributedLock
		if redisClient != nil {
			distributedLock = distributionredis.NewLock(redisClient)
		}
		scheduler = distributionscheduler.New(distributionService, distributedLock, distributionscheduler.Config{Enabled: cfg.Scheduler.Enabled, HostID: cfg.Scheduler.HostID, Schedules: cfg.Scheduler.Schedules})
		if err := scheduler.RegisterDefaults(); err != nil {
			return nil, fmt.Errorf("register scheduler: %w", err)
		}
		local := events.NewLocalBus()
		var remote events.Publisher
		if natsConnection != nil {
			remote, err = events.NewJetStreamPublisher(natsConnection, cfg.Events.SubjectPrefix)
			if err != nil {
				return nil, err
			}
		}
		dispatcher = events.NewDispatcher(events.NewOutboxStore(postgres), events.NewCompositePublisher(local, remote), events.DispatcherConfig{Interval: cfg.Events.OutboxInterval, LeaseTTL: cfg.Events.OutboxLeaseTTL, BatchSize: cfg.Events.OutboxBatch, MaxAttempts: cfg.Events.MaxAttempts})
	}

	identityHandler, catalogHandler, commerceHandler, engagementHandler, identityService, err := buildStorefront(ctx, cfg, postgres)
	if err != nil {
		return nil, err
	}
	router := NewRouter(RouterDependencies{ServiceName: cfg.Observability.ServiceName, APIKey: cfg.Server.TelemetryAPIKey, Health: health, WebSocket: wsManager, Alerts: alertHandler, Alpaca: alpacaHandler, Metrics: metricHandler, Trades: tradeHandler, System: systemHandler, Risk: riskHandler, Distribution: distributionHandler, Identity: identityHandler, Catalog: catalogHandler, Commerce: commerceHandler, Engagement: engagementHandler, IdentityService: identityService})
	built = true
	return &App{server: httpserver.New(cfg.Server.Host+":"+cfg.Server.Port, router), collector: collector, websocket: wsManager, scheduler: scheduler, dispatcher: dispatcher, postgres: postgres, questdb: questdb, redis: redisClient, nats: natsConnection}, nil
}

func buildStorefront(ctx context.Context, cfg *config.Config, postgres *database.Postgres) (*identityhttp.Handler, *cataloghttp.Handler, *commercehttp.Handler, *engagementhttp.Handler, *identityapp.Service, error) {
	if !cfg.Storefront.Enabled || postgres == nil {
		return nil, nil, nil, nil, nil, nil
	}
	identityRepo, err := identitypostgres.New(postgres.Ent())
	if err != nil {
		return nil, nil, nil, nil, nil, err
	}
	identityService := identityapp.NewService(identityRepo, identityfirebase.NewClient(cfg.Storefront.FirebaseAPIKey), identityapp.Config{SigningSecret: cfg.Storefront.JWTSecret, Issuer: cfg.Storefront.JWTIssuer, Audience: cfg.Storefront.JWTAudience, AccessTTL: cfg.Storefront.AccessTTL, RefreshTTL: cfg.Storefront.RefreshTTL})
	catalogRepo, err := catalogpostgres.New(postgres.Ent())
	if err != nil {
		return nil, nil, nil, nil, nil, err
	}
	var signer catalogapp.ArtifactSigner
	if value, signerErr := catalogs3.NewS3Signer(ctx, catalogs3.S3Config{Endpoint: cfg.Storefront.ArtifactEndpoint, Region: cfg.Storefront.ArtifactRegion, AccessKeyID: cfg.Storefront.ArtifactAccessKeyID, SecretAccessKey: cfg.Storefront.ArtifactSecretKey, ForcePathStyle: cfg.Storefront.ArtifactForcePathStyle}); signerErr == nil {
		signer = value
	}
	catalogService := catalogapp.NewService(catalogRepo, signer)
	commerceRepo, err := commercepostgres.New(postgres)
	if err != nil {
		return nil, nil, nil, nil, nil, err
	}
	outbox := events.NewOutboxStore(postgres)
	commerceService := commerceapp.NewService(commerceRepo, postgres, outbox, cfg.Storefront.MockPaymentsEnabled)
	engagementRepo, err := engagementpostgres.New(postgres.Ent())
	if err != nil {
		return nil, nil, nil, nil, nil, err
	}
	return identityhttp.New(identityService), cataloghttp.NewHandler(catalogService), commercehttp.New(commerceService), engagementhttp.New(engagementapp.NewService(engagementRepo)), identityService, nil
}

func (a *App) Run(ctx context.Context) error {
	go a.websocket.Start()
	if a.scheduler != nil {
		a.scheduler.Start()
	}
	group, runCtx := errgroup.WithContext(ctx)
	group.Go(func() error { return a.server.Run(runCtx) })
	group.Go(func() error { return a.collector.Run(runCtx) })
	if a.dispatcher != nil {
		group.Go(func() error { return a.dispatcher.Run(runCtx) })
	}
	err := group.Wait()
	if a.scheduler != nil {
		a.scheduler.Stop()
	}
	a.websocket.Stop()
	a.close()
	return err
}

func (a *App) close() {
	if a.nats != nil {
		a.nats.Close()
	}
	if a.redis != nil {
		_ = a.redis.Close()
	}
	if a.questdb != nil {
		_ = a.questdb.Close()
	}
	if a.postgres != nil {
		_ = a.postgres.Close()
	}
}
