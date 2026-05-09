package worker

import (
	"time"

	"trading/observability-api/internal/collector"
	"trading/observability-api/internal/storage"
	"trading/observability-api/internal/ws"
)

// MetricsCollector broadcasts control-plane metrics at 10Hz.
type MetricsCollector struct {
	store        *storage.Store
	wsManager    *ws.Manager
	collectorMgr *collector.Manager
	interval     time.Duration
	stop         chan struct{}
}

func NewMetricsCollector(store *storage.Store, wsManager *ws.Manager, collectorMgr *collector.Manager) *MetricsCollector {
	return &MetricsCollector{
		store:        store,
		wsManager:    wsManager,
		collectorMgr: collectorMgr,
		interval:     100 * time.Millisecond,
		stop:         make(chan struct{}),
	}
}

func (m *MetricsCollector) Start() {
	ticker := time.NewTicker(m.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			latest := m.collectorMgr.GetLatestMetrics()
			
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

			if m.store != nil && m.store.DuckDB() != nil && time.Now().Unix()%5 == 0 {
				summary, err := m.store.DuckDB().QueryPerformanceSummary()
				if err == nil {
					payload["strategy"] = summary
				}
			}
			m.wsManager.BroadcastJSON(payload)
		case <-m.stop:
			return
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
