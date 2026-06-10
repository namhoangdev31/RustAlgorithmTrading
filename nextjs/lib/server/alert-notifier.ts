interface AlertPayload {
  title: string;
  description: string;
  metric: string;
  value: string | number;
  threshold: string | number;
  projectId?: string;
  projectName?: string;
  timestamp?: Date;
}

export async function sendAlertNotification(payload: AlertPayload): Promise<boolean> {
  const { title, description, metric, value, threshold, projectId, projectName, timestamp = new Date() } = payload;

  const slackUrl = process.env.ALERT_SLACK_WEBHOOK_URL;
  const discordUrl = process.env.ALERT_DISCORD_WEBHOOK_URL;
  const telegramBotToken = process.env.ALERT_TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.ALERT_TELEGRAM_CHAT_ID;

  const messageText = `🚨 *LepoS Alert: ${title}*\n*Description:* ${description}\n*Metric:* ${metric}\n*Current Value:* ${value} (Threshold: ${threshold})\n*Project:* ${projectName || projectId || "Global"}\n*Timestamp:* ${timestamp.toISOString()}`;

  const promises: Promise<any>[] = [];

  // 1. Slack Webhook Notification
  if (slackUrl) {
    const slackPayload = {
      text: messageText,
      attachments: [
        {
          color: "#FF0000",
          fields: [
            { title: "Metric", value: String(metric), short: true },
            { title: "Value", value: `${value} / ${threshold}`, short: true },
            { title: "Project ID", value: projectId || "Global", short: false },
          ],
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
    const discordPayload = {
      content: `⚠️ **LepoS Alert: ${title}**`,
      embeds: [
        {
          title: title,
          description: description,
          color: 16711680, // Red
          fields: [
            { name: "Metric", value: String(metric), inline: true },
            { name: "Current Value", value: String(value), inline: true },
            { name: "Threshold", value: String(threshold), inline: true },
            { name: "Project", value: projectName || projectId || "Global", inline: false },
          ],
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
