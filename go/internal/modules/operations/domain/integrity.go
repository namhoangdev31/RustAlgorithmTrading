package domain

// Metrics holds system metrics to be verified for integrity.
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

// Thresholds defines metrics safety boundaries.
type Thresholds struct {
	MaxPnlDriftPct              float64
	MaxExposureDriftBps         float64
	MaxLatencyRegressionRatio   float64
	AllowFallbacks              bool
	AllowReconciliationFailures bool
}

// Report holds the outcome of integrity checks.
type Report struct {
	IsValid bool
	Reasons []string
	Metrics Metrics
}
