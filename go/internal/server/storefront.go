package server

import (
	"context"
	"log/slog"

	"github.com/gin-gonic/gin"

	"trading/control-gateway/internal/config"
	"trading/control-gateway/internal/delivery/http/handlers"
	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/middleware"
	artifactRepo "trading/control-gateway/internal/repository/artifact"
	firebaseRepo "trading/control-gateway/internal/repository/firebase"
	postgresRepo "trading/control-gateway/internal/repository/postgres"
	"trading/control-gateway/internal/storage"
	"trading/control-gateway/internal/usecase"
)

type StorefrontModule struct {
	AuthHandler       *handlers.AuthStorefrontHandler
	StorefrontHandler *handlers.StorefrontHandler
	AuthMiddleware    gin.HandlerFunc
	AdminMiddleware   gin.HandlerFunc
}

func ProvideStorefrontModule(cfg *config.Config, store *storage.Store) *StorefrontModule {
	if cfg == nil || !cfg.Storefront.Enabled {
		return nil
	}
	repo, err := postgresRepo.NewStorefrontRepository(store)
	if err != nil {
		slog.Warn("storefront_runtime_disabled", "error", err)
		return nil
	}
	firebaseClient := firebaseRepo.NewClient(cfg.Storefront.FirebaseAPIKey)
	authService := usecase.NewAuthService(repo, firebaseClient, usecase.AuthConfig{
		SigningSecret: cfg.Storefront.JWTSecret, Issuer: cfg.Storefront.JWTIssuer, Audience: cfg.Storefront.JWTAudience,
		AccessTTL: cfg.Storefront.AccessTTL, RefreshTTL: cfg.Storefront.RefreshTTL,
	})
	var signer repositories.ArtifactSigner
	configuredSigner, err := artifactRepo.NewS3Signer(context.Background(), artifactRepo.S3Config{
		Endpoint: cfg.Storefront.ArtifactEndpoint, Region: cfg.Storefront.ArtifactRegion,
		AccessKeyID: cfg.Storefront.ArtifactAccessKeyID, SecretAccessKey: cfg.Storefront.ArtifactSecretKey,
		ForcePathStyle: cfg.Storefront.ArtifactForcePathStyle,
	})
	if err != nil {
		slog.Warn("storefront_artifact_signer_unavailable", "error", err)
	} else {
		signer = configuredSigner
	}
	storefrontService := usecase.NewStorefrontService(repo, signer, cfg.Storefront.MockPaymentsEnabled)
	return &StorefrontModule{
		AuthHandler:       handlers.NewAuthStorefrontHandler(authService),
		StorefrontHandler: handlers.NewStorefrontHandler(storefrontService),
		AuthMiddleware:    middleware.RequireStorefrontAuth(authService),
		AdminMiddleware:   middleware.RequireStorefrontAdmin(),
	}
}
