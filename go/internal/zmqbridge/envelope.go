package zmqbridge

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"trading/observability-api/internal/domain/entities"
)

const SchemaVersion = "v1.0.0"

type Validator struct {
	Strict bool
}

func BuildEnvelope(correlationID, eventType string, payload map[string]any) entities.Envelope {
	if payload == nil {
		payload = map[string]any{}
	}
	return entities.Envelope{
		SchemaVersion: SchemaVersion,
		CorrelationID: correlationID,
		EventType:     eventType,
		Timestamp:     time.Now().UTC().Format(time.RFC3339Nano),
		Payload:       payload,
	}
}

func (v Validator) Validate(e entities.Envelope) error {
	if strings.TrimSpace(e.SchemaVersion) == "" {
		return errors.New("missing schema_version")
	}
	if strings.TrimSpace(e.CorrelationID) == "" {
		return errors.New("missing correlation_id")
	}
	if strings.TrimSpace(e.EventType) == "" {
		return errors.New("missing event_type")
	}
	if strings.TrimSpace(e.Timestamp) == "" {
		return errors.New("missing timestamp")
	}
	if e.Payload == nil {
		return errors.New("missing payload")
	}
	if _, err := time.Parse(time.RFC3339Nano, e.Timestamp); err != nil {
		return fmt.Errorf("invalid timestamp: %w", err)
	}
	if v.Strict && e.SchemaVersion != SchemaVersion {
		return fmt.Errorf("schema mismatch expected=%s got=%s", SchemaVersion, e.SchemaVersion)
	}
	return nil
}

func Decode(raw []byte, strict bool) (entities.Envelope, error) {
	var e entities.Envelope
	if err := json.Unmarshal(raw, &e); err != nil {
		return entities.Envelope{}, err
	}
	if err := (Validator{Strict: strict}).Validate(e); err != nil {
		return entities.Envelope{}, err
	}
	return e, nil
}

func Encode(e entities.Envelope) ([]byte, error) {
	return json.Marshal(e)
}
