package domain

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID
	Email        *string
	Password     *string
	Provider     string
	SocialID     *string
	FirstName    *string
	LastName     *string
	FullName     *string
	Phone        *string
	DateOfBirth  *time.Time
	Gender       *string
	UserType     string
	PhotoID      *uuid.UUID
	RegisterType *string
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    *time.Time
}
