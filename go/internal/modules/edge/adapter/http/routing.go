package httpadapter

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

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
