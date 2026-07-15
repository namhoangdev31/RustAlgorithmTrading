package config

import "testing"

func TestRunModeValidation(t *testing.T) {
	for _, mode := range []string{"both", "control-plane", "edge-gateway"} {
		cfg := Config{RunMode: mode, Environment: "development"}
		if mode != "edge-gateway" {
			cfg.Storage.DatabaseURL = "postgres://localhost/test"
			cfg.Storage.QuestDBURL = "postgres://localhost/qdb"
		}
		if err := cfg.Validate(); err != nil {
			t.Fatalf("mode %s rejected: %v", mode, err)
		}
	}
	if err := (&Config{RunMode: "unknown"}).Validate(); err == nil {
		t.Fatal("invalid run mode was accepted")
	}
}

func TestStorefrontValidation(t *testing.T) {
	base := Config{
		RunMode: "control-plane",
		Storage: Storage{DatabaseURL: "postgres://localhost/app", QuestDBURL: "postgres://localhost/qdb"},
		Storefront: Storefront{
			Enabled: true, FirebaseCredentialsFile: "/run/secrets/firebase-service-account.json", JWTSecret: "01234567890123456789012345678901",
			ArtifactProvider: "minio", ArtifactEndpoint: "http://localhost:9000", ArtifactRegion: "us-east-1",
			ArtifactAccessKeyID: "access", ArtifactSecretKey: "secret", ArtifactBucket: "artifacts", ArtifactForcePathStyle: true,
		},
	}
	if err := base.Validate(); err != nil {
		t.Fatalf("valid storefront config rejected: %v", err)
	}
	tests := []struct {
		name   string
		mutate func(*Config)
	}{
		{"firebase credentials", func(c *Config) { c.Storefront.FirebaseCredentialsFile = "" }},
		{"artifact credentials", func(c *Config) { c.Storefront.ArtifactSecretKey = "" }},
		{"minio endpoint", func(c *Config) { c.Storefront.ArtifactEndpoint = "minio:9000" }},
		{"minio path style", func(c *Config) { c.Storefront.ArtifactForcePathStyle = false }},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			cfg := base
			tc.mutate(&cfg)
			if err := cfg.Validate(); err == nil {
				t.Fatal("invalid config was accepted")
			}
		})
	}
}

func TestMockPaymentsRequireStorefront(t *testing.T) {
	cfg := Config{RunMode: "edge-gateway", Storefront: Storefront{MockPaymentsEnabled: true}}
	if err := cfg.Validate(); err == nil {
		t.Fatal("mock payments without Storefront were accepted")
	}
}

func TestComponentValidationIsIndependent(t *testing.T) {
	cfg := Config{Storage: Storage{DatabaseURL: "postgres://localhost/app"}}
	if err := cfg.ValidateOTA(); err != nil {
		t.Fatalf("OTA validation must not require Quant dependencies: %v", err)
	}
	if err := cfg.ValidateQuant(); err == nil {
		t.Fatal("Quant validation accepted a missing QuestDB URL")
	}

	cfg.Storage.QuestDBURL = "postgres://localhost/qdb"
	cfg.Storefront = Storefront{Enabled: true}
	if err := cfg.ValidateQuant(); err != nil {
		t.Fatalf("Quant validation must not require OTA Storefront dependencies: %v", err)
	}
	if err := cfg.ValidateOTA(); err == nil {
		t.Fatal("OTA validation accepted incomplete Storefront dependencies")
	}
}
