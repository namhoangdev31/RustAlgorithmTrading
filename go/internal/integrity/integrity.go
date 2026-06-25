package integrity

import (
	"fmt"

	"trading/observability-api/internal/models"
)

func DefaultThresholds() models.Thresholds {
	return models.Thresholds{
		MaxPnlDriftPct:              0.10,
		MaxExposureDriftBps:         5.0,
		MaxLatencyRegressionRatio:   1.50,
		AllowFallbacks:              false,
		AllowReconciliationFailures: false,
	}
}

func ValidateRunIntegrity(m models.Metrics, t models.Thresholds) models.Report {
	reasons := make([]string, 0)
	if m.PnlDriftPct > t.MaxPnlDriftPct {
		reasons = append(reasons, fmt.Sprintf("PnL drift breach: %.4f%% > %.4f%%", m.PnlDriftPct, t.MaxPnlDriftPct))
	}
	if m.ExposureDriftBps > t.MaxExposureDriftBps {
		reasons = append(reasons, fmt.Sprintf("Exposure drift breach: %.4f bps > %.4f bps", m.ExposureDriftBps, t.MaxExposureDriftBps))
	}
	if m.FalseAllowDelta != 0 {
		reasons = append(reasons, fmt.Sprintf("False-allow delta detected: %d", m.FalseAllowDelta))
	}
	if m.FalseRejectDelta != 0 {
		reasons = append(reasons, fmt.Sprintf("False-reject delta detected: %d", m.FalseRejectDelta))
	}
	if m.BlockedDelta != 0 {
		reasons = append(reasons, fmt.Sprintf("Blocked signal delta detected: %d", m.BlockedDelta))
	}
	if m.CrashCount > 0 {
		reasons = append(reasons, fmt.Sprintf("Runtime crashes detected: %d", m.CrashCount))
	}
	if m.TimeoutCount > 0 {
		reasons = append(reasons, fmt.Sprintf("Runtime timeouts detected: %d", m.TimeoutCount))
	}
	if !t.AllowFallbacks && m.FallbackCount > 0 {
		reasons = append(reasons, fmt.Sprintf("Unsanctioned fallback to legacy code: %d", m.FallbackCount))
	}
	if !t.AllowReconciliationFailures && m.ReconciliationFailureCount > 0 {
		reasons = append(reasons, fmt.Sprintf("State reconciliation failures: %d", m.ReconciliationFailureCount))
	}
	if m.LatencyRegressionRatio > t.MaxLatencyRegressionRatio {
		reasons = append(reasons, fmt.Sprintf("Latency regression: %.2fx > %.2fx", m.LatencyRegressionRatio, t.MaxLatencyRegressionRatio))
	}
	return models.Report{IsValid: len(reasons) == 0, Reasons: reasons, Metrics: m}
}
