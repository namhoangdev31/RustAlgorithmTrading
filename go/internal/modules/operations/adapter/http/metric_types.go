package httpadapter

// MetricsHistoryRequest represents the HTTP payload to retrieve telemetry history.
type metricsHistoryRequest struct {
	TimeRange   string   `json:"time_range"`
	StartTime   string   `json:"start_time"`
	EndTime     string   `json:"end_time"`
	MetricTypes []string `json:"metric_types"`
	Symbols     []string `json:"symbols"`
	Interval    string   `json:"interval"`
}
