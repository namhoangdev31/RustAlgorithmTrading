package integrity

import (
	"testing"

	"trading/observability-api/internal/models"
)

func TestValidateRunIntegrityPass(t *testing.T) {
	r := ValidateRunIntegrity(models.Metrics{}, DefaultThresholds())
	if !r.IsValid {
		t.Fatalf("expected valid report, reasons=%v", r.Reasons)
	}
}

func TestValidateRunIntegrityFail(t *testing.T) {
	m := models.Metrics{PnlDriftPct: 0.2, FalseAllowDelta: 1, TimeoutCount: 2}
	r := ValidateRunIntegrity(m, DefaultThresholds())
	if r.IsValid {
		t.Fatal("expected invalid report")
	}
	if len(r.Reasons) < 3 {
		t.Fatalf("expected >=3 reasons, got %d", len(r.Reasons))
	}
}
