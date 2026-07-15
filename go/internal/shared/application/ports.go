package application

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Clock interface {
	Now() time.Time
}

type IDGenerator interface {
	New() uuid.UUID
}

type Principal struct {
	UserID   string
	Email    string
	UserType string
}

type Transactor interface {
	Within(context.Context, func(context.Context) error) error
}

type Event struct {
	ID            uuid.UUID       `json:"id"`
	EventKey      string          `json:"eventKey"`
	Type          string          `json:"type"`
	Version       int             `json:"version"`
	AggregateType string          `json:"aggregateType"`
	AggregateID   string          `json:"aggregateId"`
	OccurredAt    time.Time       `json:"occurredAt"`
	CorrelationID string          `json:"correlationId,omitempty"`
	CausationID   string          `json:"causationId,omitempty"`
	Payload       json.RawMessage `json:"payload"`
}

type EventAppender interface {
	Append(context.Context, ...Event) error
}
