package ws

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	ID        string
	Conn      *websocket.Conn
	Send      chan []byte
	Connected time.Time
	LastPong  time.Time
	Messages  int64
}

type Manager struct {
	mu             sync.RWMutex
	clients        map[*Client]struct{}
	register       chan *Client
	unregister     chan *Client
	broadcast      chan []byte
	done           chan struct{}
	onceStop       sync.Once
	maxConnections int
	totalMessages  int64
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func NewManager() *Manager {
	return &Manager{
		clients:        make(map[*Client]struct{}),
		register:       make(chan *Client),
		unregister:     make(chan *Client),
		broadcast:      make(chan []byte, 2048),
		done:           make(chan struct{}),
		maxConnections: 1000,
	}
}

func (m *Manager) Start() {
	for {
		select {
		case <-m.done:
			return
		case c := <-m.register:
			m.mu.Lock()
			m.clients[c] = struct{}{}
			m.mu.Unlock()
			slog.Info("ws_client_connected", "client_id", c.ID, "count", m.ConnectionCount())
		case c := <-m.unregister:
			m.removeClient(c)
		case msg := <-m.broadcast:
			m.mu.RLock()
			for c := range m.clients {
				select {
				case c.Send <- msg:
				default:
					go m.removeClient(c)
				}
			}
			m.mu.RUnlock()
		}
	}
}

func (m *Manager) Stop() {
	m.onceStop.Do(func() {
		close(m.done)
		m.mu.Lock()
		defer m.mu.Unlock()
		for c := range m.clients {
			_ = c.Conn.Close()
			delete(m.clients, c)
		}
	})
}

func (m *Manager) Broadcast(payload []byte) {
	select {
	case m.broadcast <- payload:
	default:
		// Drop burst to protect process.
	}
}

func (m *Manager) BroadcastJSON(payload map[string]interface{}) {
	b, err := json.Marshal(payload)
	if err != nil {
		return
	}
	m.Broadcast(b)
}

func (m *Manager) ConnectionCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.clients)
}

func (m *Manager) ServeWS(w http.ResponseWriter, r *http.Request) {
	if m.ConnectionCount() >= m.maxConnections {
		http.Error(w, "max websocket connections reached", http.StatusServiceUnavailable)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("ws_upgrade_failed", "error", err)
		return
	}
	client := &Client{
		ID:        r.RemoteAddr,
		Conn:      conn,
		Send:      make(chan []byte, 512),
		Connected: time.Now(),
		LastPong:  time.Now(),
	}
	m.register <- client

	// Welcome payload for parity with Python endpoint.
	_ = conn.WriteJSON(map[string]interface{}{
		"type":                "connected",
		"client_id":           client.ID,
		"server_time":         time.Now().Unix(),
		"update_frequency_hz": 10,
	})

	go m.writePump(client)
	go m.readPump(client)
}

func (m *Manager) readPump(c *Client) {
	defer func() {
		m.unregister <- c
	}()
	c.Conn.SetReadLimit(1024)
	_ = c.Conn.SetReadDeadline(time.Now().Add(65 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.LastPong = time.Now()
		return c.Conn.SetReadDeadline(time.Now().Add(65 * time.Second))
	})

	for {
		_, msg, err := c.Conn.ReadMessage()
		if err != nil {
			return
		}
		if string(msg) == "ping" {
			select {
			case c.Send <- []byte("pong"):
			default:
			}
		}
	}
}

func (m *Manager) writePump(c *Client) {
	ticker := time.NewTicker(20 * time.Second)
	defer func() {
		ticker.Stop()
		_ = c.Conn.Close()
	}()

	for {
		select {
		case <-m.done:
			return
		case message, ok := <-c.Send:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}
			c.Messages++
			m.totalMessages++
		case <-ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (m *Manager) removeClient(c *Client) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.clients[c]; ok {
		delete(m.clients, c)
		close(c.Send)
		_ = c.Conn.Close()
	}
}

func (m *Manager) Stats() map[string]interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return map[string]interface{}{
		"current_connections": len(m.clients),
		"max_connections":     m.maxConnections,
		"total_messages_sent": m.totalMessages,
	}
}
