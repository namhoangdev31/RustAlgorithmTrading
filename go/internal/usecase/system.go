package usecase

import (
	"encoding/json"

	"trading/control-gateway/internal/domain/entities"
	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/domain/usecases"
	"trading/control-gateway/internal/health"
	"trading/control-gateway/internal/ws"
)

type systemUseCase struct {
	repo             repositories.SystemRepository
	healthAggregator *health.Aggregator
	wsManager        *ws.Manager
}

// NewSystemUseCase creates a new instance of SystemUseCase, returning the interface.
func NewSystemUseCase(repo repositories.SystemRepository, healthAggregator *health.Aggregator, wsManager *ws.Manager) usecases.SystemUseCase {
	return &systemUseCase{
		repo:             repo,
		healthAggregator: healthAggregator,
		wsManager:        wsManager,
	}
}

func (u *systemUseCase) GetPerformance(userID string) ([]map[string]interface{}, error) {
	return u.repo.QueryPerformanceHistory(userID, 50)
}

func (u *systemUseCase) GetComponents() map[string]interface{} {
	return u.healthAggregator.ComponentsSnapshot()
}

func (u *systemUseCase) GetLogs(userID string, level string, limit int) ([]map[string]interface{}, error) {
	return u.repo.QueryLogs(userID, level, limit)
}

func (u *systemUseCase) GetStats() map[string]interface{} {
	connCount := 0
	var wsStats map[string]interface{}
	if u.wsManager != nil {
		connCount = u.wsManager.ConnectionCount()
		wsStats = u.wsManager.Stats()
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

func (u *systemUseCase) ValidateIntegrity(metrics entities.Metrics) entities.Report {
	// Defaults to "admin" or global system user for backend validation
	raw, err := u.repo.QueryLatestIntegrityReport("admin")
	if err != nil {
		return entities.Report{IsValid: true, Reasons: []string{}, Metrics: metrics}
	}
	payload, err := json.Marshal(raw)
	if err != nil {
		return entities.Report{IsValid: true, Reasons: []string{}, Metrics: metrics}
	}
	var report entities.Report
	if err := json.Unmarshal(payload, &report); err != nil {
		return entities.Report{IsValid: true, Reasons: []string{}, Metrics: metrics}
	}
	if report.Metrics == (entities.Metrics{}) {
		report.Metrics = metrics
	}
	return report
}
