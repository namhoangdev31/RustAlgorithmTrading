package application

import "trading/control-gateway/internal/modules/operations/domain"

type AlertRepository interface {
	Create(map[string]any) domain.Incident
	Acknowledge(string, string) (domain.Incident, error)
	Resolve(string, string) (domain.Incident, error)
	List() map[string]domain.Incident
}

type MetricRepository interface {
	QueryPerformanceSummary(string) (PerformanceSummary, error)
	QueryCurrentMetricsSnapshot(string) (MetricSnapshot, error)
	QueryMetricsHistory(string, string, string, []string) ([]MetricPoint, error)
}

type SystemRepository interface {
	QueryPerformanceHistory(string, int) ([]PerformancePoint, error)
	QueryLogs(string, string, int) ([]SystemLog, error)
	QueryLatestIntegrityReport(string) (domain.Report, error)
}

type HealthProvider interface{ ComponentsSnapshot() map[string]any }
type ConnectionStats interface {
	ConnectionCount() int
	Stats() map[string]any
}
type Broadcaster interface{ Broadcast(map[string]any) }

type AlertUseCase interface {
	CreateIncident(map[string]any) domain.Incident
	AcknowledgeIncident(string, string) (domain.Incident, error)
	ResolveIncident(string, string) (domain.Incident, error)
	ListIncidents() map[string]domain.Incident
	AcknowledgeAlert(string) (map[string]any, error)
}

type MetricUseCase interface {
	GetCurrentMetrics(string) (CurrentMetrics, error)
	GetMetricsHistory(string, string, string, string, string, []string) (MetricsHistory, error)
	GetSymbols() ([]string, error)
	GetSummary(string) (PerformanceSummary, error)
}

type SystemUseCase interface {
	GetPerformance(string) ([]PerformancePoint, error)
	GetComponents() map[string]any
	GetLogs(string, string, int) ([]SystemLog, error)
	GetStats() map[string]any
	ValidateIntegrity(domain.Metrics) domain.Report
}

type PerformanceSummary struct {
	PortfolioValue float64 `json:"portfolio_value"`
	PNL            float64 `json:"pnl"`
	TotalTrades    int64   `json:"total_trades"`
}

type MetricSnapshot map[string]map[string]float64

type MetricPoint struct {
	Timestamp  string  `json:"timestamp"`
	MetricName string  `json:"metric_name"`
	Value      float64 `json:"value"`
	Symbol     *string `json:"symbol,omitempty"`
	Labels     *string `json:"labels,omitempty"`
}

type CurrentMetrics struct {
	Timestamp  string             `json:"timestamp"`
	MarketData map[string]float64 `json:"market_data"`
	Strategy   PerformanceSummary `json:"strategy"`
	Execution  map[string]float64 `json:"execution"`
	System     map[string]float64 `json:"system"`
}

type MetricsHistory struct {
	StartTime string        `json:"start_time"`
	EndTime   string        `json:"end_time"`
	Interval  string        `json:"interval"`
	Data      []MetricPoint `json:"data"`
	Count     int           `json:"count"`
}

type PerformancePoint struct {
	Timestamp      string   `json:"timestamp"`
	PortfolioValue float64  `json:"portfolio_value"`
	PNL            float64  `json:"pnl"`
	SharpeRatio    *float64 `json:"sharpe_ratio,omitempty"`
	MaxDrawdown    *float64 `json:"max_drawdown,omitempty"`
}

type SystemLog struct {
	Timestamp string  `json:"timestamp"`
	EventType string  `json:"event_type"`
	Severity  string  `json:"severity"`
	Message   string  `json:"message"`
	Details   *string `json:"details,omitempty"`
}
