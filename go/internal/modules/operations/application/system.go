package application

import (
	"encoding/json"

	domain "trading/control-gateway/internal/modules/operations/domain"
)

type systemUseCase struct {
	repo        SystemRepository
	health      HealthProvider
	connections ConnectionStats
}

// NewSystemUseCase creates a new instance of SystemUseCase, returning the interface.
func NewSystemUseCase(repo SystemRepository, health HealthProvider, connections ConnectionStats) SystemUseCase {
	return &systemUseCase{
		repo:        repo,
		health:      health,
		connections: connections,
	}
}

func (u *systemUseCase) GetPerformance(userID string) ([]map[string]interface{}, error) {
	return u.repo.QueryPerformanceHistory(userID, 50)
}

func (u *systemUseCase) GetComponents() map[string]interface{} {
	if u.health == nil {
		return map[string]any{}
	}
	return u.health.ComponentsSnapshot()
}

func (u *systemUseCase) GetLogs(userID string, level string, limit int) ([]map[string]interface{}, error) {
	return u.repo.QueryLogs(userID, level, limit)
}

func (u *systemUseCase) GetStats() map[string]interface{} {
	connCount := 0
	var wsStats map[string]interface{}
	if u.connections != nil {
		connCount = u.connections.ConnectionCount()
		wsStats = u.connections.Stats()
	}
	var totalMsgs interface{}
	if wsStats != nil {
		totalMsgs = wsStats["total_messages_sent"]
	}
	return map[string]interface{}{
		"api": map[string]interface{}{
			"running":               true,
			"websocket_connections": connCount,
			"total_messages_sent":   totalMsgs,
		},
		"collectors": map[string]interface{}{},
	}
}

func (u *systemUseCase) ValidateIntegrity(metrics domain.Metrics) domain.Report {
	// Defaults to "admin" or global system user for backend validation
	raw, err := u.repo.QueryLatestIntegrityReport("admin")
	if err != nil {
		return domain.Report{IsValid: true, Reasons: []string{}, Metrics: metrics}
	}
	payload, err := json.Marshal(raw)
	if err != nil {
		return domain.Report{IsValid: true, Reasons: []string{}, Metrics: metrics}
	}
	var report domain.Report
	if err := json.Unmarshal(payload, &report); err != nil {
		return domain.Report{IsValid: true, Reasons: []string{}, Metrics: metrics}
	}
	if report.Metrics == (domain.Metrics{}) {
		report.Metrics = metrics
	}
	return report
}
