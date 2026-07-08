package entities

// Metrics holds system metrics to be verified for integrity.
type Metrics struct {
	PnlDriftPct                float64 `json:"pnl_drift_pct"`
	ExposureDriftBps           float64 `json:"exposure_drift_bps"`
	FalseAllowDelta            int     `json:"false_allow_delta"`
	FalseRejectDelta           int     `json:"false_reject_delta"`
	BlockedDelta               int     `json:"blocked_delta"`
	TimeoutCount               int     `json:"timeout_count"`
	CrashCount                 int     `json:"crash_count"`
	FallbackCount              int     `json:"fallback_count"`
	ReconciliationFailureCount int     `json:"reconciliation_failure_count"`
	LatencyRegressionRatio     float64 `json:"latency_regression_ratio"`
}

// Thresholds defines metrics safety boundaries.
type Thresholds struct {
	MaxPnlDriftPct              float64 `json:"max_pnl_drift_pct"`
	MaxExposureDriftBps         float64 `json:"max_exposure_drift_bps"`
	MaxLatencyRegressionRatio   float64 `json:"max_latency_regression_ratio"`
	AllowFallbacks              bool    `json:"allow_fallbacks"`
	AllowReconciliationFailures bool    `json:"allow_reconciliation_failures"`
}

// Report holds the outcome of integrity checks.
type Report struct {
	IsValid bool     `json:"is_valid"`
	Reasons []string `json:"reasons"`
	Metrics Metrics  `json:"metrics"`
}
