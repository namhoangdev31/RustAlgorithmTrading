import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliBinDir = path.join(__dirname, "../bin");
const cliScriptPath = path.join(cliBinDir, "index.js");
const signaturePath = path.join(cliBinDir, "lepos.sig");

async function signCliPackage() {
  console.log("Generating asymmetric RSA Key Pair for CLI package signing...");
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  if (!fs.existsSync(cliScriptPath)) {
    console.error(`Error: CLI index.js not found at ${cliScriptPath}`);
    process.exit(1);
  }

  console.log("Reading CLI source file...");
  let sourceCode = fs.readFileSync(cliScriptPath, "utf8");

  // Format public key to fit as a clean single-line or multi-line string in the template
  const cleanPublicKey = publicKey.trim();

  // If there's a placeholder or existing key, we replace it.
  // We search for: const PUBLIC_KEY = `...`; or placeholder
  const keyDeclarationRegex = /const PUBLIC_KEY = `[^`]*`;/g;
  const placeholderRegex = /%%LEPOS_PUBLIC_KEY%%/g;

  if (sourceCode.match(keyDeclarationRegex)) {
    console.log("Updating existing Public Key in CLI source code...");
    sourceCode = sourceCode.replace(keyDeclarationRegex, `const PUBLIC_KEY = \`\n${cleanPublicKey}\n\`;`);
  } else if (sourceCode.includes("%%LEPOS_PUBLIC_KEY%%")) {
    console.log("Injecting Public Key into placeholder...");
    sourceCode = sourceCode.replace("%%LEPOS_PUBLIC_KEY%%", cleanPublicKey);
  } else {
    // If not found, prepending it at the top after shebang
    console.log("Prepending Public Key declaration to source code...");
    const lines = sourceCode.split("\n");
    lines.splice(2, 0, `const PUBLIC_KEY = \`\n${cleanPublicKey}\n\`;`);
    sourceCode = lines.join("\n");
  }

  // Write updated source code back
  fs.writeFileSync(cliScriptPath, sourceCode, "utf8");
  console.log("Saved updated CLI script with new Public Key.");

  // Sign the code
  console.log("Signing CLI script using RSA Private Key...");
  const codeBuffer = fs.readFileSync(cliScriptPath);
  const signer = crypto.createSign("sha256");
  signer.update(codeBuffer);
  signer.end();
  const signature = signer.sign(privateKey);

  // Write signature to sibling sig file
  fs.writeFileSync(signaturePath, signature);
  console.log(`Successfully generated code signature: ${signaturePath}`);
  console.log("Verification keypair synchronization complete. 🔒");
}

signCliPackage().catch((err) => {
  console.error("Error signing package:", err);
  process.exit(1);
});
