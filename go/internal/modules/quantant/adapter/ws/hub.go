package ws

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	redisclient "github.com/redis/go-redis/v9"
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
	pubsub   *redisclient.PubSub
}

var upgrader = websocket.Upgrader{CheckOrigin: func(*http.Request) bool { return true }}

func New(client *redisclient.Client) (*Hub, error) {
	hub := &Hub{clients: make(map[*websocket.Conn]chan []byte), history: make([]envelope, 0, 2048)}
	if client == nil {
		return hub, nil
	}
	pubsub := client.Subscribe(context.Background(), "quantant:events")
	hub.pubsub = pubsub

	go hub.listenPubSub()

	return hub, nil
}

func (h *Hub) listenPubSub() {
	ch := h.pubsub.Channel()
	for msg := range ch {
		h.onMessage(msg.Payload)
	}
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

func (h *Hub) onMessage(dataStr string) {
	data := []byte(dataStr)
	sequence := h.sequence.Add(1)
	item := envelope{
		SchemaVersion: 1, EventID: uuid.NewString(), Sequence: sequence,
		Type: "execution", OccurredAt: time.Now().UTC(),
		Payload: append(json.RawMessage(nil), data...),
	}
	var command struct {
		CommandID string `json:"command_id"`
		Type      string `json:"type"`
		Payload   struct {
			AccountID string `json:"account_id"`
		} `json:"payload"`
	}
	if json.Unmarshal(data, &command) == nil {
		item.AggregateID, item.AccountID = command.CommandID, command.Payload.AccountID
		if command.Type != "" {
			item.Type = command.Type
		}
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
	if h.pubsub != nil {
		_ = h.pubsub.Close()
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	for connection, send := range h.clients {
		close(send)
		_ = connection.Close()
		delete(h.clients, connection)
	}
}
