package collector

import (
	"context"
	"log"
	"strings"
	"sync"
	"time"

	"trading/observability-api/internal/storage"
)

// Manager orchestrates the metrics collection process
type Manager struct {
	scraper       *Scraper
	store         *storage.Store
	interval      time.Duration
	stop          chan struct{}
	mu            sync.RWMutex
	latestMetrics map[string]interface{}
}

func NewManager(store *storage.Store, targets map[string]string) *Manager {
	return &Manager{
		scraper:       NewScraper(targets),
		store:         store,
		interval:      1 * time.Second,
		stop:          make(chan struct{}),
		latestMetrics: make(map[string]any),
	}
}

// Start runs the continuous collection loop
func (m *Manager) Start(ctx context.Context) {
	ticker := time.NewTicker(m.interval)
	defer ticker.Stop()

	log.Printf("[Collector] Starting Go metrics collection loop (interval: %v)", m.interval)

	for {
		select {
		case <-ticker.C:
			sCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
			results := m.scraper.ScrapeAll(sCtx)
			cancel()

			m.processResults(results)

		case <-m.stop:
			log.Println("[Collector] Stopping Go metrics collection loop")
			return
		case <-ctx.Done():
			return
		}
	}
}

// processResults handles the scraped metrics and writes them to DuckDB
func (m *Manager) processResults(results map[string]*ScrapeResult) {
	if m.store == nil || m.store.DuckDB() == nil {
		log.Println("[Collector] Storage or DuckDB not available, skipping ingestion")
		return
	}

	var metricsToInsert []map[string]interface{}
	totalMetrics := 0
	errors := 0

	for service, res := range results {
		if res.Error != nil {
			log.Printf("[Collector] Error scraping %s: %v", service, res.Error)
			errors++
			continue
		}

		for _, metric := range res.Metrics {
			// Map to storage schema: timestamp, metric_name, value, symbol, labels
			record := map[string]interface{}{
				"timestamp":   metric.Timestamp.Format(time.RFC3339),
				"metric_name": metric.Name,
				"value":       metric.Value,
				"symbol":      metric.Labels["symbol"], // Can be empty
			}

			// Convert remaining labels to JSON string or simple kv string for storage
			var labels []string
			for k, v := range metric.Labels {
				if k != "symbol" {
					labels = append(labels, k+"="+v)
				}
			}
			if len(labels) > 0 {
				record["labels"] = strings.Join(labels, ",")
			} else {
				record["labels"] = nil
			}

			metricsToInsert = append(metricsToInsert, record)
		}
		totalMetrics += len(res.Metrics)
	}

	if len(metricsToInsert) > 0 {
		err := m.store.DuckDB().InsertMetrics(metricsToInsert)
		if err != nil {
			log.Printf("[Collector] Failed to insert %d metrics: %v", len(metricsToInsert), err)
		} else {
			log.Printf("[Collector] Successfully ingested %d metrics from %d services",
				totalMetrics, len(results))
		}
	}

	// Update latest metrics for WS fanout
	m.mu.Lock()
	defer m.mu.Unlock()

	newLatest := make(map[string]interface{})
	for service, res := range results {
		if res.Error == nil {
			serviceMetrics := make(map[string]interface{})
			for _, m := range res.Metrics {
				serviceMetrics[m.Name] = m.Value
			}
			newLatest[service] = serviceMetrics
		}
	}
	m.latestMetrics = newLatest
}

// GetLatestMetrics returns a snapshot of the most recently scraped metrics
func (m *Manager) GetLatestMetrics() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Return a copy to avoid race conditions on the map itself
	snapshot := make(map[string]interface{})
	for k, v := range m.latestMetrics {
		snapshot[k] = v
	}
	return snapshot
}

func (m *Manager) Stop() {
	close(m.stop)
}
