# LepoS Partner SDK & Integration Guide

Welcome to the LepoS Partner SDK and Integration Guide. This documentation is designed for third-party developers and enterprise partners looking to integrate their services, deploy web views, or interact with LepoS and LepoShip APIs.

## Overview

LepoS provides a unified dashboard and platform for managing, packaging, and deploying hybrid mobile web services (via LepoShip WebView) and streaming runtime telemetry. By integrating with the LepoS Partner SDK, you can programmatically:
1. Control feature flags for your custom workspace.
2. Trigger remote WebView OTA updates.
3. Query system performance logs.
4. Manage secure client credentials.

---

## Getting Started

### 1. Installation

To install the client SDK in your Node/JavaScript/TypeScript application, add the package dependency:

```bash
npm install @lepos/partner-sdk
# or using yarn
yarn add @lepos/partner-sdk
```

### 2. Initialization

Initialize the LepoS Client using your **Personal Access Token (PAT)**:

```typescript
import { LeposClient } from "@lepos/partner-sdk";

const client = new LeposClient({
  apiKey: process.env.LEPOS_PARTNER_API_KEY,
  endpoint: "https://api.lepos.sh", // Default production host
});
```

---

## Core Integration Modules

### A. Feature Flag Integration

Feature flags can be checked dynamically from your backend services or synchronized in real-time.

#### Server-side Check
```typescript
const isBetaEnabled = await client.featureFlags.isEnabled("beta_dashboard", {
  projectId: "your-project-uuid",
});

if (isBetaEnabled) {
  // Render treatment variant
}
```

#### Real-time Client-side Sync (React/Next.js)
Wrap your application in our context provider to stream real-time updates directly via SSE (Server-Sent Events):

```tsx
import { FeatureFlagProvider } from "@/components/providers/FeatureFlagContext";

export default function RootLayout({ children }) {
  return (
    <FeatureFlagProvider projectId="your-project-uuid">
      {children}
    </FeatureFlagProvider>
  );
}
```

---

## Webhooks Registration

Partners can subscribe to life-cycle events including `build.success`, `deploy.failed`, and `waf.anomaly_detected`.

### Webhook Request Schema

Webhooks are sent as `POST` requests with a `X-Lepos-Signature` header computed using HMAC-SHA256 signature verification.

#### Example Signature Validation (Next.js App Router)
```typescript
import crypto from "crypto";

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("x-lepos-signature") || "";
  const secret = process.env.LEPOS_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    return new Response("Invalid Signature", { status: 401 });
  }

  const event = JSON.parse(payload);
  console.log(`Received Event: ${event.type}`, event.data);

  return new Response("OK", { status: 200 });
}
```

---

## Best Practices & Security

1. **Keep Secrets Secret**: Never expose your `LEPOS_PARTNER_API_KEY` on client-side code bundles.
2. **Re-try Policy**: Webhook deliveries that fail will be retried up to 5 times with exponential backoff.
3. **WAF Guardrails**: Ensure your integration does not trigger DDoS prevention limits (max 120 API requests per minute per IP).
