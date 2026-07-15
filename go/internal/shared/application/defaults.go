package application

import (
	"time"

	"github.com/google/uuid"
)

type UTCClock struct{}

func (UTCClock) Now() time.Time { return time.Now().UTC() }

type UUIDGenerator struct{}

func (UUIDGenerator) New() uuid.UUID { return uuid.New() }
