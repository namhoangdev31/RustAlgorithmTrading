package models

import (
	"encoding/json"
	"time"
)

// Order represents an order in the PostgreSQL database.
type Order struct {
	ID          int32     `json:"id" db:"id"`
	OrderID     string    `json:"order_id" db:"order_id"`
	Symbol      string    `json:"symbol" db:"symbol"`
	Side        string    `json:"side" db:"side"`
	OrderType   string    `json:"order_type" db:"order_type"`
	Quantity    float64   `json:"quantity" db:"quantity"`
	Price       *float64  `json:"price" db:"price"`
	Status      string    `json:"status" db:"status"`
	SubmittedAt time.Time `json:"submitted_at" db:"submitted_at"`
}

// RiskEvent represents a system event or risk violation logged in the PostgreSQL database.
type RiskEvent struct {
	ID         int32           `json:"id" db:"id"`
	EventType  string          `json:"event_type" db:"event_type"`
	Severity   string          `json:"severity" db:"severity"`
	Message    string          `json:"message" db:"message"`
	Metadata   json.RawMessage `json:"metadata" db:"metadata"`
	OccurredAt time.Time       `json:"occurred_at" db:"occurred_at"`
}

// Alpaca API Models

type Account struct {
	Cash           float64 `json:"cash,string"`
	PortfolioValue float64 `json:"portfolio_value,string"`
	BuyingPower    float64 `json:"buying_power,string"`
	Equity         float64 `json:"equity,string"`
	Status         string  `json:"status"`
}

type Position struct {
	Symbol       string  `json:"symbol"`
	Qty          float64 `json:"qty,string"`
	AvgEntry     float64 `json:"avg_entry_price,string"`
	CurrentPrice float64 `json:"current_price,string"`
	MarketValue  float64 `json:"market_value,string"`
	UnrealizedPL float64 `json:"unrealized_pl,string"`
}

type OrderRequest struct {
	Symbol      string `json:"symbol"`
	Qty         string `json:"qty"`
	Side        string `json:"side"`
	Type        string `json:"type"`
	TimeInForce string `json:"time_in_force"`
}

type OrderResponse struct {
	ID        string `json:"id"`
	Status    string `json:"status"`
	Symbol    string `json:"symbol"`
	CreatedAt string `json:"created_at"`
}

// Alert / Incident Models

type Status string

const (
	StatusNew          Status = "NEW"
	StatusAcknowledged Status = "ACKNOWLEDGED"
	StatusResolved     Status = "RESOLVED"
)

type Incident struct {
	ID            string                 `json:"incident_id"`
	Severity      string                 `json:"severity"`
	Component     string                 `json:"component"`
	ReasonCode    string                 `json:"reason_code"`
	CorrelationID string                 `json:"correlation_id"`
	Status        Status                 `json:"status"`
	Owner         string                 `json:"owner,omitempty"`
	Evidence      string                 `json:"evidence,omitempty"`
	CreatedAt     time.Time              `json:"created_at"`
	UpdatedAt     time.Time              `json:"updated_at"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

// Integrity validation models

type Metrics struct {
	PnlDriftPct                float64
	ExposureDriftBps           float64
	FalseAllowDelta            int
	FalseRejectDelta           int
	BlockedDelta               int
	TimeoutCount               int
	CrashCount                 int
	FallbackCount              int
	ReconciliationFailureCount int
	LatencyRegressionRatio     float64
}

type Thresholds struct {
	MaxPnlDriftPct              float64
	MaxExposureDriftBps         float64
	MaxLatencyRegressionRatio   float64
	AllowFallbacks              bool
	AllowReconciliationFailures bool
}

type Report struct {
	IsValid bool
	Reasons []string
	Metrics Metrics
}

// ZMQ Bridge Models

type Envelope struct {
	SchemaVersion string         `json:"schema_version"`
	CorrelationID string         `json:"correlation_id"`
	EventType     string         `json:"event_type"`
	Timestamp     string         `json:"timestamp"`
	Payload       map[string]any `json:"payload"`
}

// Edge Gateway routing models

type RegionRoute struct {
	ID                 string         `json:"id"`
	Provider           string         `json:"provider"`
	Region             string         `json:"region"`
	Endpoint           string         `json:"endpoint"`
	BundleURL          string         `json:"bundleUrl"`
	StoragePath        string         `json:"storagePath"`
	HealthStatus       string         `json:"healthStatus"`
	DrainState         string         `json:"drainState"`
	LatencyMs          *int           `json:"latencyMs"`
	TrafficPercent     int            `json:"trafficPercent"`
	IsPrimary          bool           `json:"isPrimary"`
	ReplicationVersion string         `json:"replicationVersion"`
	VectorClock        map[string]int `json:"vectorClock"`
	LastHeartbeatAt    string         `json:"lastHeartbeatAt"`
}

type ArtifactMirror struct {
	ID       string `json:"id"`
	Provider string `json:"provider"`
	Policy   string `json:"policy"`
	Status   string `json:"status"`
	Locator  string `json:"locator"`
	CID      string `json:"cid"`
	TxID     string `json:"txId"`
}

type RoutingPolicy struct {
	Strategy                   string   `json:"strategy"`
	StickySessions             bool     `json:"stickySessions"`
	ManualFailback             bool     `json:"manualFailback"`
	FailoverThresholdMs        int      `json:"failoverThresholdMs"`
	SnapshotTTLSeconds         int      `json:"snapshotTtlSeconds"`
	LatencyProbeIntervalSecond int      `json:"latencyProbeIntervalSeconds"`
	PreferredRegions           []string `json:"preferredRegions"`
}

type RouteSnapshot struct {
	ProjectID       string           `json:"projectId"`
	DeploymentID    string           `json:"deploymentId"`
	Target          string           `json:"target"`
	StoragePath     string           `json:"storagePath"`
	BundleURL       string           `json:"bundleUrl"`
	Domain          string           `json:"domain"`
	SSLStatus       string           `json:"sslStatus"`
	PrimaryRegion   string           `json:"primaryRegion"`
	Consistency     string           `json:"consistency"`
	DrainState      string           `json:"drainState"`
	RoutingPolicy   RoutingPolicy    `json:"routingPolicy"`
	Regions         []RegionRoute    `json:"regions"`
	ArtifactMirrors []ArtifactMirror `json:"artifactMirrors"`
}

// HTTP request DTOs

type MetricsHistoryRequest struct {
	TimeRange   string   `json:"time_range"`
	StartTime   string   `json:"start_time"`
	EndTime     string   `json:"end_time"`
	MetricTypes []string `json:"metric_types"`
	Symbols     []string `json:"symbols"`
	Interval    string   `json:"interval"`
}
