package usecase

import (
	"trading/observability-api/internal/domain/entities"
	"trading/observability-api/internal/domain/repositories"
	"trading/observability-api/internal/domain/usecases"
	"trading/observability-api/internal/health"
	"trading/observability-api/internal/integrity"
	"trading/observability-api/internal/ws"
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

func (u *systemUseCase) GetPerformance() ([]map[string]interface{}, error) {
	return u.repo.QueryPerformanceHistory(50)
}

func (u *systemUseCase) GetComponents() map[string]interface{} {
	return u.healthAggregator.ComponentsSnapshot()
}

func (u *systemUseCase) GetLogs(level string, limit int) ([]map[string]interface{}, error) {
	return u.repo.QueryLogs(level, limit)
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
	return integrity.ValidateRunIntegrity(metrics, integrity.DefaultThresholds())
}
