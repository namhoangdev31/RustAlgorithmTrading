package entities

// MetricsHistoryRequest represents the HTTP payload to retrieve telemetry history.
type MetricsHistoryRequest struct {
	TimeRange   string   `json:"time_range"`
	StartTime   string   `json:"start_time"`
	EndTime     string   `json:"end_time"`
	MetricTypes []string `json:"metric_types"`
	Symbols     []string `json:"symbols"`
	Interval    string   `json:"interval"`
}

// MetricSymbol represents a ticker metadata lookup.
type MetricSymbol struct {
	Symbol string `json:"symbol"`
}
