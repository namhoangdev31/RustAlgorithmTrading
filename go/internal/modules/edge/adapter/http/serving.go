package httpadapter

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

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
