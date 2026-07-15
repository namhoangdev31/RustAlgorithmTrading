package application

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type CheckoutResult struct {
	TransactionID string
	Status        string
	ReceiptURL    string
}

type PaymentMethod struct {
	ID        string
	Type      string
	Brand     string
	Last4     string
	IsDefault bool
}

type Repository interface {
	MockCheckout(context.Context, uuid.UUID, string, string, time.Time) (CheckoutResult, error)
}
