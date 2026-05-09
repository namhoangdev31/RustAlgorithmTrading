package collector

import (
	"time"
)

// MetricType represents the type of Prometheus metric
type MetricType string

const (
	Counter   MetricType = "counter"
	Gauge     MetricType = "gauge"
	Histogram MetricType = "histogram"
	Summary   MetricType = "summary"
)

// Metric represents a single parsed metric record
type Metric struct {
	Name      string            `json:"name"`
	Type      MetricType        `json:"type"`
	Value     float64           `json:"value"`
	Labels    map[string]string `json:"labels"`
	Timestamp time.Time         `json:"timestamp"`
}

// ScrapeResult represents the collection result from a service
type ScrapeResult struct {
	Service   string    `json:"service"`
	Timestamp time.Time `json:"timestamp"`
	Metrics   []Metric  `json:"metrics"`
	Error     error     `json:"error,omitempty"`
}
