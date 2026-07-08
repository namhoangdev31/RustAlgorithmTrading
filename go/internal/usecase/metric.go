package usecase

import (
	"time"
	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/domain/usecases"
)

type metricUseCase struct {
	repo repositories.MetricRepository
}

// NewMetricUseCase creates a new instance of MetricUseCase, returning the interface.
func NewMetricUseCase(repo repositories.MetricRepository) usecases.MetricUseCase {
	return &metricUseCase{repo: repo}
}

func (u *metricUseCase) GetCurrentMetrics() (map[string]interface{}, error) {
	now := time.Now().UTC().Format(time.RFC3339)
	payload := map[string]interface{}{
		"timestamp":   now,
		"market_data": map[string]interface{}{},
		"strategy":    map[string]interface{}{},
		"execution":   map[string]interface{}{},
		"system":      map[string]interface{}{},
	}
	snapshot, err := u.repo.QueryCurrentMetricsSnapshot()
	if err == nil {
		if value, ok := snapshot["market_data"]; ok {
			payload["market_data"] = value
		}
		if value, ok := snapshot["execution"]; ok {
			payload["execution"] = value
		}
		if value, ok := snapshot["risk"]; ok {
			payload["system"] = value
		}
		if value, ok := snapshot["system"]; ok {
			payload["system"] = value
		}
	}
	summary, err := u.repo.QueryPerformanceSummary()
	if err == nil {
		payload["strategy"] = summary
	}
	return payload, nil
}

func (u *metricUseCase) GetMetricsHistory(timeRange, startTime, endTime, interval string, metricTypes []string) (map[string]interface{}, error) {
	now := time.Now().UTC()
	start := startTime
	end := endTime

	if end == "" {
		end = now.Format("2006-01-02 15:04:05")
	}
	if start == "" {
		switch timeRange {
		case "1h":
			start = now.Add(-1 * time.Hour).Format("2006-01-02 15:04:05")
		case "7d":
			start = now.Add(-7 * 24 * time.Hour).Format("2006-01-02 15:04:05")
		case "30d":
			start = now.Add(-30 * 24 * time.Hour).Format("2006-01-02 15:04:05")
		default:
			start = now.Add(-24 * time.Hour).Format("2006-01-02 15:04:05")
		}
	}

	data, err := u.repo.QueryMetricsHistory(start, end, metricTypes)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"start_time": start,
		"end_time":   end,
		"interval":   interval,
		"data":       data,
		"count":      len(data),
	}, nil
}

func (u *metricUseCase) GetSymbols() ([]string, error) {
	return []string{}, nil
}

func (u *metricUseCase) GetSummary() (map[string]interface{}, error) {
	return u.repo.QueryPerformanceSummary()
}
