package natsadapter

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/nats-io/nats.go"

	domain "trading/control-gateway/internal/modules/quantant/contract"
)

type Publisher struct {
	connection *nats.Conn
	jetStream  nats.JetStreamContext
	subject    string
	stream     string
}

func New(connection *nats.Conn, subject, stream string) (*Publisher, error) {
	if connection == nil {
		return nil, nil
	}
	js, err := connection.JetStream()
	if err != nil {
		return nil, err
	}
	if _, err = js.StreamInfo(stream); err != nil {
		if err != nats.ErrStreamNotFound {
			return nil, err
		}
		if _, err = js.AddStream(&nats.StreamConfig{Name: stream, Subjects: []string{"quantant.>"}, Storage: nats.FileStorage, Duplicates: 24 * time.Hour}); err != nil {
			return nil, fmt.Errorf("create QuantAnt command stream: %w", err)
		}
	}
	return &Publisher{connection: connection, jetStream: js, subject: subject, stream: stream}, nil
}

func (p *Publisher) Publish(ctx context.Context, command domain.ExecutionCommand) error {
	payload, err := json.Marshal(command)
	if err != nil {
		return err
	}
	_, err = p.jetStream.Publish(p.subject, payload, nats.Context(ctx), nats.MsgId(command.CommandID))
	return err
}

func (p *Publisher) Check(ctx context.Context) error {
	if p == nil || p.connection == nil || !p.connection.IsConnected() {
		return fmt.Errorf("QuantAnt JetStream is disconnected")
	}
	_, err := p.jetStream.StreamInfo(p.stream, nats.Context(ctx))
	return err
}
