package events

import (
	"context"
	"fmt"
	"sync"

	shared "trading/control-gateway/internal/shared/application"
)

type Handler func(context.Context, shared.Event) error

type Publisher interface {
	Publish(context.Context, shared.Event) error
}

type LocalBus struct {
	mu       sync.RWMutex
	handlers map[string][]Handler
}

func NewLocalBus() *LocalBus { return &LocalBus{handlers: make(map[string][]Handler)} }

func (b *LocalBus) Subscribe(eventType string, handler Handler) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.handlers[eventType] = append(b.handlers[eventType], handler)
}

func (b *LocalBus) Publish(ctx context.Context, event shared.Event) error {
	b.mu.RLock()
	handlers := append([]Handler(nil), b.handlers[event.Type]...)
	b.mu.RUnlock()
	for _, handler := range handlers {
		if err := handler(ctx, event); err != nil {
			return fmt.Errorf("handle local event %s: %w", event.Type, err)
		}
	}
	return nil
}

type CompositePublisher struct{ publishers []Publisher }

func NewCompositePublisher(publishers ...Publisher) *CompositePublisher {
	filtered := make([]Publisher, 0, len(publishers))
	for _, publisher := range publishers {
		if publisher != nil {
			filtered = append(filtered, publisher)
		}
	}
	return &CompositePublisher{publishers: filtered}
}

func (p *CompositePublisher) Publish(ctx context.Context, event shared.Event) error {
	for _, publisher := range p.publishers {
		if err := publisher.Publish(ctx, event); err != nil {
			return err
		}
	}
	return nil
}
