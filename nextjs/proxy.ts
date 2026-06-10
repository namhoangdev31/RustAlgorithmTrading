import NextAuth from "next-auth";
import { authConfig } from "@/lib/server/auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

// Simple local memory cache for rate-limiting (simulated edge cache)
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
const WAF_BLOCKED_IPS = new Set<string>(); // Mock blocked IPs list (in prod, synced from Redis)
const WAF_BLOCKED_COUNTRIES = new Set<string>(["KP"]); // Block North Korea as a demo
const anomalySuspects = new Map<string, { count: number; lastAccess: number }>();

export default auth((req) => {
  const { nextUrl } = req;
  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isAuth = !!req.auth;
  const now = Date.now();

  const ip = (req as any).ip || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const country = req.headers.get("x-vercel-ip-country") || "";

  // 1. WAF Anomaly Detection Rules Check
  const suspiciousPaths = ["/.git", "/wp-admin", "/admin/config", "/.env", "/setup.php"];
  if (suspiciousPaths.some(p => nextUrl.pathname.includes(p))) {
    const suspect = anomalySuspects.get(ip) || { count: 0, lastAccess: now };
    suspect.count += 1;
    suspect.lastAccess = now;
    anomalySuspects.set(ip, suspect);
    
    if (suspect.count >= 3) {
      WAF_BLOCKED_IPS.add(ip); // Auto-block IP dynamically
    }
    
    return new NextResponse(
      JSON.stringify({ error: "Access Denied: Suspicious activity detected." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  if (WAF_BLOCKED_IPS.has(ip) || WAF_BLOCKED_COUNTRIES.has(country)) {
    return new NextResponse(
      JSON.stringify({ error: "Access Denied: Blocked by WAF firewall rules." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. DDoS Rate Limiter (Simulated Token Bucket)
  const rateLimitWindow = 60 * 1000; // 1 minute
  const maxRequestsPerMinute = 120;
  
  const ipData = ipRequestCounts.get(ip);
  if (!ipData || now > ipData.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + rateLimitWindow });
  } else {
    ipData.count += 1;
    if (ipData.count > maxRequestsPerMinute) {
      return new NextResponse(
        JSON.stringify({ error: "Too Many Requests: Rate limit exceeded." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // 3. Subdomain Preview Routing (e.g., pr-12-my-project.preview.lepos.dev)
  const hostname = req.headers.get("host") || "";
  if (hostname.includes(".preview.lepos.dev") || hostname.includes("preview.localhost")) {
    const subdomain = hostname.split(".")[0];
    // Rewrite path to serve preview bundle from storage
    return NextResponse.rewrite(
      new URL(`/api/v1/preview/serve?subdomain=${subdomain}&path=${nextUrl.pathname}`, req.url)
    );
  }

  // 4. A/B Testing Traffic Splitter
  if (nextUrl.pathname === "/" || nextUrl.pathname === "/vi" || nextUrl.pathname === "/en") {
    const experimentCookie = req.cookies.get("lepos-experiment-ab")?.value;
    let variant = experimentCookie;
    
    if (!variant) {
      variant = Math.random() < 0.5 ? "control" : "treatment";
      const response = NextResponse.next();
      response.cookies.set("lepos-experiment-ab", variant, {
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      });
      // Continue serving with locales
    }
  }

  // 5. Route Protection for Dashboard / LepoShip Developer Portal
  const isDashboardRoute = nextUrl.pathname.includes("/dashboard") || nextUrl.pathname.includes("/lepoship");
  if (isDashboardRoute && !isAuth) {
    // Redirect to login page
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Fallback to next-intl middleware for locale handling
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Skip all API routes, static assets, favicon, and logos
    "/((?!api|_next/static|_next/image|favicon.ico|logo.jpeg|logo_nonbg.png).*)",
  ],
};
