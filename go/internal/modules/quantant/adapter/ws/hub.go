package ws

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/nats-io/nats.go"
)

type envelope struct {
	SchemaVersion int             `json:"schema_version"`
	EventID       string          `json:"event_id"`
	Sequence      int64           `json:"sequence"`
	Type          string          `json:"type"`
	OccurredAt    time.Time       `json:"occurred_at"`
	AccountID     string          `json:"account_id,omitempty"`
	AggregateID   string          `json:"aggregate_id,omitempty"`
	Payload       json.RawMessage `json:"payload"`
}

type Hub struct {
	mu       sync.RWMutex
	clients  map[*websocket.Conn]chan []byte
	history  []envelope
	sequence atomic.Int64
	sub      *nats.Subscription
}

var upgrader = websocket.Upgrader{CheckOrigin: func(*http.Request) bool { return true }}

func New(connection *nats.Conn) (*Hub, error) {
	hub := &Hub{clients: make(map[*websocket.Conn]chan []byte), history: make([]envelope, 0, 2048)}
	if connection == nil {
		return hub, nil
	}
	sub, err := connection.Subscribe("quantant.>", hub.onMessage)
	if err != nil {
		return nil, err
	}
	hub.sub = sub
	return hub, nil
}

func (h *Hub) ServeHTTP(response http.ResponseWriter, request *http.Request) {
	connection, err := upgrader.Upgrade(response, request, nil)
	if err != nil {
		return
	}
	send := make(chan []byte, 256)
	h.mu.Lock()
	h.clients[connection] = send
	resume, _ := strconv.ParseInt(request.URL.Query().Get("resume_sequence"), 10, 64)
	replay := append([]envelope(nil), h.history...)
	h.mu.Unlock()
	go h.writer(connection, send)
	for _, item := range replay {
		if item.Sequence > resume {
			if payload, marshalErr := json.Marshal(item); marshalErr == nil {
				send <- payload
			}
		}
	}
	go h.reader(connection)
}

func (h *Hub) onMessage(message *nats.Msg) {
	sequence := h.sequence.Add(1)
	item := envelope{
		SchemaVersion: 1, EventID: uuid.NewString(), Sequence: sequence,
		Type: strings.TrimPrefix(message.Subject, "quantant."), OccurredAt: time.Now().UTC(),
		Payload: append(json.RawMessage(nil), message.Data...),
	}
	var command struct {
		CommandID string `json:"command_id"`
		Payload   struct {
			AccountID string `json:"account_id"`
		} `json:"payload"`
	}
	if json.Unmarshal(message.Data, &command) == nil {
		item.AggregateID, item.AccountID = command.CommandID, command.Payload.AccountID
	}
	payload, err := json.Marshal(item)
	if err != nil {
		return
	}
	h.mu.Lock()
	if len(h.history) == cap(h.history) {
		copy(h.history, h.history[1:])
		h.history = h.history[:len(h.history)-1]
	}
	h.history = append(h.history, item)
	for connection, send := range h.clients {
		select {
		case send <- payload:
		default:
			close(send)
			delete(h.clients, connection)
			_ = connection.Close()
		}
	}
	h.mu.Unlock()
}

func (h *Hub) reader(connection *websocket.Conn) {
	defer h.remove(connection)
	connection.SetReadLimit(2048)
	_ = connection.SetReadDeadline(time.Now().Add(70 * time.Second))
	connection.SetPongHandler(func(string) error {
		return connection.SetReadDeadline(time.Now().Add(70 * time.Second))
	})
	for {
		if _, _, err := connection.ReadMessage(); err != nil {
			return
		}
	}
}

func (h *Hub) writer(connection *websocket.Conn, send <-chan []byte) {
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case payload, ok := <-send:
			if !ok {
				return
			}
			_ = connection.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if connection.WriteMessage(websocket.TextMessage, payload) != nil {
				return
			}
		case <-ticker.C:
			_ = connection.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if connection.WriteMessage(websocket.PingMessage, nil) != nil {
				return
			}
		}
	}
}

func (h *Hub) remove(connection *websocket.Conn) {
	h.mu.Lock()
	if send, exists := h.clients[connection]; exists {
		delete(h.clients, connection)
		close(send)
	}
	h.mu.Unlock()
	_ = connection.Close()
}

func (h *Hub) Close() {
	if h.sub != nil {
		_ = h.sub.Unsubscribe()
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	for connection, send := range h.clients {
		close(send)
		_ = connection.Close()
		delete(h.clients, connection)
	}
}
