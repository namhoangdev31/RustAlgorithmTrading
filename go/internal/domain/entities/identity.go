package entities

import (
	"time"

	"github.com/google/uuid"
)

// User is the authentication domain contract. Persistence is owned by the
// generated Ent User node and mapped at the repository boundary.
type User struct {
	ID           uuid.UUID  `json:"id"`
	Email        *string    `json:"email"`
	Password     *string    `json:"-"`
	Provider     string     `json:"provider"`
	SocialID     *string    `json:"socialId"`
	FirstName    *string    `json:"firstName"`
	LastName     *string    `json:"lastName"`
	FullName     *string    `json:"fullName"`
	Phone        *string    `json:"phone"`
	DateOfBirth  *time.Time `json:"dateOfBirth"`
	Gender       *string    `json:"gender"`
	UserType     string     `json:"userType"`
	PhotoID      *uuid.UUID `json:"-"`
	RegisterType *string    `json:"registerType"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	DeletedAt    *time.Time `json:"-"`
}
