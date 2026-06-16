import { prisma } from "@/lib/server/prisma";
import { executeAutoRemediation, RemediationResult } from "./auto-remediation";

interface AlertPayload {
  title: string;
  description: string;
  metric: string;
  value: string | number;
  threshold: string | number;
  projectId?: string;
  projectName?: string;
  timestamp?: Date;
  remediation?: RemediationResult;
  aiRecommendation?: string;
}

/**
 * Sends notifications to configured Alerting channels (Slack, Discord, Telegram).
 */
export async function sendAlertNotification(payload: AlertPayload): Promise<boolean> {
  const { title, description, metric, value, threshold, projectId, projectName, timestamp = new Date(), remediation } = payload;

  const slackUrl = process.env.ALERT_SLACK_WEBHOOK_URL;
  const discordUrl = process.env.ALERT_DISCORD_WEBHOOK_URL;
  const telegramBotToken = process.env.ALERT_TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.ALERT_TELEGRAM_CHAT_ID;

  let messageText = `🚨 *LepoS Alert: ${title}*\n*Description:* ${description}\n*Metric:* ${metric}\n*Current Value:* ${value} (Threshold: ${threshold})\n*Project:* ${projectName || projectId || "Global"}\n*Timestamp:* ${timestamp.toISOString()}`;

  if (remediation?.remediationTriggered) {
    messageText += `\n\n🤖 *Auto-Remediation Executed:*\n${remediation.actionTaken}\n*Proposed Fallback Action:* ${remediation.proposedAction}`;
  }

  if (payload.aiRecommendation) {
    messageText += `\n\n💡 *AI Remediation Suggestion:*\n${payload.aiRecommendation}`;
  }

  const promises: Promise<any>[] = [];

  // 1. Slack Webhook Notification
  if (slackUrl) {
    const fields = [
      { title: "Metric", value: String(metric), short: true },
      { title: "Value", value: `${value} / ${threshold}`, short: true },
      { title: "Project ID", value: projectId || "Global", short: false },
    ];

    if (remediation?.remediationTriggered) {
      fields.push(
        { title: "Auto-Remediation", value: remediation.actionTaken, short: false },
        { title: "Suggested Action", value: remediation.proposedAction, short: false }
      );
    }

    if (payload.aiRecommendation) {
      fields.push({ title: "AI Recommendation", value: payload.aiRecommendation, short: false });
    }

    const slackPayload = {
      text: messageText,
      attachments: [
        {
          color: "#FF0000",
          fields,
        },
      ],
    };
    promises.push(
      fetch(slackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackPayload),
      }).catch((err) => console.error("Error sending Slack alert:", err))
    );
  }

  // 2. Discord Webhook Notification
  if (discordUrl) {
    const fields = [
      { name: "Metric", value: String(metric), inline: true },
      { name: "Current Value", value: String(value), inline: true },
      { name: "Threshold", value: String(threshold), inline: true },
      { name: "Project", value: projectName || projectId || "Global", inline: false },
    ];

    if (remediation?.remediationTriggered) {
      fields.push(
        { name: "🤖 Auto-Remediation", value: remediation.actionTaken, inline: false },
        { name: "Proposed Action", value: remediation.proposedAction, inline: false }
      );
    }

    if (payload.aiRecommendation) {
      fields.push({ name: "💡 AI Recommendation", value: payload.aiRecommendation, inline: false });
    }

    const discordPayload = {
      content: `⚠️ **LepoS Alert: ${title}**`,
      embeds: [
        {
          title: title,
          description: description,
          color: 16711680, // Red
          fields,
          timestamp: timestamp.toISOString(),
        },
      ],
    };
    promises.push(
      fetch(discordUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload),
      }).catch((err) => console.error("Error sending Discord alert:", err))
    );
  }

  // 3. Telegram Bot API Notification
  if (telegramBotToken && telegramChatId) {
    const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const telegramPayload = {
      chat_id: telegramChatId,
      text: messageText.replace(/\*/g, "**").replace(/_/g, "\\_"),
      parse_mode: "Markdown",
    };
    promises.push(
      fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telegramPayload),
      }).catch((err) => console.error("Error sending Telegram alert:", err))
    );
  }

  if (promises.length === 0) {
    console.log("⚠️ Alert triggered but no notification channel (Slack/Discord/Telegram) is configured.");
    return false;
  }

  await Promise.all(promises);
  return true;
}

/**
 * Runs AI-based predictive and statistical anomaly detection on historical metric time-series.
 */
export async function analyzeMetricsForAnomalies(
  bundleId: string,
  endpoint: string,
  method: string,
  currentLatency: number,
  currentErrors: number
) {
  try {
    // 1. Query recent historical stats for this specific endpoint
    const history = await prisma.bundleApiUsageStats.findMany({
      where: {
        bundleId,
        endpoint,
        method,
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    if (history.length < 3) {
      console.log(`[AI Anomaly Engine] Insufficient data points (${history.length}/3) for statistical analysis.`);
      return;
    }

    // Sort chronologically (oldest to newest) and apply fallback values for null properties
    const latencies = history.map((h) => h.avgLatencyMs ?? 0).reverse();
    const errors = history.map((h) => Number(h.errorCount ?? 0)).reverse();

    // 2. Perform Single Exponential Smoothing forecasting
    const alpha = 0.35; // Smoothing constant
    let level = latencies[0];
    for (let i = 1; i < latencies.length; i++) {
      level = alpha * latencies[i] + (1 - alpha) * level;
    }
    const predictedLatency = Math.round(level);

    // 3. Calculate Mean and Standard Deviation of historical latency
    const meanLatency = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
    const varianceLatency = latencies.reduce((sum, val) => sum + Math.pow(val - meanLatency, 2), 0) / latencies.length;
    const stdDevLatency = Math.sqrt(varianceLatency) || 5; // Fallback deviation if variance is 0

    // 4. Calculate Z-Score of the current test run
    const zScore = (currentLatency - meanLatency) / stdDevLatency;

    console.log(`[AI Anomaly Engine] Endpoint: ${method} ${endpoint} | Mean: ${meanLatency.toFixed(1)}ms | StdDev: ${stdDevLatency.toFixed(1)}ms | Z-Score: ${zScore.toFixed(2)}`);

    // 5. Check anomaly thresholds (outliers + early congestion warning)
    const isLatencyAnomaly = zScore > 2.25;
    const avgErrors = errors.reduce((sum, val) => sum + val, 0) / errors.length;
    const isErrorAnomaly = currentErrors > 0 && currentErrors > avgErrors * 3;

    if (isLatencyAnomaly || isErrorAnomaly) {
      console.warn(`[AI Anomaly Engine] ⚠️ Anomaly detected! Z-score = ${zScore.toFixed(2)}.`);

      const title = isErrorAnomaly ? "API Error Rate Escalation" : "API Latency Congestion Warning";
      const description = isErrorAnomaly
        ? `API error rate on [${method} ${endpoint}] rose anomalously to ${currentErrors} errors. Historical average error count is ${avgErrors.toFixed(1)}.`
        : `AI Engine detected early system congestion on [${method} ${endpoint}]. Predicted latency was ${predictedLatency}ms, but actual latency is ${currentLatency}ms (Z-Score: ${zScore.toFixed(2)}).`;

      const anomalyType = isErrorAnomaly ? "error_rate" : "latency";
      const currentValue = isErrorAnomaly ? currentErrors : currentLatency;
      const baselineValue = isErrorAnomaly
        ? Math.round(avgErrors * 3)
        : Math.round(meanLatency + 2.25 * stdDevLatency);

      // Execute WAF / Rollback / Scale-out auto-remediations
      const remediation = await executeAutoRemediation(
        bundleId,
        anomalyType,
        currentValue,
        baselineValue
      );

      await sendAlertNotification({
        title,
        description,
        metric: isErrorAnomaly ? "errorCount" : "avgLatencyMs",
        value: isErrorAnomaly ? currentErrors : currentLatency,
        threshold: isErrorAnomaly ? `${(avgErrors * 3).toFixed(0)} errors` : `${(meanLatency + 2.25 * stdDevLatency).toFixed(0)}ms`,
        projectId: bundleId,
        remediation,
      });
    }
  } catch (error) {
    console.error("[AI Anomaly Engine] Failed to run anomaly detection:", error);
  }
}

/**
 * AI-powered remediation advice generator based on failure metrics.
 */
export function generateAiRemediationSuggestions(
  title: string,
  description: string,
  metric: string,
  value: string | number
): string {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();

  if (titleLower.includes("error") || descLower.includes("error")) {
    return "1. Review recent commit diffs for potential syntax or logic exceptions.\n" +
           "2. Verify database connection health and credentials in environment variables.\n" +
           "3. If errors persist, invoke manual rollback to the previous stable build.";
  }
  if (titleLower.includes("latency") || descLower.includes("latency") || titleLower.includes("congestion")) {
    return "1. Scalability: Scale replica groups out to distribute traffic load.\n" +
           "2. Query Optimization: Run EXPLAIN on recent slow database queries.\n" +
           "3. Cache Check: Verify Redis cache hit rate and connection pool capacity.";
  }
  return "Review system integration dashboards and inspect recent logs for anomalies.";
}

/**
 * High-performance smart alert router. Checks thresholds and directly routes alerts
 * to project owner & admin members.
 */
export async function checkSmartRoutingAndTriggerAlert(
  projectId: string,
  errorRate5xx: number,
  latencyMs: number
): Promise<boolean> {
  const isErrorTriggered = errorRate5xx > 5;
  const isLatencyTriggered = latencyMs > 1000;

  if (!isErrorTriggered && !isLatencyTriggered) {
    return false;
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        name: true,
        organization: {
          select: {
            user: {
              select: { email: true }
            }
          }
        },
        bundle: {
          select: {
            collaborators: {
              where: {
                role: { in: ["admin", "owner"] }
              },
              select: {
                user: {
                  select: { email: true }
                }
              }
            }
          }
        }
      }
    });

    if (!project) {
      console.warn(`[Smart Alert Routing] Project ${projectId} not found.`);
      return false;
    }

    const adminEmails = new Set<string>();
    
    if (project.organization?.user?.email) {
      adminEmails.add(project.organization.user.email);
    }

    project.bundle?.collaborators.forEach((c) => {
      if (c.user?.email) {
        adminEmails.add(c.user.email);
      }
    });

    const recipientList = Array.from(adminEmails);
    console.log(`[Smart Alert Routing] Routing alert notifications to admins: ${recipientList.join(", ")}`);

    const title = isErrorTriggered ? "HTTP 5xx Error Spike Alert" : "System Response Latency Spike Alert";
    const description = isErrorTriggered
      ? `System 5xx error rate has risen to ${errorRate5xx.toFixed(1)}% (exceeding 5% threshold in 2 minutes).`
      : `System response latency has reached ${latencyMs}ms (exceeding 1000ms threshold).`;

    const aiRecommendation = generateAiRemediationSuggestions(
      title,
      description,
      isErrorTriggered ? "errorRate" : "latency",
      isErrorTriggered ? errorRate5xx : latencyMs
    );

    const customMessage = description + `\n*Routed Admin Emails:* ${recipientList.join(", ")}`;

    return await sendAlertNotification({
      title,
      description: customMessage,
      metric: isErrorTriggered ? "errorRate5xx" : "latencyMs",
      value: isErrorTriggered ? `${errorRate5xx.toFixed(1)}%` : `${latencyMs}ms`,
      threshold: isErrorTriggered ? "5%" : "1000ms",
      projectId,
      projectName: project.name,
      aiRecommendation,
    });
  } catch (err: any) {
    console.error("[Smart Alert Routing ERROR] Failed to route alert:", err.message);
    return false;
  }
}
