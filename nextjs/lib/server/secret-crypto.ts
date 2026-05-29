import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function resolveMasterKey() {
  const source =
    process.env.APP_SECRETS_MASTER_KEY ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "development-only-master-key";
  return createHash("sha256").update(source).digest();
}

export function encryptSecret(plainText: string) {
  const iv = randomBytes(12);
  const key = resolveMasterKey();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string) {
  const [version, iv64, tag64, data64] = payload.split(":");
  if (version !== "v1" || !iv64 || !tag64 || !data64) {
    throw new Error("Invalid secret payload format.");
  }

  const key = resolveMasterKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv64, "base64"));
  decipher.setAuthTag(Buffer.from(tag64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
