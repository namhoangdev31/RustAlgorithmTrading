import NextAuth from "next-auth";
import { authConfig } from "@/lib/server/auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse, type NextFetchEvent } from "next/server";
import { getNativeRedis, redisGetJson, nativeRedisKeys } from "@/lib/server/native-platform/redis";
import { get as isrCacheGet, type CompressionType } from "@/lib/server/native-platform/isr-cache-manager";
import crypto from "crypto";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

// Simple local memory cache for rate-limiting (simulated edge cache)
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
const WAF_BLOCKED_IPS = new Set<string>(); // Mock blocked IPs list (in prod, synced from Redis)
const WAF_BLOCKED_COUNTRIES = new Set<string>(["KP"]); // Block North Korea as a demo
const anomalySuspects = new Map<string, { count: number; lastAccess: number }>();

// Global Threat Intelligence IP Blacklist (simulated feed)
const THREAT_INTEL_BLACKIPS = new Set<string>([
  "185.220.101.5",  // Mock TOR Exit Node
  "45.227.254.12",  // Mock Scanner Bot
  "193.188.22.45"   // Mock Bruteforce IP
]);

interface EdgeFlagRule {
  flagName: string;
  enabled: boolean;
  rules?: Array<{
    type: "country" | "user_agent" | "percentage";
    value: string | number | string[];
  }>;
}

// Simulated Cloudflare KV Feature Flag store
const EDGE_KV_FLAGS: Record<string, EdgeFlagRule> = {
  "new_dashboard": {
    flagName: "new_dashboard",
    enabled: true,
    rules: [
      { type: "country", value: ["US", "VN", "SG"] },
      { type: "user_agent", value: "chrome" }
    ]
  },
  "beta_compiler": {
    flagName: "beta_compiler",
    enabled: true,
    rules: [
      { type: "percentage", value: 30 } // 30% traffic rollout
    ]
  }
};

function evaluateFlag(
  flag: EdgeFlagRule,
  context: { ip: string; country: string; userAgent: string; visitorId: string }
): boolean {
  if (!flag.enabled) return false;
  if (!flag.rules || flag.rules.length === 0) return true;

  for (const rule of flag.rules) {
    if (rule.type === "country") {
      const allowed = Array.isArray(rule.value) ? rule.value : [rule.value];
      if (!allowed.includes(context.country)) return false;
    }
    if (rule.type === "user_agent") {
      const uaPattern = String(rule.value).toLowerCase();
      if (!context.userAgent.toLowerCase().includes(uaPattern)) return false;
    }
    if (rule.type === "percentage") {
      const hash = Array.from(context.visitorId + flag.flagName)
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const bucket = hash % 100;
      if (bucket >= Number(rule.value)) return false;
    }
  }
  return true;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 100;
}

async function fetchFlagsFromStore(projectId: string): Promise<any[]> {
  // 1. Try Upstash Redis if configured
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/flags:${projectId}`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          return JSON.parse(data.result);
        }
      }
    } catch (e) {
      console.error("[Edge Proxy] Upstash Redis query failed:", e);
    }
  }

  // 2. Try Vercel Edge Config if available
  if (process.env.EDGE_CONFIG) {
    try {
      const match = process.env.EDGE_CONFIG.match(/\/ecfg_([a-zA-Z0-9]+)/);
      if (match) {
        const edgeConfigId = `ecfg_${match[1]}`;
        const tokenMatch = process.env.EDGE_CONFIG.match(/token=([a-zA-Z0-9-]+)/);
        const token = tokenMatch ? tokenMatch[1] : "";
        if (token) {
          const res = await fetch(`https://edge-config.vercel.com/${edgeConfigId}/value/flags:${projectId}?token=${token}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) return data;
          }
        }
      }
    } catch (e) {
      console.error("[Edge Proxy] Edge Config fetch failed:", e);
    }
  }

  // 3. Fallback: Query the internal raw API endpoint (non-blocking)
  try {
    const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${origin}/api/v1/projects/${projectId}/feature-flags/raw`, {
      headers: {
        "x-lepos-internal-key": process.env.LEPOS_INTERNAL_API_KEY || ""
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.flags)) {
        return data.flags;
      }
    }
  } catch (e) {
    console.error("[Edge Proxy] Local API fallback query failed:", e);
  }

  return [];
}

export default auth(async (req: any, event?: any) => {
  const { nextUrl } = req;
  
  // 0. Redis routing lookup for instant custom domain / project rollback routing
  const hostname = req.headers.get("host") || "";
  let activeDeployment = null;
  try {
    activeDeployment = await redisGetJson<{
      projectId: string;
      deploymentId: string;
      storagePath: string;
      bundleUrl?: string;
    }>(nativeRedisKeys.domain(hostname));
  } catch (err) {
    // Fail-safe fallback if Redis is unavailable
  }

  if (!activeDeployment) {
    try {
      activeDeployment = await redisGetJson<{
        projectId: string;
        deploymentId: string;
        storagePath: string;
        bundleUrl?: string;
      }>(`rc:backup:domain:${hostname}`);
      if (activeDeployment) {
        console.warn(`[Edge Proxy] Routing table fallback to cross-region backup for hostname: ${hostname}`);
      }
    } catch (err) {
      // Non-blocking
    }
  }

  // Bypass all checks for challenge verification page to avoid loop
  if (nextUrl.pathname.includes("/challenge")) {
    return intlMiddleware(req);
  }

  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isAuth = !!req.auth;
  const now = Date.now();

  const ip = (req as any).ip || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const country = req.headers.get("x-vercel-ip-country") || "";
  const userAgent = req.headers.get("user-agent") || "";

  // Geo-Routing nearest PoP target assignment
  let geoRegion = "us-east-1"; 
  if (country === "VN" || country === "SG" || country === "JP") {
    geoRegion = "ap-southeast-1"; 
  } else if (country === "FR" || country === "DE" || country === "GB") {
    geoRegion = "eu-west-1"; 
  }

  const hasChallengeCookie = req.cookies.get("lepos-challenge-passed")?.value === "true";

  // JA3 Fingerprint Verification Logic
  const ja3Header = req.headers.get("x-ja3-fingerprint");
  let ja3Fingerprint = ja3Header;
  
  if (!ja3Fingerprint) {
    const ua = (req.headers.get("user-agent") || "").toLowerCase();
    if (ua.includes("python") || ua.includes("urllib")) {
      ja3Fingerprint = "ja3_python_requests";
    } else if (ua.includes("curl") || ua.includes("wget")) {
      ja3Fingerprint = "ja3_curl_cli";
    } else if (ua.includes("headless") || ua.includes("puppeteer") || ua.includes("selenium")) {
      ja3Fingerprint = "ja3_headless_selenium";
    } else {
      ja3Fingerprint = "ja3_chrome_desktop_valid";
    }
  }

  const JA3_BLACKLIST = new Set(["ja3_python_requests", "ja3_curl_cli", "ja3_headless_selenium"]);
  const isMaliciousJa3 = JA3_BLACKLIST.has(ja3Fingerprint);

  if (isMaliciousJa3 && !hasChallengeCookie) {
    const internalKey = process.env.LEPOS_INTERNAL_API_KEY || "lepos-secret-internal-key";
    
    if (activeDeployment?.projectId) {
      const origin = nextUrl.origin || `http://localhost:3000`;
      fetch(`${origin}/api/native/waf/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-lepos-internal-key": internalKey,
        },
        body: JSON.stringify({
          projectId: activeDeployment.projectId,
          fingerprint: ja3Fingerprint,
          ipAddress: ip,
          action: "challenge",
          reason: `Malicious JA3 Client Fingerprint: ${ja3Fingerprint}`,
          userAgent: req.headers.get("user-agent") || "",
          metadata: {
            ja3: ja3Fingerprint,
            method: req.method,
            path: nextUrl.pathname,
          },
        }),
      }).catch(() => null);
    }

    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ error: `Access Denied: Blocked by Advanced WAF Bot Mitigation (Malicious JA3 fingerprint: ${ja3Fingerprint})` }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const challengeUrl = new URL(`/challenge`, req.url);
    challengeUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(challengeUrl);
  }

  // 1. Threat Intelligence Lookup
  const isThreatIp = THREAT_INTEL_BLACKIPS.has(ip);
  if (isThreatIp && !hasChallengeCookie) {
    const challengeUrl = new URL(`/challenge`, req.url);
    challengeUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(challengeUrl);
  }

  // 2. WAF Anomaly Detection Rules Check
  const suspiciousPaths = ["/.git", "/wp-admin", "/admin/config", "/.env", "/setup.php"];
  if (suspiciousPaths.some(p => nextUrl.pathname.includes(p))) {
    const suspect = anomalySuspects.get(ip) || { count: 0, lastAccess: now };
    suspect.count += 1;
    suspect.lastAccess = now;
    anomalySuspects.set(ip, suspect);
    
    if (suspect.count >= 3) {
      WAF_BLOCKED_IPS.add(ip); // Auto-block IP dynamically
    }
    
    if (!hasChallengeCookie) {
      const challengeUrl = new URL(`/challenge`, req.url);
      challengeUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(challengeUrl);
    }
  }

  if ((WAF_BLOCKED_IPS.has(ip) && !hasChallengeCookie) || WAF_BLOCKED_COUNTRIES.has(country)) {
    return new NextResponse(
      JSON.stringify({ error: "Access Denied: Blocked by WAF firewall rules." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. WAF Rate Limiter (Sliding Window Log in Redis)
  const redis = getNativeRedis();
  let rateLimitAllowed = true;
  let currentRequestCount = 0;
  const maxRequests = 100;

  if (redis) {
    try {
      const limitKey = `rate-limit:${ip}`;
      const windowSizeSeconds = 60;
      const currentTimestamp = Math.floor(now / 1000);

      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(limitKey, 0, currentTimestamp - windowSizeSeconds);
      pipeline.zadd(limitKey, currentTimestamp, `${currentTimestamp}-${crypto.randomUUID().slice(0, 8)}`);
      pipeline.zcard(limitKey);
      pipeline.expire(limitKey, windowSizeSeconds + 5);

      const results = await pipeline.exec();
      currentRequestCount = results ? Number(results[2]?.[1] || 0) : 0;

      if (currentRequestCount > maxRequests) {
        rateLimitAllowed = false;
      }
    } catch (err: any) {
      console.error("[WAF Rate Limiter ERROR] Redis pipeline failed, fallback to in-memory:", err.message);
      const rateLimitWindow = 60 * 1000;
      const ipData = ipRequestCounts.get(ip);
      if (!ipData || now > ipData.resetTime) {
        ipRequestCounts.set(ip, { count: 1, resetTime: now + rateLimitWindow });
        currentRequestCount = 1;
      } else {
        ipData.count += 1;
        currentRequestCount = ipData.count;
        if (ipData.count > maxRequests) {
          rateLimitAllowed = false;
        }
      }
    }
  } else {
    const rateLimitWindow = 60 * 1000;
    const ipData = ipRequestCounts.get(ip);
    if (!ipData || now > ipData.resetTime) {
      ipRequestCounts.set(ip, { count: 1, resetTime: now + rateLimitWindow });
      currentRequestCount = 1;
    } else {
      ipData.count += 1;
      currentRequestCount = ipData.count;
      if (ipData.count > maxRequests) {
        rateLimitAllowed = false;
      }
    }
  }

  if (!rateLimitAllowed) {
    return new NextResponse(
      JSON.stringify({ error: "Too Many Requests: Blocked by WAF Rate Limiting (Sliding Window Log)" }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
    );
  }

  // A/B Testing & Dynamic Feature Flags: Resolve or generate a sticky user ID
  let userId = req.cookies.get("lepos_user_id")?.value;
  let userIdWasCreated = false;
  if (!userId) {
    userId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).substring(2) + "-" + Math.random().toString(36).substring(2));
    userIdWasCreated = true;
    req.cookies.set("lepos_user_id", userId);
  }

  // Find active project context (from cookie or URL pathname)
  let projectId = req.cookies.get("lepos_active_project_id")?.value;
  if (!projectId) {
    const pathParts = nextUrl.pathname.split("/");
    const projectIndex = pathParts.indexOf("projects");
    if (projectIndex !== -1 && pathParts[projectIndex + 1]) {
      projectId = pathParts[projectIndex + 1];
    }
  }

  let evaluatedDynamicFlags: Record<string, boolean> = {};
  if (projectId) {
    try {
      const flagsConfig = await fetchFlagsFromStore(projectId);
      const devCountry = country.toUpperCase() || "US";
      const device = /mobile|android|iphone|ipad/i.test(userAgent) ? "mobile" : "desktop";

      for (const flag of flagsConfig) {
        if (flag.status !== "running") {
          evaluatedDynamicFlags[flag.name] = false;
          continue;
        }

        let matchedVariant: "A" | "B" | null = null;
        const rules = flag.targetingRules || [];

        for (const rule of rules) {
          if (rule.type === "geo" && rule.countries) {
            const matches = rule.countries.map((c: string) => c.toUpperCase()).includes(devCountry);
            if (matches) {
              matchedVariant = rule.variant;
              break;
            }
          } else if (rule.type === "device" && rule.devices) {
            const matches = rule.devices.map((d: string) => d.toLowerCase()).includes(device);
            if (matches) {
              matchedVariant = rule.variant;
              break;
            }
          } else if (rule.type === "percentage" && rule.split !== undefined) {
            const hash = hashString(userId + flag.id);
            if (hash < rule.split) {
              matchedVariant = rule.variant;
              break;
            }
          }
        }

        if (matchedVariant === null) {
          const hash = hashString(userId + flag.id);
          matchedVariant = hash < flag.trafficSplit ? "B" : "A";
        }

        evaluatedDynamicFlags[flag.name] = matchedVariant === "B";
      }

      const flagStr = JSON.stringify(evaluatedDynamicFlags);
      req.cookies.set("lepos_flags", flagStr);
    } catch (err) {
      console.error("[Proxy Edge] Failed to evaluate dynamic flags:", err);
    }
  }

  // 3. Subdomain Preview Routing (e.g., pr-12-my-project.preview.lepos.dev)
  let res: NextResponse;

  if (hostname.includes(".preview.lepos.dev") || hostname.includes("preview.localhost")) {
    const subdomain = hostname.split(".")[0];
    res = NextResponse.rewrite(
      new URL(`/api/v1/preview/serve?subdomain=${subdomain}&path=${nextUrl.pathname}`, req.url)
    );
  } else {
    // 4. Route Protection for Dashboard / LepoShip Developer Portal
    const isDashboardRoute = nextUrl.pathname.includes("/dashboard") || nextUrl.pathname.includes("/lepoship");
    if (isDashboardRoute && !isAuth) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.url);
      res = NextResponse.redirect(loginUrl);
    } else {
      res = intlMiddleware(req);
    }
  }

  // 5. Evaluate and inject Feature Flags at the Edge (KV lookup)
  const visitorId = req.cookies.get("lepos-visitor-id")?.value || 
    (Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2));
  
  const activeFlags: Record<string, boolean> = {};
  for (const key of Object.keys(EDGE_KV_FLAGS)) {
    activeFlags[key] = evaluateFlag(EDGE_KV_FLAGS[key], { ip, country, userAgent, visitorId });
  }

  res.cookies.set("lepos-visitor-id", visitorId, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  res.cookies.set("lepos-active-flags", JSON.stringify(activeFlags), { path: "/" });

  if (userIdWasCreated || userId) {
    res.cookies.set("lepos_user_id", userId!, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  if (projectId) {
    const flagStr = JSON.stringify(evaluatedDynamicFlags);
    res.cookies.set("lepos_flags", flagStr, { path: "/" });
  }

  // 6. Geographic Latency-Based Routing (CDN Smart Edge Selection)
  let edgeCluster = "global-anycast";
  let estimatedLatency = 45; // ms
  
  if (country) {
    const c = country.toUpperCase();
    if (["VN", "SG", "TH", "MY", "ID"].includes(c)) {
      edgeCluster = "edge-ap-southeast-sg";
      estimatedLatency = 15;
    } else if (["JP", "KR", "TW", "HK"].includes(c)) {
      edgeCluster = "edge-ap-northeast-tokyo";
      estimatedLatency = 28;
    } else if (["US", "CA"].includes(c)) {
      edgeCluster = "edge-us-east-virginia";
      estimatedLatency = 12;
    } else if (["GB", "DE", "FR", "NL"].includes(c)) {
      edgeCluster = "edge-eu-central-frankfurt";
      estimatedLatency = 18;
    }
  }

  // Anycast regional failover logic
  let failoverActive = false;
  let fallbackRegion = "";
  let cdnBackupActive = false;
  let finalStoragePath = activeDeployment?.storagePath || "";

  if (activeDeployment) {
    const healthyTargets = (activeDeployment as any).healthyTargets || [];
    const getClosestRegion = (c: string) => {
      const uppercaseCountry = c.toUpperCase();
      if (["VN", "SG", "TH", "MY", "ID", "JP", "KR", "TW", "HK"].includes(uppercaseCountry)) {
        return "ap-southeast-1";
      }
      if (["US", "CA", "MX", "BR"].includes(uppercaseCountry)) {
        return "us-east-1";
      }
      return "eu-west-1";
    };

    const clientRegion = getClosestRegion(country || "US");

    // Outage and Overload check
    // 1. Check simulated headers or cookies
    const simulatePopError = req.headers.get("x-simulate-pop-error") === "true" || req.cookies.get(`x-simulate-pop-error-${clientRegion}`)?.value === "true";
    const simulatePopOverload = req.headers.get("x-simulate-pop-overload") === "true" || req.cookies.get(`x-simulate-pop-overload-${clientRegion}`)?.value === "true";

    // 2. Check health status in target metadata (synced via Redis)
    const primaryTargetRaw = healthyTargets.find((t: any) => t.region === clientRegion);
    const isPrimaryFailed = simulatePopError || (primaryTargetRaw && primaryTargetRaw.healthStatus === "unhealthy");
    const isPrimaryOverloaded = simulatePopOverload || (primaryTargetRaw && primaryTargetRaw.healthStatus === "overloaded");

    const primaryTarget = !isPrimaryFailed && !isPrimaryOverloaded ? primaryTargetRaw : null;

    if (primaryTarget) {
      // Active healthy primary region matched!
      finalStoragePath = `cloud://${primaryTarget.provider}/${primaryTarget.region}/${activeDeployment.projectId}`;
    } else {
      // Failover to Secondary PoP
      let secondaryTarget = null;
      for (const target of healthyTargets) {
        if (target.region === clientRegion) continue;
        if (target.healthStatus === "healthy") {
          secondaryTarget = target;
          break;
        }
      }

      if (secondaryTarget) {
        finalStoragePath = `cloud://${secondaryTarget.provider}/${secondaryTarget.region}/${activeDeployment.projectId}`;
        failoverActive = true;
        fallbackRegion = secondaryTarget.region;

        // Simulate redirection routing latency penalty
        estimatedLatency = estimatedLatency + 120;
        if (secondaryTarget.region === "ap-southeast-1") {
          edgeCluster = "edge-ap-southeast-sg";
        } else if (secondaryTarget.region === "us-east-1") {
          edgeCluster = "edge-us-east-virginia";
        } else {
          edgeCluster = "edge-eu-central-frankfurt";
        }
      } else {
        // Fallback to Cloudflare CDN Backup
        cdnBackupActive = true;
        failoverActive = true;
        fallbackRegion = "cloudflare-cdn";
        finalStoragePath = `cloudflare-cdn-backup://bundle-assets.lepos.dev/${activeDeployment.projectId}`;
        estimatedLatency = estimatedLatency + 80; // CDN backup latency penalty
        edgeCluster = "edge-cloudflare-cdn-backup";
      }
    }
  }
  
  res.headers.set("X-Edge-Cluster", edgeCluster);
  res.headers.set("X-Edge-Latency-Est", `${estimatedLatency}ms`);
  res.headers.set("X-Edge-Routing-Region", geoRegion);
  
  let routingMethod = "Geographic-Latency-Based";
  if (cdnBackupActive) {
    routingMethod = "Anycast-CDN-Backup-Failover";
  } else if (failoverActive) {
    routingMethod = "Anycast-Failover";
  }
  res.headers.set("X-Edge-Routing-Method", routingMethod);

  // Inject active Redis deployment routing details if matched
  if (activeDeployment) {
    res.headers.set("X-Project-Id", activeDeployment.projectId);
    res.headers.set("X-Deployment-Id", activeDeployment.deploymentId);
    res.headers.set("X-Storage-Path", finalStoragePath);
    res.headers.set("X-Instant-Rollback-Safe", "true");
    res.headers.set("X-Proxy-Source", "Redis-Config");
    if (failoverActive) {
      res.headers.set("X-Failover-Active", "true");
      res.headers.set("X-Fallback-Region", fallbackRegion);
    }
    if (cdnBackupActive) {
      res.headers.set("X-CDN-Backup-Active", "true");
    }
  }

  // 7. Dynamic Brotli Compression Negotiator
  const acceptEncoding = req.headers.get("accept-encoding") || "";
  if (acceptEncoding.includes("br")) {
    res.headers.set("X-Edge-Compression", "brotli-dynamic");
    res.headers.set("Vary", "Accept-Encoding");
    // Secure safeguard: Only set Content-Encoding header if requested via compression simulation
    // to prevent browser decode crashes in local dev environments where body is uncompressed.
    if (req.headers.get("x-simulate-brotli-compression") === "true") {
      res.headers.set("Content-Encoding", "br");
    }
  }

  // 8. ISR/SSR Cache Layer — Integrated with isr-cache-manager
  if (activeDeployment?.projectId && !isApiRoute) {
    const isrProjectId = activeDeployment.projectId;
    const isrPath = nextUrl.pathname;

    try {
      const cached = await isrCacheGet(isrProjectId, isrPath);
      if (cached) {
        res.headers.set("X-ISR-Cache", cached.state.toUpperCase());
        res.headers.set("X-ISR-Compression", cached.compressionType);
        res.headers.set("X-Cache-Tags", (cached.entry.tags || []).join(","));
        res.headers.set("X-Surrogate-Keys", (cached.entry.surrogateKeys || []).join(" "));

        if (cached.state === "stale") {
          res.headers.set("X-ISR-Revalidate", "true");

          if (event && typeof event.waitUntil === "function") {
            const revalidateUrl = new URL("/api/revalidate", req.url);
            const revalidationSecret = process.env.REVALIDATION_SECRET || "default-reval-secret";
            
            event.waitUntil(
              fetch(revalidateUrl.toString(), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  cookie: req.headers.get("cookie") || "",
                },
                body: JSON.stringify({
                  projectId: isrProjectId,
                  type: "path",
                  path: isrPath,
                  secret: revalidationSecret,
                }),
              })
                .then(async (r) => {
                  if (!r.ok) {
                    console.error(`[ISR Cache Revalidate] Background revalidation failed with status ${r.status}:`, await r.text());
                  } else {
                    console.log(`[ISR Cache Revalidate] Background revalidation triggered successfully for path: ${isrPath}`);
                  }
                })
                .catch((err) => {
                  console.error("[ISR Cache Revalidate] Background revalidation fetch error:", err);
                })
            );
          }
        }
      } else {
        res.headers.set("X-ISR-Cache", "MISS");
      }
    } catch (isrErr) {
      console.error("[ISR Cache] Lookup error:", isrErr);
      res.headers.set("X-ISR-Cache", "ERROR");
    }
  }

  return res;
});

export const config = {
  matcher: [
    // Skip all API routes, static assets, favicon, and logos
    "/((?!api|_next/static|_next/image|favicon.ico|logo.jpeg|logo_nonbg.png).*)",
  ],
};
