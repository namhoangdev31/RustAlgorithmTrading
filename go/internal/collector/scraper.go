package collector

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

// Scraper handles fetching metrics from remote targets
type Scraper struct {
	client  *http.Client
	parser  *Parser
	targets map[string]string // service_name -> url
}

func NewScraper(targets map[string]string) *Scraper {
	return &Scraper{
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
		parser:  NewParser(),
		targets: targets,
	}
}

// ScrapeAll fetches metrics from all configured targets concurrently
func (s *Scraper) ScrapeAll(ctx context.Context) map[string]*ScrapeResult {
	results := make(map[string]*ScrapeResult)
	var mu sync.Mutex
	var wg sync.WaitGroup

	for name, url := range s.targets {
		wg.Add(1)
		go func(name, url string) {
			defer wg.Done()
			res := s.ScrapeService(ctx, name, url)
			mu.Lock()
			results[name] = res
			mu.Unlock()
		}(name, url)
	}

	wg.Wait()
	return results
}

// ScrapeService fetches metrics from a single service
func (s *Scraper) ScrapeService(ctx context.Context, name, url string) *ScrapeResult {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return &ScrapeResult{Service: name, Error: err}
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return &ScrapeResult{Service: name, Error: err}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return &ScrapeResult{Service: name, Error: fmt.Errorf("HTTP status %d", resp.StatusCode)}
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return &ScrapeResult{Service: name, Error: err}
	}

	metrics, err := s.parser.Parse(string(body), name)
	return &ScrapeResult{
		Service:   name,
		Timestamp: time.Now(),
		Metrics:   metrics,
		Error:     err,
	}
}
