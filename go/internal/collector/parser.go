package collector

import (
	"bufio"
	"fmt"
	"strconv"
	"strings"
	"time"
)

// Parser handles Prometheus text format parsing
type Parser struct{}

func NewParser() *Parser {
	return &Parser{}
}

// Parse transforms Prometheus text format into structured Metrics
func (p *Parser) Parse(text string, service string) ([]Metric, error) {
	var metrics []Metric
	scanner := bufio.NewScanner(strings.NewReader(text))
	now := time.Now()

	var currentType MetricType = Gauge // Default

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines or plain comments
		if line == "" || (strings.HasPrefix(line, "#") && !strings.HasPrefix(line, "# TYPE")) {
			continue
		}

		// Parse TYPE hints
		if strings.HasPrefix(line, "# TYPE") {
			parts := strings.Fields(line)
			if len(parts) >= 4 {
				currentType = MetricType(strings.ToLower(parts[3]))
			}
			continue
		}

		// Parse metric values
		if !strings.HasPrefix(line, "#") {
			metric, err := p.parseLine(line, currentType, now)
			if err == nil {
				metrics = append(metrics, metric)
			}
		}
	}

	return metrics, scanner.Err()
}

func (p *Parser) parseLine(line string, mType MetricType, ts time.Time) (Metric, error) {
	// Format: metric_name{labels} value [timestamp]
	parts := strings.Fields(line)
	if len(parts) < 2 {
		return Metric{}, fmt.Errorf("invalid line format")
	}

	nameAndLabels := parts[0]
	valueStr := parts[1]

	value, err := strconv.ParseFloat(valueStr, 64)
	if err != nil {
		return Metric{}, err
	}

	name := nameAndLabels
	labels := make(map[string]string)

	if strings.Contains(nameAndLabels, "{") {
		start := strings.Index(nameAndLabels, "{")
		end := strings.LastIndex(nameAndLabels, "}")
		if start != -1 && end != -1 && end > start {
			name = nameAndLabels[:start]
			labelStr := nameAndLabels[start+1 : end]
			labels = p.parseLabels(labelStr)
		}
	}

	return Metric{
		Name:      name,
		Type:      mType,
		Value:     value,
		Labels:    labels,
		Timestamp: ts,
	}, nil
}

func (p *Parser) parseLabels(labelStr string) map[string]string {
	labels := make(map[string]string)
	// Simple comma-separated key=value parsing
	// Note: In a production environment, this should handle escaped quotes
	pairs := strings.Split(labelStr, ",")
	for _, pair := range pairs {
		kv := strings.SplitN(pair, "=", 2)
		if len(kv) == 2 {
			k := strings.TrimSpace(kv[0])
			v := strings.Trim(strings.TrimSpace(kv[1]), "\"")
			labels[k] = v
		}
	}
	return labels
}
