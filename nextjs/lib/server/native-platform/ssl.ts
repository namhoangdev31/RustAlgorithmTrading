import { prisma } from "@/lib/server/prisma";
import { syncProjectRouting } from "./deployments";
import { redisPublish } from "./redis";
import { createHash, X509Certificate } from "node:crypto";
import * as acme from "acme-client";
import { decryptSecret } from "@/lib/server/secret-crypto";

type DnsCredentials = Record<string, string>;
type DnsRecord = { id?: string; zoneId?: string; zoneName?: string; name: string };

async function cloudflareZone(domain: string, token: string) {
  const labels = domain.replace(/^\*\./, "").split(".");
  for (let index = 0; index < labels.length - 1; index += 1) {
    const zoneName = labels.slice(index).join(".");
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${encodeURIComponent(zoneName)}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    const zoneId = payload?.result?.[0]?.id;
    if (response.ok && zoneId) return { zoneId: String(zoneId), zoneName };
  }
  throw new Error("Cloudflare zone was not found for this domain.");
}

async function createDnsRecord(provider: string, credentials: DnsCredentials, domain: string, value: string): Promise<DnsRecord> {
  const recordName = `_acme-challenge.${domain.replace(/^\*\./, "")}`;

  if (provider === "CLOUDFLARE") {
    const token = credentials.cloudflareToken;
    if (!token) throw new Error("Cloudflare API token is not configured.");
    const zone = await cloudflareZone(domain, token);
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone.zoneId}/dns_records`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ type: "TXT", name: recordName, content: value, ttl: 60 }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.result?.id) throw new Error("Cloudflare rejected the ACME TXT record.");
    return { id: String(payload.result.id), zoneId: zone.zoneId, zoneName: zone.zoneName, name: recordName };
  }

  if (provider === "GODADDY") {
    const key = credentials.godaddyApiKey;
    const secret = credentials.godaddyApiSecret;
    if (!key || !secret) throw new Error("GoDaddy API credentials are not configured.");
    const zoneName = domain.replace(/^\*\./, "");
    const response = await fetch(`https://api.godaddy.com/v1/domains/${zoneName}/records/TXT/_acme-challenge`, {
      method: "PUT",
      headers: { authorization: `sso-key ${key}:${secret}`, "content-type": "application/json" },
      body: JSON.stringify([{ data: value, ttl: 600 }]),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`GoDaddy rejected the ACME TXT record (${response.status}).`);
    return { zoneName, name: recordName };
  }

  if (provider === "ROUTE53") {
    const endpoint = process.env.LEPOS_ROUTE53_DNS_ADAPTER_ENDPOINT;
    if (!endpoint) throw new Error("Route 53 DNS adapter is not configured for this workspace.");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "create", domain, name: recordName, value, credentials }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`Route 53 adapter rejected the ACME TXT record (${response.status}).`);
    return { id: payload?.id ? String(payload.id) : undefined, zoneId: payload?.zoneId, name: recordName };
  }

  throw new Error(`Unsupported DNS provider: ${provider}`);
}

async function removeDnsRecord(provider: string, credentials: DnsCredentials, domain: string, record: DnsRecord) {
  if (provider === "CLOUDFLARE" && record.id && record.zoneId) {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${record.zoneId}/dns_records/${record.id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${credentials.cloudflareToken}` },
      cache: "no-store",
    });
  } else if (provider === "GODADDY" && record.zoneName) {
    await fetch(`https://api.godaddy.com/v1/domains/${record.zoneName}/records/TXT/_acme-challenge`, {
      method: "DELETE",
      headers: { authorization: `sso-key ${credentials.godaddyApiKey}:${credentials.godaddyApiSecret}` },
      cache: "no-store",
    });
  } else if (provider === "ROUTE53" && process.env.LEPOS_ROUTE53_DNS_ADAPTER_ENDPOINT) {
    await fetch(process.env.LEPOS_ROUTE53_DNS_ADAPTER_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "delete", domain, record, credentials }),
      cache: "no-store",
    });
  }
}

/**
 * Issues a real ACME certificate after the configured DNS provider proves ownership.
 */
export async function renewDomainSsl(domainId: string) {
  const domainConfig = await prisma.nativeDomainConfig.findUnique({
    where: { id: domainId },
    include: { project: { select: { organizationId: true } } },
  });

  if (!domainConfig) {
    throw new Error("Domain configuration not found.");
  }

  try {
    if (!domainConfig.dnsProvider) throw new Error("Select and configure a DNS provider before requesting a certificate.");
    const connection = await prisma.workspaceProviderConnection.findUnique({
      where: {
        organizationId_provider: {
          organizationId: domainConfig.project.organizationId,
          provider: `dns:${domainConfig.dnsProvider.toLowerCase()}`,
        },
      },
    });
    if (!connection || connection.status !== "active") throw new Error(`${domainConfig.dnsProvider} credentials are unavailable.`);

    const credentials = JSON.parse(decryptSecret(connection.encryptedCredential)) as DnsCredentials;
    const accountEmail = process.env.ACME_ACCOUNT_EMAIL;
    if (!accountEmail) throw new Error("ACME_ACCOUNT_EMAIL is not configured.");

    const accountKey = process.env.ACME_ACCOUNT_KEY
      ? Buffer.from(process.env.ACME_ACCOUNT_KEY.replace(/\\n/g, "\n"))
      : await acme.crypto.createPrivateKey();
    const client = new acme.Client({
      directoryUrl: process.env.ACME_DIRECTORY_URL || acme.directory.letsencrypt.production,
      accountKey,
    });
    const [certificateKey, csr] = await acme.crypto.createCsr({
      commonName: domainConfig.domain,
      altNames: [domainConfig.domain],
    });
    const records = new Map<string, DnsRecord>();
    const certificate = await client.auto({
      csr,
      email: accountEmail,
      termsOfServiceAgreed: true,
      challengePriority: ["dns-01"],
      challengeCreateFn: async (_authorization, challenge, keyAuthorization) => {
        const value = createHash("sha256").update(keyAuthorization).digest("base64url");
        const record = await createDnsRecord(domainConfig.dnsProvider!, credentials, domainConfig.domain, value);
        records.set(challenge.token, record);
      },
      challengeRemoveFn: async (_authorization, challenge) => {
        const record = records.get(challenge.token);
        if (record) await removeDnsRecord(domainConfig.dnsProvider!, credentials, domainConfig.domain, record);
      },
    });

    const now = new Date();
    const certExpiresAt = new Date(new X509Certificate(certificate).validTo);
    await prisma.nativeDomainConfig.update({
      where: { id: domainId },
      data: {
        dnsVerified: true,
        sslStatus: "ISSUED",
        certIssuedAt: now,
        certExpiresAt,
        certPemRef: `edge-certificate://${domainConfig.domain}/cert.pem`,
        keyPemRef: `edge-certificate://${domainConfig.domain}/key.pem`,
      },
    });
    await syncProjectRouting(domainConfig.projectId);
    await redisPublish("lepos:reload-cert", {
      domain: domainConfig.domain,
      certPem: certificate,
      keyPem: certificateKey.toString(),
      issuedAt: now.toISOString(),
      expiresAt: certExpiresAt.toISOString(),
    });

    return { success: true, domain: domainConfig.domain, certExpiresAt };
  } catch (error) {
    await prisma.nativeDomainConfig.update({
      where: { id: domainId },
      data: { sslStatus: "FAILED" },
    });
    throw error;
  }
}

/**
 * Iterates through all registered domains and automatically renews any certificate 
 * expiring within 15 days.
 */
export async function runAutoRenewSslCron() {
  const now = new Date();
  const fifteenDaysFromNow = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

  console.log("[SSL Auto-Renew Cron] Scanning for certificates expiring within 15 days...");

  // Find all verified domains with active SSL certificates expiring soon
  const expiringDomains = await prisma.nativeDomainConfig.findMany({
    where: {
      dnsVerified: true,
      sslStatus: "ISSUED",
      certExpiresAt: {
        lte: fifteenDaysFromNow,
      },
    },
  });

  console.log(`[SSL Auto-Renew Cron] Found ${expiringDomains.length} domains requiring renewal.`);

  const results = [];
  for (const domain of expiringDomains) {
    try {
      const res = await renewDomainSsl(domain.id);
      results.push({ domain: domain.domain, success: true, expiresAt: res.certExpiresAt });
    } catch (err: any) {
      console.error(`[SSL Auto-Renew Cron] Failed to renew certificate for ${domain.domain}:`, err.message);
      results.push({ domain: domain.domain, success: false, error: err.message });
    }
  }

  return {
    processedCount: expiringDomains.length,
    results,
  };
}
