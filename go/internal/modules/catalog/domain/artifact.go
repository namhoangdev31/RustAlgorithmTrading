package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// BundleArtifact is the domain value passed to artifact signing providers.
// Persistence is owned by the generated Ent BundleArtifacts node.
type BundleArtifact struct {
	ID                uuid.UUID
	ReleaseID         uuid.UUID
	Kind              string
	StorageProvider   string
	StorageBucket     string
	StorageKey        string
	ChecksumSHA256    string
	FileSize          int64
	ContentType       string
	BaseBuildNumber   *int
	TargetBuildNumber *int
	Metadata          json.RawMessage
	CreatedAt         time.Time
}
