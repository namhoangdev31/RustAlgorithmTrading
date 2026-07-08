import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/server/current-user";
import { signInFirebaseWithPassword } from "@/lib/server/firebase-auth";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    if (user.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    // Call Go Control Plane to get the current risk limits
    const goUrl = process.env.GO_CONTROL_PLANE_URL || "http://go-control-plane:8081";
    const apiKey = process.env.OBSERVABILITY_API_KEY || process.env.LEPOS_INTERNAL_API_KEY || "";

    const response = await fetch(`${goUrl}/api/system/risk-limits`, {
      headers: {
        "X-API-Key": apiKey,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Go Control Plane returned status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch risk limits" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireCurrentUser();
    if (user.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { password, ...riskLimits } = body;

    if (!password) {
      return NextResponse.json({ error: "Re-verification password is required" }, { status: 400 });
    }

    // Verify admin password via Firebase
    if (user.email) {
      try {
        await signInFirebaseWithPassword(user.email, password);
      } catch (authErr: any) {
        return NextResponse.json({ error: "Invalid admin credentials. Verification failed." }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: "User email not found for verification." }, { status: 400 });
    }

    // Send the updated limits to Go Control Plane
    const goUrl = process.env.GO_CONTROL_PLANE_URL || "http://go-control-plane:8081";
    const apiKey = process.env.OBSERVABILITY_API_KEY || process.env.LEPOS_INTERNAL_API_KEY || "";

    // GORM/Go REST API expects fields in snake_case format as verified in previously built Go structures.
    // Let's map camelCase to snake_case for Go compatibility.
    const payload = {
      max_shares: Number(riskLimits.maxShares),
      max_notional_per_position: Number(riskLimits.maxNotionalPerPosition),
      max_total_exposure: Number(riskLimits.maxTotalExposure),
      max_open_positions: Number(riskLimits.maxOpenPositions),
      default_stop_loss_percent: Number(riskLimits.defaultStopLossPercent),
      trailing_stop_percent: Number(riskLimits.trailingStopPercent),
      circuit_breaker_enabled: Boolean(riskLimits.circuitBreakerEnabled),
      daily_loss_threshold: Number(riskLimits.dailyLossThreshold),
      max_daily_loss: Number(riskLimits.maxDailyLoss),
      max_weekly_loss: Number(riskLimits.maxWeeklyLoss),
      max_monthly_loss: Number(riskLimits.maxMonthlyLoss),
      enforce_market_hours: Boolean(riskLimits.enforceMarketHours),
      max_position_correlation: Number(riskLimits.maxPositionCorrelation),
      enforce_correlation_check: Boolean(riskLimits.enforceCorrelationCheck),
    };

    const response = await fetch(`${goUrl}/api/system/risk-limits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Go Control Plane rejected changes: ${errText}` }, { status: response.status });
    }

    // Record the change in prisma audit log!
    await prisma.riskEvent.create({
      data: {
        eventType: "CONFIG_CHANGE",
        severity: "INFO",
        message: `Risk Limits updated by ${user.fullName || user.email}`,
        metadata: payload as any,
        occurredAt: new Date(),
      },
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update risk limits" }, { status: 500 });
  }
}
