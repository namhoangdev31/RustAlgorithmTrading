package integrity

import "fmt"

type Metrics struct {
	PnlDriftPct                float64
	ExposureDriftBps           float64
	FalseAllowDelta            int
	FalseRejectDelta           int
	BlockedDelta               int
	TimeoutCount               int
	CrashCount                 int
	FallbackCount              int
	ReconciliationFailureCount int
	LatencyRegressionRatio     float64
}

type Thresholds struct {
	MaxPnlDriftPct              float64
	MaxExposureDriftBps         float64
	MaxLatencyRegressionRatio   float64
	AllowFallbacks              bool
	AllowReconciliationFailures bool
}

type Report struct {
	IsValid bool
	Reasons []string
	Metrics Metrics
}

func DefaultThresholds() Thresholds {
	return Thresholds{
		MaxPnlDriftPct:              0.10,
		MaxExposureDriftBps:         5.0,
		MaxLatencyRegressionRatio:   1.50,
		AllowFallbacks:              false,
		AllowReconciliationFailures: false,
	}
}

func ValidateRunIntegrity(m Metrics, t Thresholds) Report {
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
	return Report{IsValid: len(reasons) == 0, Reasons: reasons, Metrics: m}
}
