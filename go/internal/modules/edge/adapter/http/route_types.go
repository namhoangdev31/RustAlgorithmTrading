package httpadapter

// RegionRoute represents metadata of a region gateway service routing.
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

// ArtifactMirror represents config details for asset store mirrors.
type ArtifactMirror struct {
	ID       string `json:"id"`
	Provider string `json:"provider"`
	Policy   string `json:"policy"`
	Status   string `json:"status"`
	Locator  string `json:"locator"`
	CID      string `json:"cid"`
	TxID     string `json:"txId"`
}

// RoutingPolicy defines strategies for requests allocation and failovers.
type RoutingPolicy struct {
	Strategy                   string   `json:"strategy"`
	StickySessions             bool     `json:"stickySessions"`
	ManualFailback             bool     `json:"manualFailback"`
	FailoverThresholdMs        int      `json:"failoverThresholdMs"`
	SnapshotTTLSeconds         int      `json:"snapshotTtlSeconds"`
	LatencyProbeIntervalSecond int      `json:"latencyProbeIntervalSeconds"`
	PreferredRegions           []string `json:"preferredRegions"`
}

// RouteSnapshot holds the snapshot of routing route nodes.
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
