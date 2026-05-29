import { Vercel } from "@vercel/sdk";
import { prisma } from "@/lib/server/prisma";
import { decryptSecret } from "@/lib/server/secret-crypto";

export async function getVercelClient(userId: string): Promise<Vercel> {
  const rows = await prisma.$queryRawUnsafe<Array<{ encrypted_value: string }>>(
    "SELECT encrypted_value FROM user_secrets WHERE user_id = $1 AND provider = $2 LIMIT 1",
    userId,
    "vercel"
  );

  if (!rows || rows.length === 0) {
    throw new Error("Vercel API key is not configured. Please set it in Settings.");
  }

  const apiKey = decryptSecret(rows[0].encrypted_value);
  return new Vercel({
    bearerToken: apiKey,
  });
}

export async function hasVercelApiKey(userId: string): Promise<boolean> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ encrypted_value: string }>>(
      "SELECT encrypted_value FROM user_secrets WHERE user_id = $1 AND provider = $2 LIMIT 1",
      userId,
      "vercel"
    );
    return !!rows && rows.length > 0;
  } catch (error) {
    console.error("Error checking Vercel API key:", error);
    return false;
  }
}
