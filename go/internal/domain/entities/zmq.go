package entities

// Envelope represents an incoming/outgoing ZeroMQ event container.
type Envelope struct {
	SchemaVersion string         `json:"schema_version"`
	CorrelationID string         `json:"correlation_id"`
	EventType     string         `json:"event_type"`
	Timestamp     string         `json:"timestamp"`
	Payload       map[string]any `json:"payload"`
}
