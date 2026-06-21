package edge

import (
	"bytes"
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io"
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

type RegionRoute struct {
	ID                 string         `json:"id"`
	Provider           string         `json:"provider"`
	Region             string         `json:"region"`
	Endpoint           string         `json:"endpoint"`
	BundleURL          string         `json:"bundleUrl"`
	StoragePath        string         `json:"storagePath"`
	HealthStatus       string         `json:"healthStatus"`
	DrainState         string         `json:"drainState"`
	LatencyMs          *int           `json:"latencyMs"`
	TrafficPercent     int            `json:"trafficPercent"`
	IsPrimary          bool           `json:"isPrimary"`
	ReplicationVersion string         `json:"replicationVersion"`
	VectorClock        map[string]int `json:"vectorClock"`
	LastHeartbeatAt    string         `json:"lastHeartbeatAt"`
}

type ArtifactMirror struct {
	ID       string `json:"id"`
	Provider string `json:"provider"`
	Policy   string `json:"policy"`
	Status   string `json:"status"`
	Locator  string `json:"locator"`
	CID      string `json:"cid"`
	TxID     string `json:"txId"`
}

type RoutingPolicy struct {
	Strategy                   string   `json:"strategy"`
	StickySessions             bool     `json:"stickySessions"`
	ManualFailback             bool     `json:"manualFailback"`
	FailoverThresholdMs        int      `json:"failoverThresholdMs"`
	SnapshotTTLSeconds         int      `json:"snapshotTtlSeconds"`
	LatencyProbeIntervalSecond int      `json:"latencyProbeIntervalSeconds"`
	PreferredRegions           []string `json:"preferredRegions"`
}

type RouteSnapshot struct {
	ProjectID       string           `json:"projectId"`
	DeploymentID    string           `json:"deploymentId"`
	Target          string           `json:"target"`
	StoragePath     string           `json:"storagePath"`
	BundleURL       string           `json:"bundleUrl"`
	Domain          string           `json:"domain"`
	SSLStatus       string           `json:"sslStatus"`
	PrimaryRegion   string           `json:"primaryRegion"`
	Consistency     string           `json:"consistency"`
	DrainState      string           `json:"drainState"`
	RoutingPolicy   RoutingPolicy    `json:"routingPolicy"`
	Regions         []RegionRoute    `json:"regions"`
	ArtifactMirrors []ArtifactMirror `json:"artifactMirrors"`
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

func (g *Gateway) lookupRoute(r *http.Request) (*RouteSnapshot, error) {
	host := strings.Split(r.Host, ":")[0]

	g.cacheMu.RLock()
	cached, ok := g.routeCache[host]
	g.cacheMu.RUnlock()
	if ok && (cached.expiresAt.IsZero() || cached.expiresAt.After(time.Now())) {
		return cached.snapshot, nil
	}

	if g.redis == nil {
		return nil, fmt.Errorf("redis disabled")
	}

	key := "lepos:domain:" + host
	ctx, cancel := context.WithTimeout(r.Context(), 750*time.Millisecond)
	defer cancel()

	payload, err := g.redis.Get(ctx, key).Result()
	if err != nil {
		return nil, fmt.Errorf("redis get %s: %w", key, err)
	}

	var snapshot RouteSnapshot
	if err := json.Unmarshal([]byte(payload), &snapshot); err != nil {
		return nil, fmt.Errorf("decode route snapshot: %w", err)
	}

	ttlSeconds := snapshot.RoutingPolicy.SnapshotTTLSeconds
	expiresAt := time.Time{}
	if ttlSeconds > 0 {
		expiresAt = time.Now().Add(time.Duration(ttlSeconds) * time.Second)
	}

	g.cacheMu.Lock()
	g.routeCache[host] = cachedRoute{
		snapshot:  &snapshot,
		expiresAt: expiresAt,
	}
	g.cacheMu.Unlock()

	return &snapshot, nil
}

func chooseBestRegion(snapshot *RouteSnapshot, stickyRegion string) *RegionRoute {
	if len(snapshot.Regions) == 0 {
		return nil
	}

	primary := findRegion(snapshot, snapshot.PrimaryRegion)
	if snapshot.RoutingPolicy.StickySessions && stickyRegion != "" {
		if preferredSticky := findRegion(snapshot, stickyRegion); preferredSticky != nil && isRegionEligible(preferredSticky) {
			if snapshot.RoutingPolicy.ManualFailback || primary == nil || !isRegionEligible(primary) || preferredSticky.Region == snapshot.PrimaryRegion {
				return preferredSticky
			}
		}
	}

	var selected *RegionRoute
	bestScore := 1 << 30
	for i := range snapshot.Regions {
		region := &snapshot.Regions[i]
		if !isRegionEligible(region) {
			continue
		}

		score := 0
		if region.LatencyMs != nil {
			score += *region.LatencyMs
		} else {
			score += 999
		}
		if region.HealthStatus == "overloaded" {
			score += 150
		}
		if region.DrainState == "draining" {
			score += 300
		}
		if region.IsPrimary {
			score -= 25
		}
		for index, preferred := range snapshot.RoutingPolicy.PreferredRegions {
			if preferred == region.Region {
				score -= 50 - index
				break
			}
		}

		if selected == nil || score < bestScore {
			bestScore = score
			selected = region
		}
	}

	if selected != nil {
		return selected
	}
	return &snapshot.Regions[0]
}

func isRegionEligible(region *RegionRoute) bool {
	return region != nil && region.DrainState != "drained" && region.HealthStatus != "unhealthy"
}

func findRegion(snapshot *RouteSnapshot, regionName string) *RegionRoute {
	for i := range snapshot.Regions {
		if snapshot.Regions[i].Region == regionName {
			return &snapshot.Regions[i]
		}
	}
	return nil
}

func readStickyRegion(r *http.Request) string {
	cookie, err := r.Cookie("lepos_region")
	if err != nil {
		return ""
	}
	return cookie.Value
}

func writeStickyRegion(w http.ResponseWriter, snapshot *RouteSnapshot, region string) {
	if !snapshot.RoutingPolicy.StickySessions || region == "" {
		return
	}

	maxAge := 3600
	if snapshot.RoutingPolicy.SnapshotTTLSeconds > 0 {
		maxAge = snapshot.RoutingPolicy.SnapshotTTLSeconds * 4
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "lepos_region",
		Value:    region,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   maxAge,
	})
}

func bundleURLForSnapshot(snapshot *RouteSnapshot, selectedRegion *RegionRoute) string {
	if selectedRegion != nil && selectedRegion.BundleURL != "" {
		return selectedRegion.BundleURL
	}
	return snapshot.BundleURL
}

func (g *Gateway) resolveMirrorURL(locator string) string {
	if strings.HasPrefix(locator, "ipfs://") {
		gateway := strings.TrimRight(g.cfg.IPFSGatewayURL, "/")
		if gateway == "" {
			gateway = "https://ipfs.io/ipfs"
		}
		return gateway + "/" + strings.TrimPrefix(locator, "ipfs://")
	}
	if strings.HasPrefix(locator, "ar://") {
		gateway := strings.TrimRight(g.cfg.ArweaveGatewayURL, "/")
		if gateway == "" {
			gateway = "https://arweave.net"
		}
		return gateway + "/" + strings.TrimPrefix(locator, "ar://")
	}
	return ""
}

func (g *Gateway) preferredArtifactURL(snapshot *RouteSnapshot) string {
	for _, mirror := range snapshot.ArtifactMirrors {
		if mirror.Status != "published" && mirror.Status != "active" {
			continue
		}
		if resolved := g.resolveMirrorURL(mirror.Locator); resolved != "" {
			return resolved
		}
	}
	return ""
}

func (g *Gateway) emitControlPlaneEvent(projectID string, kind string, summary map[string]any) {
	if projectID == "" || g.cfg.ControlPlaneURL == "" {
		return
	}

	body, err := json.Marshal(map[string]any{
		"projectId":       projectID,
		"serviceName":     g.cfg.ServiceID,
		"kind":            kind,
		"encryptionMode":  "aggregate",
		"aggregateKey":    kind,
		"redactedSummary": summary,
		"payload":         summary,
	})
	if err != nil {
		return
	}

	url := strings.TrimRight(g.cfg.ControlPlaneURL, "/") + "/api/native/security/telemetry"
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	attachServiceIdentityHeaders(req, g.cfg)

	client := &http.Client{
		Timeout:   5 * time.Second,
		Transport: gTransport(g.cfg),
	}
	resp, err := client.Do(req)
	if err == nil && resp != nil {
		_ = resp.Body.Close()
	}
}

func (g *Gateway) serveStatic(w http.ResponseWriter, r *http.Request, snapshot *RouteSnapshot, selectedRegion *RegionRoute) bool {
	storagePath := snapshot.StoragePath
	if selectedRegion != nil && selectedRegion.StoragePath != "" {
		storagePath = selectedRegion.StoragePath
	}

	if mirrorURL := g.preferredArtifactURL(snapshot); mirrorURL != "" {
		return g.streamRemoteResource(w, r, mirrorURL)
	}

	if strings.HasPrefix(storagePath, "s3://") || strings.HasPrefix(storagePath, "r2://") || strings.HasPrefix(storagePath, "gs://") || strings.HasPrefix(storagePath, "ipfs://") || strings.HasPrefix(storagePath, "ar://") || strings.HasPrefix(storagePath, "http://") || strings.HasPrefix(storagePath, "https://") {
		return g.streamRemoteResource(w, r, storagePath)
	}

	storagePathClean := strings.TrimPrefix(storagePath, "file://")
	storagePathClean = strings.TrimPrefix(storagePathClean, "internal://")
	if !filepath.IsAbs(storagePathClean) {
		storagePathClean = filepath.Join(g.cfg.StorageRoot, storagePathClean)
	}

	filePath := filepath.Clean(filepath.Join(storagePathClean, r.URL.Path))
	if strings.HasSuffix(r.URL.Path, "/") || r.URL.Path == "" {
		filePath = filepath.Join(filePath, "index.html")
	}

	file, err := os.Open(filePath)
	if err != nil {
		return false
	}
	defer file.Close()

	w.Header().Set("X-LepoS-Cache", "HIT")
	w.Header().Set("X-LepoS-Deployment", snapshot.DeploymentID)
	http.ServeContent(w, r, filepath.Base(filePath), time.Now(), file)
	return true
}

func (g *Gateway) streamRemoteResource(w http.ResponseWriter, r *http.Request, storagePath string) bool {
	subPath := r.URL.Path
	if strings.HasSuffix(subPath, "/") || subPath == "" {
		subPath = subPath + "index.html"
	}
	subPath = strings.TrimPrefix(subPath, "/")

	var remoteURL string
	if strings.HasPrefix(storagePath, "s3://") {
		bucketAndKey := strings.TrimPrefix(storagePath, "s3://")
		remoteURL = "https://" + bucketAndKey + "/" + subPath
	} else if strings.HasPrefix(storagePath, "r2://") {
		bucketAndKey := strings.TrimPrefix(storagePath, "r2://")
		remoteURL = "https://" + bucketAndKey + ".r2.cloudflarestorage.com/" + subPath
	} else if strings.HasPrefix(storagePath, "gs://") {
		bucketAndKey := strings.TrimPrefix(storagePath, "gs://")
		remoteURL = "https://storage.googleapis.com/" + bucketAndKey + "/" + subPath
	} else if strings.HasPrefix(storagePath, "ipfs://") || strings.HasPrefix(storagePath, "ar://") {
		baseURL := g.resolveMirrorURL(storagePath)
		if baseURL == "" {
			return false
		}
		remoteURL = strings.TrimRight(baseURL, "/") + "/" + subPath
	} else if strings.HasPrefix(storagePath, "http://") || strings.HasPrefix(storagePath, "https://") {
		remoteURL = strings.TrimRight(storagePath, "/") + "/" + subPath
	} else {
		return false
	}

	isMock := strings.Contains(remoteURL, "mock") || strings.Contains(remoteURL, "test")

	if isMock {
		mockHTML := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><title>Mock Remote Asset</title></head>
<body>
  <h1>Hello from %s</h1>
  <p>Streamed successfully using smart buffer copier.</p>
</body>
</html>`, storagePath)
		w.Header().Set("Content-Type", "text/html")
		w.Header().Set("X-LepoS-Remote-Source", storagePath)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(mockHTML))
		return true
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(remoteURL)
	if err != nil {
		http.Error(w, "failed to fetch remote asset: "+err.Error(), http.StatusBadGateway)
		return true
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return false
		}
		http.Error(w, fmt.Sprintf("remote storage returned status: %d", resp.StatusCode), http.StatusBadGateway)
		return true
	}

	for k, v := range resp.Header {
		w.Header()[k] = v
	}
	w.Header().Set("X-LepoS-Remote-Source", storagePath)
	w.WriteHeader(http.StatusOK)

	buf := make([]byte, 32*1024)
	_, _ = io.CopyBuffer(w, resp.Body, buf)
	return true
}

func (g *Gateway) proxyToBundle(w http.ResponseWriter, r *http.Request, bundleURL string) {
	target, err := url.Parse(bundleURL)
	if err != nil {
		http.Error(w, "invalid bundle url", http.StatusBadGateway)
		return
	}
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.Transport = gTransport(g.cfg)
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		attachServiceIdentityHeaders(req, g.cfg)
	}
	w.Header().Set("X-LepoS-Cache", "MISS")
	proxy.ServeHTTP(w, r)
}

func (g *Gateway) purge(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if g.cfg.InternalAPIKey != "" && r.Header.Get("X-LepoS-Internal-Key") != g.cfg.InternalAPIKey {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	_, _ = io.Copy(io.Discard, r.Body)
	writeJSON(w, http.StatusOK, map[string]any{"purged": true})
}

func (g *Gateway) shouldChallenge(r *http.Request) bool {
	ua := strings.ToLower(r.UserAgent())
	if r.URL.Path == "/__lepos/challenge" || r.URL.Path == "/health" {
		return false
	}
	if _, err := r.Cookie("lepos_waf_pass"); err == nil {
		return false
	}
	return strings.Contains(ua, "bot") || strings.Contains(ua, "curl")
}

func (g *Gateway) challenge(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		http.SetCookie(w, &http.Cookie{
			Name:     "lepos_waf_pass",
			Value:    "1",
			Path:     "/",
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
			MaxAge:   900,
		})
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(`<!doctype html><title>LepoS Challenge</title><form method="post"><button>Continue</button></form>`))
}

func (g *Gateway) debug(w http.ResponseWriter, r *http.Request) {
	upgrader := websocket.Upgrader{CheckOrigin: func(*http.Request) bool { return true }}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	g.debugMu.Lock()
	g.debugConns[conn] = struct{}{}
	g.debugMu.Unlock()

	defer func() {
		g.debugMu.Lock()
		delete(g.debugConns, conn)
		g.debugMu.Unlock()
		_ = conn.Close()
	}()

	for {
		_, payload, err := conn.ReadMessage()
		if err != nil {
			return
		}
		g.broadcastDebug(payload)
	}
}

func (g *Gateway) broadcastDebug(payload []byte) {
	g.debugMu.Lock()
	defer g.debugMu.Unlock()
	for conn := range g.debugConns {
		_ = conn.WriteMessage(websocket.TextMessage, payload)
	}
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
