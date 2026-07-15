package application

import "trading/control-gateway/internal/modules/operations/domain"

type AlertRepository interface {
	Create(map[string]any) domain.Incident
	Acknowledge(string, string) (domain.Incident, error)
	Resolve(string, string) (domain.Incident, error)
	List() map[string]domain.Incident
}

type MetricRepository interface {
	QueryPerformanceSummary(string) (map[string]any, error)
	QueryCurrentMetricsSnapshot(string) (map[string]any, error)
	QueryMetricsHistory(string, string, string, []string) ([]map[string]any, error)
}

type SystemRepository interface {
	QueryPerformanceHistory(string, int) ([]map[string]any, error)
	QueryLogs(string, string, int) ([]map[string]any, error)
	QueryLatestIntegrityReport(string) (map[string]any, error)
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
	GetCurrentMetrics(string) (map[string]any, error)
	GetMetricsHistory(string, string, string, string, string, []string) (map[string]any, error)
	GetSymbols() ([]string, error)
	GetSummary(string) (map[string]any, error)
}

type SystemUseCase interface {
	GetPerformance(string) ([]map[string]any, error)
	GetComponents() map[string]any
	GetLogs(string, string, int) ([]map[string]any, error)
	GetStats() map[string]any
	ValidateIntegrity(domain.Metrics) domain.Report
}
