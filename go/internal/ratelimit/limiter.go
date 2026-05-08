package ratelimit

import (
	"net/http"
	"sync"
	"time"
)

type visitor struct {
	lastSeen time.Time
	tokens   int
}

type Limiter struct {
	mu          sync.Mutex
	visitors    map[string]*visitor
	maxTokens   int
	window      time.Duration
	cleanupTick time.Duration
}

func NewLimiter(maxTokens int, window time.Duration) *Limiter {
	if maxTokens <= 0 {
		maxTokens = 100
	}
	if window <= 0 {
		window = time.Minute
	}
	l := &Limiter{
		visitors:    make(map[string]*visitor),
		maxTokens:   maxTokens,
		window:      window,
		cleanupTick: time.Minute,
	}
	go l.cleanupLoop()
	return l
}

func (l *Limiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		key := r.Header.Get("X-API-Key")
		if key == "" {
			key = r.Header.Get("X-Real-IP")
		}
		if key == "" {
			key = r.RemoteAddr
		}

		l.mu.Lock()
		v, ok := l.visitors[key]
		if !ok {
			l.visitors[key] = &visitor{
				lastSeen: time.Now(),
				tokens:   l.maxTokens - 1,
			}
			l.mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}

		if time.Since(v.lastSeen) > l.window {
			v.tokens = l.maxTokens
		}
		if v.tokens <= 0 {
			v.lastSeen = time.Now()
			l.mu.Unlock()
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			_, _ = w.Write([]byte(`{"detail":"Rate limit exceeded"}`))
			return
		}
		v.tokens--
		v.lastSeen = time.Now()
		l.mu.Unlock()

		next.ServeHTTP(w, r)
	})
}

func (l *Limiter) cleanupLoop() {
	ticker := time.NewTicker(l.cleanupTick)
	defer ticker.Stop()
	for range ticker.C {
		l.mu.Lock()
		for key, v := range l.visitors {
			if time.Since(v.lastSeen) > 3*l.window {
				delete(l.visitors, key)
			}
		}
		l.mu.Unlock()
	}
}
