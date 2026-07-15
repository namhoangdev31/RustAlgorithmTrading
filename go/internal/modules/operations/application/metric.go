package application

import (
	"time"
)

type metricUseCase struct {
	repo MetricRepository
}

// NewMetricUseCase creates a new instance of MetricUseCase, returning the interface.
func NewMetricUseCase(repo MetricRepository) MetricUseCase {
	return &metricUseCase{repo: repo}
}

func (u *metricUseCase) GetCurrentMetrics(userID string) (CurrentMetrics, error) {
	payload := CurrentMetrics{Timestamp: time.Now().UTC().Format(time.RFC3339), MarketData: map[string]float64{}, Execution: map[string]float64{}, System: map[string]float64{}}
	snapshot, err := u.repo.QueryCurrentMetricsSnapshot(userID)
	if err != nil {
		return CurrentMetrics{}, err
	}
	payload.MarketData = snapshot["market_data"]
	payload.Execution = snapshot["execution"]
	payload.System = snapshot["risk"]
	if value, ok := snapshot["system"]; ok {
		payload.System = value
	}
	if payload.MarketData == nil {
		payload.MarketData = map[string]float64{}
	}
	if payload.Execution == nil {
		payload.Execution = map[string]float64{}
	}
	if payload.System == nil {
		payload.System = map[string]float64{}
	}
	summary, err := u.repo.QueryPerformanceSummary(userID)
	if err != nil {
		return CurrentMetrics{}, err
	}
	payload.Strategy = summary
	return payload, nil
}

func (u *metricUseCase) GetMetricsHistory(userID string, timeRange, startTime, endTime, interval string, metricTypes []string) (MetricsHistory, error) {
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

	data, err := u.repo.QueryMetricsHistory(userID, start, end, metricTypes)
	if err != nil {
		return MetricsHistory{}, err
	}
	return MetricsHistory{StartTime: start, EndTime: end, Interval: interval, Data: data, Count: len(data)}, nil
}

func (u *metricUseCase) GetSymbols() ([]string, error) {
	return []string{}, nil
}

func (u *metricUseCase) GetSummary(userID string) (PerformanceSummary, error) {
	return u.repo.QueryPerformanceSummary(userID)
}
