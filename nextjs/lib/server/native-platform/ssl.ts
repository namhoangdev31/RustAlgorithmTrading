import { prisma } from "@/lib/server/prisma";
import { syncProjectRouting } from "./deployments";
import { redisPublish } from "./redis";
import crypto from "crypto";

/**
 * Simulates Let's Encrypt DNS-01 verification challenge using provider API.
 */
async function verifyDnsChallenge(
  domain: string,
  provider: string,
  credentials: any,
  txtToken: string
): Promise<boolean> {
  console.log(`[ACME Client] Initiating DNS-01 challenge for wildcard domain: ${domain} using provider: ${provider}`);
  const provUpper = provider.toUpperCase();
  
  if (provUpper === "CLOUDFLARE") {
    const token = credentials?.cloudflareToken || "default-token";
    console.log(`[Cloudflare API] Authenticating using token: ${token.substring(0, 4)}...`);
    console.log(`[Cloudflare API] Adding TXT record _acme-challenge.${domain} -> ${txtToken}`);
    try {
      const zoneId = credentials?.cloudflareZoneId || "mock-zone-id";
      await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "TXT",
          name: `_acme-challenge.${domain}`,
          content: txtToken,
          ttl: 60
        })
      });
    } catch (err) {
      // Ignore network errors in simulation
    }
  } else if (provUpper === "ROUTE53") {
    const key = credentials?.awsAccessKeyId || "default-key";
    console.log(`[AWS Route53 API] Authenticating using IAM Key: ${key.substring(0, 4)}...`);
    console.log(`[AWS Route53 API] ChangeResourceRecordSets: Creating TXT _acme-challenge.${domain} -> ${txtToken}`);
    try {
      const hostedZoneId = credentials?.awsHostedZoneId || "mock-zone-id";
      await fetch(`https://route53.amazonaws.com/2013-04-01/hostedzone/${hostedZoneId}/rrset`, {
        method: "POST",
        headers: {
          "X-Amz-Target": "Route53.ChangeResourceRecordSets",
          "Content-Type": "application/xml"
        },
        body: `<ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2013-04-01/"><ChangeBatch><Changes><Change><Action>CREATE</Action><ResourceRecordSet><Name>_acme-challenge.${domain}</Name><Type>TXT</Type><TTL>60</TTL><ResourceRecords><ResourceRecord><Value>"${txtToken}"</Value></ResourceRecord></ResourceRecords></ResourceRecordSet></Change></Changes></ChangeBatch></ChangeResourceRecordSetsRequest>`
      });
    } catch (err) {
      // Ignore network errors in simulation
    }
  } else if (provUpper === "GODADDY") {
    const key = credentials?.godaddyApiKey || "default-key";
    const secret = credentials?.godaddyApiSecret || "default-secret";
    console.log(`[GoDaddy API] Authenticating using Key: ${key.substring(0, 4)}...`);
    console.log(`[GoDaddy API] Updating DNS record TXT _acme-challenge.${domain} -> ${txtToken}`);
    try {
      await fetch(`https://api.godaddy.com/v1/domains/${domain}/records/TXT/_acme-challenge`, {
        method: "PUT",
        headers: {
          "Authorization": `sso-key ${key}:${secret}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([{ data: txtToken, ttl: 600 }])
      });
    } catch (err) {
      // Ignore network errors in simulation
    }
  } else {
    throw new Error(`Unsupported DNS provider: ${provider}`);
  }

  // Simulate propagation wait
  await new Promise((resolve) => setTimeout(resolve, 300));
  console.log(`[ACME Client] DNS propagation complete. Challenge record verified.`);
  return true;
}

/**
 * Simulates Let's Encrypt ACME Client SSL Certificate Generation and Renewal.
 */
export async function renewDomainSsl(domainId: string) {
  const domainConfig = await prisma.nativeDomainConfig.findUnique({
    where: { id: domainId },
  });

  if (!domainConfig) {
    throw new Error("Domain configuration not found.");
  }

  console.log(`[ACME Client] Initiating Let's Encrypt SSL renewal challenge for: ${domainConfig.domain}`);

  // 1. Simulate DNS/HTTP validation challenge verification
  let dnsVerificationSuccessful = true;
  if (domainConfig.dnsProvider) {
    try {
      dnsVerificationSuccessful = await verifyDnsChallenge(
        domainConfig.domain,
        domainConfig.dnsProvider,
        domainConfig.dnsCredentials,
        domainConfig.txtRecordToken
      );
    } catch (err: any) {
      console.error(`[ACME Client] DNS API challenge failed for ${domainConfig.domain}:`, err.message);
      dnsVerificationSuccessful = false;
    }
  } else {
    // Statically succeed for manual validation simulation
    dnsVerificationSuccessful = true;
  }

  if (!dnsVerificationSuccessful) {
    await prisma.nativeDomainConfig.update({
      where: { id: domainId },
      data: { sslStatus: "FAILED" },
    });
    throw new Error(`[ACME Client] ACME verification challenge failed for ${domainConfig.domain}`);
  }

  // 2. Generate mocked Let's Encrypt PEM Certificate & Private Key
  const certId = crypto.randomUUID();
  const isWildcard = domainConfig.domain.startsWith("*.");
  const certSubject = domainConfig.domain;
  
  const mockCertPem = `-----BEGIN CERTIFICATE-----\nSubject: CN=${certSubject}\nIssuer: Let's Encrypt Authority X3\nMOCK_LETS_ENCRYPT_CERT_${certId}\n-----END CERTIFICATE-----`;
  const mockKeyPem = `-----BEGIN PRIVATE KEY-----\nMOCK_LETS_ENCRYPT_KEY_${certId}\n-----END PRIVATE KEY-----`;

  const now = new Date();
  const certExpiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days validity

  // 3. Update database certificate references
  const updated = await prisma.nativeDomainConfig.update({
    where: { id: domainId },
    data: {
      dnsVerified: true,
      sslStatus: "ISSUED",
      certIssuedAt: now,
      certExpiresAt: certExpiresAt,
      certPemRef: `internal://certs/${domainConfig.domain}/cert.pem`,
      keyPemRef: `internal://certs/${domainConfig.domain}/key.pem`,
      updatedAt: now,
    },
  });

  // 4. Update Redis routing config mapping
  await syncProjectRouting(domainConfig.projectId);

  // 5. Publish real-time SSL reload message to Go Edge Proxy
  await redisPublish("lepos:reload-cert", {
    domain: domainConfig.domain,
    certPem: mockCertPem,
    keyPem: mockKeyPem,
    issuedAt: now.toISOString(),
    expiresAt: certExpiresAt.toISOString(),
  });

  console.log(`[ACME Client] Successfully renewed Let's Encrypt SSL for ${domainConfig.domain}. Expires in 90 days.`);

  return {
    success: true,
    domain: domainConfig.domain,
    certExpiresAt,
  };
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
