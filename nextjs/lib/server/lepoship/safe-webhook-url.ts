import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

function isPrivateAddress(address: string) {
  if (address === "::" || address === "::1" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) return true;
  const parts = address.split(".").map(Number);
  if (parts.length !== 4) return false;
  return parts[0] === 0 || parts[0] === 10 || parts[0] === 127
    || (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127)
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
    || (parts[0] === 198 && parts[1] >= 18 && parts[1] <= 19)
    || parts[0] >= 224;
}

export async function assertSafeWebhookUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new Error("Webhook URL must use HTTPS.");
  if (url.username || url.password || url.port) throw new Error("Webhook URL cannot contain credentials or a custom port.");
  if (["localhost", "localhost.localdomain"].includes(url.hostname)) throw new Error("Private webhook destinations are not allowed.");
  const addresses = isIP(url.hostname) ? [{ address: url.hostname }] : await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((entry) => isPrivateAddress(entry.address))) throw new Error("Private webhook destinations are not allowed.");
  return url.toString();
}
