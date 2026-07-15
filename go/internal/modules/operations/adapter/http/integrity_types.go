package httpadapter

// Metrics holds system metrics to be verified for integrity.
type metricsPayload struct {
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
