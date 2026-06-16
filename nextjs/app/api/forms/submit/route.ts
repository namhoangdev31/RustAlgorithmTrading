import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { syncSubmissionToExternal } from "@/lib/server/form-sync";
import { triggerFormWebhook } from "@/lib/server/webhooks";

/**
 * Simulated Akismet spam rule check.
 */
function checkSpamAkismet(data: Record<string, any>, ip: string, userAgent: string): boolean {
  const contentString = JSON.stringify(data).toLowerCase();
  
  // High-confidence spam keywords
  const spamKeywords = ["buy bitcoin", "crypto profit", "seo ranking", "free money", "viagra", "cheap pharmacy"];
  const containsSpamWord = spamKeywords.some((keyword) => contentString.includes(keyword));
  
  // Simulate block for suspicious IP/User-Agent signatures (e.g. headless scraping bot)
  const isSuspiciousAgent = userAgent.includes("HeadlessChrome") || userAgent.includes("python-requests");
  
  return containsSpamWord || isSuspiciousAgent;
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (_) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const { formId, data, recaptchaToken } = body;

    if (!formId || !data) {
      return NextResponse.json(
        { error: "formId and data payload are required." },
        { status: 400 }
      );
    }

    // Verify form exists
    const form = await prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    // 1. Akismet Spam Protection Check
    const isSpam = checkSpamAkismet(data, ip, userAgent);
    if (isSpam) {
      console.warn(`[Akismet Protection] Blocked spam submission from IP: ${ip} for Form: ${formId}`);
      return NextResponse.json(
        { error: "Submission rejected by Akismet Spam Protection." },
        { status: 400 }
      );
    }

    // 2. Google ReCaptcha Verification Check (simulated)
    if (recaptchaToken && recaptchaToken === "invalid-token") {
      return NextResponse.json(
        { error: "reCAPTCHA validation failed." },
        { status: 400 }
      );
    }

    // 3. Save submission to database
    const submission = await prisma.formSubmission.create({
      data: {
        formId,
        data: data as any,
        ipAddress: ip,
        userAgent,
      },
    });

    // 4. Trigger Salesforce and Google Sheets synchronization based on database settings
    const syncPromises = [];
    if (form.googleSheetsSync) {
      syncPromises.push(syncSubmissionToExternal(data, "google-sheets"));
    }
    if (form.salesforceSync) {
      syncPromises.push(syncSubmissionToExternal(data, "salesforce"));
    }

    const syncResults = await Promise.allSettled(syncPromises);

    const succeededSyncs = syncResults
      .filter((r) => r.status === "fulfilled")
      .map((r: any) => r.value.provider);

    // 5. Trigger Webhook in background (non-blocking)
    if (form.webhookUrl) {
      triggerFormWebhook(formId, submission.id, data).catch((err) => {
        console.error(`[Webhook Trigger Error] Failed for submission ${submission.id}:`, err);
      });
    }

    return NextResponse.json(
      {
        success: true,
        submissionId: submission.id,
        syncedProviders: succeededSyncs,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error processing form submission:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
