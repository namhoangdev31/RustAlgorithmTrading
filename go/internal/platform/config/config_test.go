package config

import "testing"

func TestRunModeValidation(t *testing.T) {
	for _, mode := range []string{"both", "control-plane", "edge-gateway"} {
		cfg := Config{RunMode: mode, Environment: "development"}
		if err := cfg.Validate(); err != nil {
			t.Fatalf("mode %s rejected: %v", mode, err)
		}
	}
	if err := (&Config{RunMode: "unknown"}).Validate(); err == nil {
		t.Fatal("invalid run mode was accepted")
	}
}
