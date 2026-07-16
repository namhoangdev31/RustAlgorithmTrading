package lepoship

import (
	"context"

	"github.com/redis/go-redis/v9"

	verificationpostgres "trading/control-gateway/internal/modules/verification/adapter/postgres"
	verifications3 "trading/control-gateway/internal/modules/verification/adapter/s3"
	verificationapp "trading/control-gateway/internal/modules/verification/application"
	"trading/control-gateway/internal/modules/verification/executor"
	"trading/control-gateway/internal/platform/cache"
	"trading/control-gateway/internal/platform/config"
	"trading/control-gateway/internal/platform/database"
)

type App struct {
	postgres *database.Postgres
	redis    *redis.Client
	worker   *executor.Worker
}

func Build(ctx context.Context, cfg *config.Config) (*App, error) {
	postgres, err := database.OpenPostgres(ctx, cfg.Storage.DatabaseURL)
	if err != nil {
		return nil, err
	}
	redisClient, err := cache.OpenRedis(ctx, cfg.Storage.RedisURL)
	if err != nil {
		_ = postgres.Close()
		return nil, err
	}
	storageCfg := executor.StorageConfig{
		Endpoint: cfg.Storefront.ArtifactEndpoint, Region: cfg.Storefront.ArtifactRegion, AccessKeyID: cfg.Storefront.ArtifactAccessKeyID,
		SecretKey: cfg.Storefront.ArtifactSecretKey, ForcePathStyle: cfg.Storefront.ArtifactForcePathStyle, Provider: cfg.Storefront.ArtifactProvider, Bucket: cfg.Storefront.ArtifactBucket,
	}
	objects, err := executor.NewObjectStore(ctx, storageCfg)
	if err != nil {
		_ = redisClient.Close()
		_ = postgres.Close()
		return nil, err
	}
	reports, err := verifications3.New(ctx, verifications3.Config{
		Endpoint: storageCfg.Endpoint, Region: storageCfg.Region, AccessKeyID: storageCfg.AccessKeyID, SecretKey: storageCfg.SecretKey,
		ForcePathStyle: storageCfg.ForcePathStyle, Provider: storageCfg.Provider, Bucket: storageCfg.Bucket,
	})
	if err != nil {
		_ = redisClient.Close()
		_ = postgres.Close()
		return nil, err
	}
	repository := verificationpostgres.New(postgres)
	service := verificationapp.New(repository, redisClient, reports)
	worker := executor.NewWorker(redisClient, service, executor.NewEngineRunner(objects, ""), executor.NewBuildRunner(verificationpostgres.NewBuildRepository(postgres), objects, ""))
	return &App{postgres: postgres, redis: redisClient, worker: worker}, nil
}

func (a *App) Run(ctx context.Context) error { defer a.Close(); return a.worker.Run(ctx) }
func (a *App) Close() error {
	if a.redis != nil {
		_ = a.redis.Close()
	}
	if a.postgres != nil {
		return a.postgres.Close()
	}
	return nil
}
