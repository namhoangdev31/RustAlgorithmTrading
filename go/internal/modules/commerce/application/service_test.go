package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	shared "trading/control-gateway/internal/shared/application"
)

func TestCheckoutAppendsEventInsideTransaction(t *testing.T) {
	repository := &checkoutRepositoryFake{result: CheckoutResult{TransactionID: "order-1", Status: "completed"}}
	transactor := &transactorFake{}
	events := &eventAppenderFake{}
	service := NewService(repository, transactor, events, true)
	result, err := service.Checkout(context.Background(), shared.Principal{UserID: uuid.NewString()}, "bundle", "mock_card_4242", "request-1")
	if err != nil {
		t.Fatal(err)
	}
	if result.TransactionID != "order-1" || !transactor.committed {
		t.Fatalf("checkout did not commit: %#v", result)
	}
	if len(events.events) != 1 || events.events[0].EventKey != "checkout.completed:order-1" {
		t.Fatalf("unexpected events: %#v", events.events)
	}
}

func TestCheckoutEventFailureRollsBackTransaction(t *testing.T) {
	expected := errors.New("outbox failed")
	transactor := &transactorFake{}
	service := NewService(&checkoutRepositoryFake{result: CheckoutResult{TransactionID: "order-1"}}, transactor, &eventAppenderFake{err: expected}, true)
	_, err := service.Checkout(context.Background(), shared.Principal{UserID: uuid.NewString()}, "bundle", "mock_card_4242", "request-1")
	if !errors.Is(err, expected) {
		t.Fatalf("expected outbox failure, got %v", err)
	}
	if transactor.committed {
		t.Fatal("transaction committed after outbox failure")
	}
}

type checkoutRepositoryFake struct{ result CheckoutResult }

func (r *checkoutRepositoryFake) MockCheckout(context.Context, uuid.UUID, string, string, time.Time) (CheckoutResult, error) {
	return r.result, nil
}

type transactorFake struct{ committed bool }

func (t *transactorFake) Within(ctx context.Context, fn func(context.Context) error) error {
	err := fn(ctx)
	t.committed = err == nil
	return err
}

type eventAppenderFake struct {
	events []shared.Event
	err    error
}

func (a *eventAppenderFake) Append(_ context.Context, events ...shared.Event) error {
	a.events = append(a.events, events...)
	return a.err
}
