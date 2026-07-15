package httpadapter

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

type Config struct {
	Host                    string
	Port                    string
	RedisURL                string
	StorageRoot             string
	ControlPlaneURL         string
	InternalAPIKey          string
	ControlPlaneTLSCertPath string
	ControlPlaneTLSKeyPath  string
	ControlPlaneTLSCAPath   string
	ServiceID               string
	ServiceSecret           string
	IPFSGatewayURL          string
	ArweaveGatewayURL       string
}

type cachedRoute struct {
	snapshot  *RouteSnapshot
	expiresAt time.Time
}

type Gateway struct {
	cfg        Config
	redis      *redis.Client
	proxy      *httputil.ReverseProxy
	debugMu    sync.Mutex
	debugConns map[*websocket.Conn]struct{}
	cacheMu    sync.RWMutex
	routeCache map[string]cachedRoute
	certMu     sync.RWMutex
	certs      map[string]*tls.Certificate
}

func NewGateway(cfg Config) (*Gateway, error) {
	controlURL, err := url.Parse(cfg.ControlPlaneURL)
	if err != nil {
		return nil, fmt.Errorf("parse control plane url: %w", err)
	}

	proxy := httputil.NewSingleHostReverseProxy(controlURL)
	proxy.Transport = gTransport(cfg)
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		attachServiceIdentityHeaders(req, cfg)
		req.Header.Set("X-LepoS-Target-Service", "nextjs-control-plane")
	}

	g := &Gateway{
		cfg:        cfg,
		proxy:      proxy,
		debugConns: map[*websocket.Conn]struct{}{},
		routeCache: map[string]cachedRoute{},
		certs:      map[string]*tls.Certificate{},
	}

	if cfg.RedisURL != "" {
		options, err := redis.ParseURL(cfg.RedisURL)
		if err != nil {
			return nil, fmt.Errorf("parse redis url: %w", err)
		}
		g.redis = redis.NewClient(options)
		go g.subscribeToCacheInvalidation()
		go g.subscribeToCertReload()
	}

	return g, nil
}

func gTransport(cfg Config) *http.Transport {
	transport := &http.Transport{}
	if cfg.ControlPlaneTLSCertPath == "" || cfg.ControlPlaneTLSKeyPath == "" {
		return transport
	}

	cert, err := tls.LoadX509KeyPair(cfg.ControlPlaneTLSCertPath, cfg.ControlPlaneTLSKeyPath)
	if err != nil {
		slog.Warn("control_plane_tls_pair_unavailable", "error", err)
		return transport
	}

	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
		MinVersion:   tls.VersionTLS12,
	}

	if cfg.ControlPlaneTLSCAPath != "" {
		caBytes, err := os.ReadFile(cfg.ControlPlaneTLSCAPath)
		if err == nil {
			pool, poolErr := x509.SystemCertPool()
			if poolErr != nil || pool == nil {
				pool = x509.NewCertPool()
			}
			pool.AppendCertsFromPEM(caBytes)
			tlsConfig.RootCAs = pool
		}
	}

	transport.TLSClientConfig = tlsConfig
	return transport
}

func attachServiceIdentityHeaders(req *http.Request, cfg Config) {
	if cfg.ServiceID != "" {
		req.Header.Set("X-LepoS-Service-Id", cfg.ServiceID)
	}
	if cfg.ServiceSecret != "" {
		req.Header.Set("X-LepoS-Service-Secret", cfg.ServiceSecret)
	}
	if cfg.ControlPlaneTLSCertPath != "" && cfg.ControlPlaneTLSKeyPath != "" {
		req.Header.Set("X-LepoS-Service-TLS", "enabled")
	}
}

func (g *Gateway) ReloadCertificate(domain string, certPEM, keyPEM []byte) error {
	cert, err := tls.X509KeyPair(certPEM, keyPEM)
	if err != nil {
		return fmt.Errorf("load keypair for %s: %w", domain, err)
	}
	g.certMu.Lock()
	g.certs[domain] = &cert
	g.certMu.Unlock()
	slog.Info("ssl_cert_hot_reloaded_to_ram", "domain", domain)
	return nil
}

func (g *Gateway) GetCertificate(hello *tls.ClientHelloInfo) (*tls.Certificate, error) {
	name := strings.ToLower(hello.ServerName)

	g.certMu.RLock()
	cert, ok := g.certs[name]
	g.certMu.RUnlock()
	if ok {
		return cert, nil
	}

	// Try wildcard matching (e.g. *.domain.com matching app.domain.com)
	parts := strings.Split(name, ".")
	if len(parts) >= 3 {
		wildcardName := "*." + strings.Join(parts[1:], ".")
		g.certMu.RLock()
		cert, ok = g.certs[wildcardName]
		g.certMu.RUnlock()
		if ok {
			return cert, nil
		}
	}

	// Fallback check on disk
	certPath := filepath.Join(g.cfg.StorageRoot, "certs", name, "cert.pem")
	keyPath := filepath.Join(g.cfg.StorageRoot, "certs", name, "key.pem")

	if isFileExists(certPath) && isFileExists(keyPath) {
		c, err := tls.LoadX509KeyPair(certPath, keyPath)
		if err == nil {
			g.certMu.Lock()
			g.certs[name] = &c
			g.certMu.Unlock()
			return &c, nil
		}
	}

	return nil, fmt.Errorf("no certificate found for domain: %s", name)
}

func (g *Gateway) TLSConfig() *tls.Config {
	return &tls.Config{
		GetCertificate: g.GetCertificate,
		MinVersion:     tls.VersionTLS12,
	}
}

func (g *Gateway) subscribeToCertReload() {
	ctx := context.Background()
	pubsub := g.redis.Subscribe(ctx, "lepos:reload-cert")
	defer pubsub.Close()

	ch := pubsub.Channel()
	for msg := range ch {
		slog.Info("ssl_reload_cert_received", "channel", msg.Channel)
		var event struct {
			Domain  string `json:"domain"`
			CertPEM string `json:"certPem"`
			KeyPEM  string `json:"keyPem"`
		}
		if err := json.Unmarshal([]byte(msg.Payload), &event); err == nil {
			if err := g.ReloadCertificate(event.Domain, []byte(event.CertPEM), []byte(event.KeyPEM)); err != nil {
				slog.Error("ssl_hot_reload_failed", "domain", event.Domain, "error", err)
			}
		}
	}
}

func isFileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func (g *Gateway) Close() {
	if g.redis != nil {
		_ = g.redis.Close()
	}
}

func (g *Gateway) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", g.health)
	mux.HandleFunc("/__lepos/purge", g.purge)
	mux.HandleFunc("/__lepos/challenge", g.challenge)
	mux.HandleFunc("/ws/debug", g.debug)
	mux.HandleFunc("/", g.serve)
	return mux
}

func (g *Gateway) health(w http.ResponseWriter, _ *http.Request) {
	status := map[string]any{"status": "ok", "redis": "disabled"}
	if g.redis != nil {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		if err := g.redis.Ping(ctx).Err(); err != nil {
			status["redis"] = "error"
		} else {
			status["redis"] = "ok"
		}
	}
	g.cacheMu.RLock()
	status["routingCacheSize"] = len(g.routeCache)
	g.cacheMu.RUnlock()
	status["serviceIdentity"] = map[string]any{
		"id":        g.cfg.ServiceID,
		"mtlsReady": g.cfg.ControlPlaneTLSCertPath != "" && g.cfg.ControlPlaneTLSKeyPath != "",
	}
	writeJSON(w, http.StatusOK, status)
}

func (g *Gateway) serve(w http.ResponseWriter, r *http.Request) {
	if g.shouldChallenge(r) {
		http.Redirect(w, r, "/__lepos/challenge", http.StatusTemporaryRedirect)
		return
	}

	snapshot, err := g.lookupRoute(r)
	if err != nil {
		slog.Warn("edge_route_lookup_miss", "host", r.Host, "error", err)
		g.proxy.ServeHTTP(w, r)
		return
	}

	selectedRegion := chooseBestRegion(snapshot, readStickyRegion(r))
	if selectedRegion != nil && selectedRegion.Region != "" {
		writeStickyRegion(w, snapshot, selectedRegion.Region)
	}

	if bundleURL := bundleURLForSnapshot(snapshot, selectedRegion); bundleURL != "" {
		g.proxyToBundle(w, r, bundleURL)
		return
	}

	if served := g.serveStatic(w, r, snapshot, selectedRegion); served {
		return
	}

	g.proxy.ServeHTTP(w, r)
}

func (g *Gateway) subscribeToCacheInvalidation() {
	ctx := context.Background()
	pubsub := g.redis.Subscribe(ctx, "lepos:purge")
	defer pubsub.Close()

	ch := pubsub.Channel()
	for msg := range ch {
		slog.Info("edge_cache_purge_received", "channel", msg.Channel, "payload", msg.Payload)
		var event struct {
			ProjectID string `json:"projectId"`
			Path      string `json:"path"`
			Domain    string `json:"domain"`
		}
		if err := json.Unmarshal([]byte(msg.Payload), &event); err == nil {
			g.cacheMu.Lock()
			if event.Domain != "" {
				delete(g.routeCache, event.Domain)
			} else if event.ProjectID != "" {
				for domain, snapshot := range g.routeCache {
					if snapshot.snapshot != nil && snapshot.snapshot.ProjectID == event.ProjectID {
						delete(g.routeCache, domain)
					}
				}
			} else {
				g.routeCache = map[string]cachedRoute{}
			}
			g.cacheMu.Unlock()
			slog.Info("edge_in_memory_cache_invalidated")
			if event.ProjectID != "" {
				g.emitControlPlaneEvent(event.ProjectID, "gateway_event", map[string]any{
					"type":   "cache_purge_received",
					"domain": event.Domain,
					"path":   event.Path,
				})
			}
		}
	}
}
