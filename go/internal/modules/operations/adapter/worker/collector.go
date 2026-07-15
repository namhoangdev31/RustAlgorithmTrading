package worker

import (
	"context"
	"time"

	"trading/control-gateway/internal/modules/operations/application"
)

// MetricsCollector broadcasts control-plane metrics at 10Hz.
type MetricsCollector struct {
	metrics     application.MetricRepository
	broadcaster interface{ BroadcastJSON(map[string]any) }
	interval    time.Duration
	stop        chan struct{}
}

func New(metrics application.MetricRepository, broadcaster interface{ BroadcastJSON(map[string]any) }) *MetricsCollector {
	return &MetricsCollector{
		metrics: metrics, broadcaster: broadcaster,
		interval: 100 * time.Millisecond,
		stop:     make(chan struct{}),
	}
}

func (m *MetricsCollector) Start() {
	ticker := time.NewTicker(m.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			latest := m.latestMetricsSnapshot()

			payload := map[string]interface{}{
				"timestamp":   time.Now().Unix(),
				"market_data": latest["market_data"],
				"strategy":    map[string]interface{}{},
				"execution":   latest["execution"],
				"system":      latest["risk"], // Risk is part of system/risk in Go
			}

			// Fill in some system health if missing
			if payload["system"] == nil {
				payload["system"] = map[string]interface{}{
					"health": "healthy",
				}
			}

			if m.metrics != nil && time.Now().Unix()%5 == 0 {
				summary, err := m.metrics.QueryPerformanceSummary("admin")
				if err == nil {
					payload["strategy"] = summary
				}
			}
			if m.broadcaster != nil {
				m.broadcaster.BroadcastJSON(payload)
			}
		case <-m.stop:
			return
		}
	}
}

func (m *MetricsCollector) latestMetricsSnapshot() map[string]interface{} {
	if m.metrics != nil {
		if latest, err := m.metrics.QueryCurrentMetricsSnapshot("admin"); err == nil {
			return latest
		}
	}
	return map[string]interface{}{}
}

func (m *MetricsCollector) Run(ctx context.Context) error {
	ticker := time.NewTicker(m.interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			latest := m.latestMetricsSnapshot()
			payload := map[string]any{"timestamp": time.Now().Unix(), "market_data": latest["market_data"], "strategy": map[string]any{}, "execution": latest["execution"], "system": latest["risk"]}
			if payload["system"] == nil {
				payload["system"] = map[string]any{"health": "healthy"}
			}
			if m.broadcaster != nil {
				m.broadcaster.BroadcastJSON(payload)
			}
		}
	}
}

func (m *MetricsCollector) Stop() {
	select {
	case <-m.stop:
		return
	default:
		close(m.stop)
	}
}
