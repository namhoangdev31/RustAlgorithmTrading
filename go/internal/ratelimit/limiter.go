package ratelimit

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
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

func (l *Limiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.GetHeader("X-API-Key")
		if key == "" {
			key = c.GetHeader("X-Real-IP")
		}
		if key == "" {
			key = c.ClientIP()
		}

		l.mu.Lock()
		v, ok := l.visitors[key]
		if !ok {
			l.visitors[key] = &visitor{
				lastSeen: time.Now(),
				tokens:   l.maxTokens - 1,
			}
			l.mu.Unlock()
			c.Next()
			return
		}

		if time.Since(v.lastSeen) > l.window {
			v.tokens = l.maxTokens
		}
		if v.tokens <= 0 {
			v.lastSeen = time.Now()
			l.mu.Unlock()
			c.JSON(http.StatusTooManyRequests, gin.H{"detail": "Rate limit exceeded"})
			c.Abort()
			return
		}
		v.tokens--
		v.lastSeen = time.Now()
		l.mu.Unlock()

		c.Next()
	}
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
