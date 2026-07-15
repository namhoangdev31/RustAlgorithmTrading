package questdb

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"trading/control-gateway/internal/modules/operations/application"
	"trading/control-gateway/internal/platform/database"
	"trading/control-gateway/internal/shared/apperror"
)

type MetricRepository struct{ db *sql.DB }

func NewMetricRepository(reader *database.QuestDB) application.MetricRepository {
	return &MetricRepository{db: reader.DB()}
}

func (r *MetricRepository) QueryMetricsHistory(userID, start, end string, metricTypes []string) ([]application.MetricPoint, error) {
	if r.db == nil {
		return nil, apperror.ErrUnavailable
	}
	userID = defaultUser(userID)
	query := `SELECT timestamp, metric_name, value, symbol, labels FROM trading_metrics WHERE user_id = $1 AND timestamp >= $2::timestamp AND timestamp <= $3::timestamp`
	args := []any{userID, start, end}
	if len(metricTypes) > 0 {
		placeholders := make([]string, 0, len(metricTypes))
		for _, metricType := range metricTypes {
			args = append(args, metricType)
			placeholders = append(placeholders, fmt.Sprintf("$%d", len(args)))
		}
		query += " AND metric_name IN (" + strings.Join(placeholders, ",") + ")"
	}
	rows, err := r.db.Query(query+" ORDER BY timestamp DESC LIMIT 5000", args...)
	if err != nil {
		return nil, unavailable("query metrics history", err)
	}
	defer rows.Close()
	result := make([]application.MetricPoint, 0, 128)
	for rows.Next() {
		var point application.MetricPoint
		var symbol, labels sql.NullString
		if err := rows.Scan(&point.Timestamp, &point.MetricName, &point.Value, &symbol, &labels); err != nil {
			return nil, unavailable("scan metrics history", err)
		}
		point.Symbol, point.Labels = nullableString(symbol), nullableString(labels)
		result = append(result, point)
	}
	if err := rows.Err(); err != nil {
		return nil, unavailable("iterate metrics history", err)
	}
	return result, nil
}

func (r *MetricRepository) QueryCurrentMetricsSnapshot(userID string) (application.MetricSnapshot, error) {
	if r.db == nil {
		return nil, apperror.ErrUnavailable
	}
	rows, err := r.db.Query(`SELECT metric_name, value, labels FROM trading_metrics WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 5000`, defaultUser(userID))
	if err != nil {
		return nil, unavailable("query current metrics", err)
	}
	defer rows.Close()
	result := application.MetricSnapshot{}
	seen := map[string]struct{}{}
	for rows.Next() {
		var metricName string
		var value float64
		var labels sql.NullString
		if err := rows.Scan(&metricName, &value, &labels); err != nil {
			return nil, unavailable("scan current metrics", err)
		}
		service := parseLabels(labels)["service"]
		key := service + "|" + metricName
		if service == "" {
			continue
		}
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		if result[service] == nil {
			result[service] = map[string]float64{}
		}
		result[service][metricName] = value
	}
	if err := rows.Err(); err != nil {
		return nil, unavailable("iterate current metrics", err)
	}
	return result, nil
}

func (r *MetricRepository) QueryPerformanceSummary(userID string) (application.PerformanceSummary, error) {
	if r.db == nil {
		return application.PerformanceSummary{}, apperror.ErrUnavailable
	}
	var result application.PerformanceSummary
	err := r.db.QueryRow(`SELECT portfolio_value, pnl, total_trades FROM performance_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 1`, defaultUser(userID)).
		Scan(&result.PortfolioValue, &result.PNL, &result.TotalTrades)
	if err == sql.ErrNoRows {
		return result, nil
	}
	if err != nil {
		return application.PerformanceSummary{}, unavailable("query performance summary", err)
	}
	return result, nil
}

func defaultUser(userID string) string {
	if strings.TrimSpace(userID) == "" {
		return "admin"
	}
	return userID
}

func nullableString(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	result := value.String
	return &result
}

func parseLabels(labels sql.NullString) map[string]string {
	result := map[string]string{}
	if !labels.Valid || labels.String == "" {
		return result
	}
	if json.Unmarshal([]byte(labels.String), &result) == nil {
		return result
	}
	for _, pair := range strings.Split(labels.String, ",") {
		parts := strings.SplitN(pair, "=", 2)
		if len(parts) == 2 {
			result[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
		}
	}
	return result
}

func unavailable(operation string, cause error) error {
	return apperror.Wrap(apperror.CodeUnavailable, operation, cause)
}
