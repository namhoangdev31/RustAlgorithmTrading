package questdb

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	entsql "entgo.io/ent/dialect/sql"

	"trading/control-gateway/internal/data/ent"
	"trading/control-gateway/internal/data/ent/riskevent"
	"trading/control-gateway/internal/modules/operations/application"
	domain "trading/control-gateway/internal/modules/operations/domain"
	"trading/control-gateway/internal/platform/database"
	"trading/control-gateway/internal/shared/apperror"
)

type SystemRepository struct {
	db     *sql.DB
	client *ent.Client
}

func NewSystemRepository(questdb *database.QuestDB, client *ent.Client) application.SystemRepository {
	return &SystemRepository{db: questdb.DB(), client: client}
}

func (r *SystemRepository) QueryPerformanceHistory(userID string, limit int) ([]application.PerformancePoint, error) {
	if r.db == nil {
		return nil, apperror.ErrUnavailable
	}
	if limit <= 0 {
		limit = 100
	}
	rows, err := r.db.Query(`SELECT timestamp, portfolio_value, pnl, sharpe_ratio, max_drawdown FROM performance_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2`, defaultUser(userID), limit)
	if err != nil {
		return nil, unavailable("query performance history", err)
	}
	defer rows.Close()
	result := make([]application.PerformancePoint, 0, limit)
	for rows.Next() {
		var point application.PerformancePoint
		var sharpe, drawdown sql.NullFloat64
		if err := rows.Scan(&point.Timestamp, &point.PortfolioValue, &point.PNL, &sharpe, &drawdown); err != nil {
			return nil, unavailable("scan performance history", err)
		}
		if sharpe.Valid {
			point.SharpeRatio = &sharpe.Float64
		}
		if drawdown.Valid {
			point.MaxDrawdown = &drawdown.Float64
		}
		result = append(result, point)
	}
	if err := rows.Err(); err != nil {
		return nil, unavailable("iterate performance history", err)
	}
	return result, nil
}

func (r *SystemRepository) QueryLogs(userID, level string, limit int) ([]application.SystemLog, error) {
	if limit <= 0 {
		limit = 100
	}
	if level == "" {
		level = "INFO"
	}
	if r.client != nil {
		rows, err := r.client.RiskEvent.Query().Where(riskevent.SeverityHasPrefix(level)).Order(riskevent.ByOccurredAt(entsql.OrderDesc())).Limit(limit).All(context.Background())
		if err != nil {
			return nil, fmt.Errorf("query risk event logs: %w", err)
		}
		result := make([]application.SystemLog, 0, len(rows))
		for _, row := range rows {
			result = append(result, application.SystemLog{Timestamp: row.OccurredAt.Format(time.RFC3339), EventType: row.EventType, Severity: row.Severity, Message: row.Message})
		}
		return result, nil
	}
	if r.db == nil {
		return nil, apperror.ErrUnavailable
	}
	rows, err := r.db.Query(`SELECT timestamp, event_type, severity, message, details FROM system_events WHERE user_id = $1 AND (severity = $2 OR $3 = 'ALL') ORDER BY timestamp DESC LIMIT $4`, defaultUser(userID), level, level, limit)
	if err != nil {
		return nil, unavailable("query system logs", err)
	}
	defer rows.Close()
	result := make([]application.SystemLog, 0, limit)
	for rows.Next() {
		var item application.SystemLog
		var eventType, severity, message, details sql.NullString
		if err := rows.Scan(&item.Timestamp, &eventType, &severity, &message, &details); err != nil {
			return nil, unavailable("scan system logs", err)
		}
		item.EventType, item.Severity, item.Message, item.Details = eventType.String, severity.String, message.String, nullableString(details)
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, unavailable("iterate system logs", err)
	}
	return result, nil
}

func (r *SystemRepository) QueryLatestIntegrityReport(userID string) (domain.Report, error) {
	if r.db == nil {
		return domain.Report{}, apperror.ErrUnavailable
	}
	var timestamp string
	var details sql.NullString
	err := r.db.QueryRow(`SELECT timestamp, details FROM system_events WHERE user_id = $1 AND event_type = 'risk.kill_switch' ORDER BY timestamp DESC LIMIT 1`, defaultUser(userID)).Scan(&timestamp, &details)
	if err == sql.ErrNoRows {
		return domain.Report{IsValid: true, Reasons: []string{}}, nil
	}
	if err != nil {
		return domain.Report{}, unavailable("query integrity report", err)
	}
	if !details.Valid || details.String == "" {
		return domain.Report{IsValid: true, Reasons: []string{}}, nil
	}
	var payload struct {
		IsValid bool           `json:"is_valid"`
		Reasons []string       `json:"reasons"`
		Metrics domain.Metrics `json:"metrics"`
	}
	if err := json.Unmarshal([]byte(details.String), &payload); err != nil {
		return domain.Report{}, unavailable("decode integrity report", err)
	}
	return domain.Report{IsValid: payload.IsValid, Reasons: payload.Reasons, Metrics: payload.Metrics}, nil
}
