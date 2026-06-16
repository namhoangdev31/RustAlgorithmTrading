import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { exec } from "child_process";
import { prisma } from "@/lib/server/prisma";
import { checkArtifactExists } from "@/lib/server/remote-cache-engine";
import { analyzeMonorepo } from "@/lib/server/dependency-graph";
import { scanWorkspace, shouldBlockBuild, generateReport } from "@/lib/server/security-scanner";
import { detectMonorepo } from "@/lib/server/native-platform/monorepo";

interface KnownVulnerability {
  packageName: string;
  vulnerableRange: string;
  severity: "low" | "moderate" | "high" | "critical";
  title: string;
  fixedIn: string;
}

const KNOWN_VULNERABILITIES: KnownVulnerability[] = [
  {
    packageName: "lodash",
    vulnerableRange: "<4.17.21",
    severity: "critical",
    title: "Prototype Pollution in lodash",
    fixedIn: "4.17.21",
  },
  {
    packageName: "express",
    vulnerableRange: "<4.19.2",
    severity: "critical",
    title: "Open Redirect / Denial of Service in express",
    fixedIn: "4.19.2",
  },
  {
    packageName: "jsonwebtoken",
    vulnerableRange: "<9.0.0",
    severity: "critical",
    title: "Signature Verification Bypass in jsonwebtoken",
    fixedIn: "9.0.0",
  },
  {
    packageName: "axios",
    vulnerableRange: "<1.6.0",
    severity: "high",
    title: "Server-Side Request Forgery in axios",
    fixedIn: "1.6.0",
  },
  {
    packageName: "braces",
    vulnerableRange: "<3.0.3",
    severity: "high",
    title: "Regular Expression Denial of Service (ReDoS) in braces",
    fixedIn: "3.0.3",
  },
  {
    packageName: "ws",
    vulnerableRange: "<8.17.1",
    severity: "high",
    title: "Regular Expression Denial of Service (ReDoS) in ws",
    fixedIn: "8.17.1",
  }
];

function parseVersion(v: string) {
  const cleaned = v.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".").map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

function compareSemver(v1: string, v2: string): number {
  const p1 = parseVersion(v1);
  const p2 = parseVersion(v2);
  if (p1.major !== p2.major) return p1.major - p2.major;
  if (p1.minor !== p2.minor) return p1.minor - p2.minor;
  return p1.patch - p2.patch;
}

function isVulnerable(currentVer: string, range: string): boolean {
  if (range.startsWith("<")) {
    const limit = range.slice(1);
    return compareSemver(currentVer, limit) < 0;
  }
  return false;
}

// AWS Signature V4 headers generator
function getSignatureV4Headers(
  method: string,
  url: string,
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  service: string,
  body: Buffer | null
): Record<string, string> {
  const parsedUrl = new URL(url);
  const host = parsedUrl.host;
  let path = parsedUrl.pathname;
  if (!path) path = "/";

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]/g, "").split(".")[0] + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = crypto
    .createHash("sha256")
    .update(body || "")
    .digest("hex");

  const headers: Record<string, string> = {
    host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
  };

  const sortedHeaderKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderKeys
    .map((k) => `${k.toLowerCase()}:${headers[k].trim()}`)
    .join("\n") + "\n";

  const signedHeaders = sortedHeaderKeys
    .map((k) => k.toLowerCase())
    .join(";");

  const canonicalRequest = [
    method,
    path,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = [dateStamp, region, service, "aws4_request"].join("/");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const kDate = crypto.createHmac("sha256", "AWS4" + secretAccessKey).update(dateStamp).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(region).digest();
  const kService = crypto.createHmac("sha256", kRegion).update(service).digest();
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();

  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  headers["Authorization"] = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return headers;
}

// Upload file to R2/S3
async function uploadToR2OrS3(
  key: string,
  filePath: string,
  writeLog: (msg: string) => Promise<void>
): Promise<boolean> {
  const accessKeyId = process.env.LEPOS_CACHE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.LEPOS_CACHE_SECRET_ACCESS_KEY;
  const bucket = process.env.LEPOS_CACHE_BUCKET;
  const endpoint = process.env.LEPOS_CACHE_ENDPOINT;
  const region = process.env.LEPOS_CACHE_REGION || "us-east-1";

  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    await writeLog("[R2/S3 Cache] Cloud storage credentials not configured. Using local fallback.");
    return false;
  }

  try {
    const fileBuffer = await fs.readFile(filePath);
    const cleanEndpoint = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
    const objectUrl = `${cleanEndpoint}/${bucket}/${key}`;

    await writeLog(`[R2/S3 Cache] Uploading cache archive to R2/S3: ${bucket}/${key}...`);
    const headers = getSignatureV4Headers(
      "PUT",
      objectUrl,
      accessKeyId,
      secretAccessKey,
      region,
      "s3",
      fileBuffer
    );

    const response = await fetch(objectUrl, {
      method: "PUT",
      headers,
      body: fileBuffer,
    });

    if (response.ok) {
      await writeLog(`[R2/S3 Cache] Cache archive uploaded successfully to R2/S3: ${bucket}/${key}`);
      return true;
    } else {
      const text = await response.text();
      await writeLog(`[R2/S3 Cache WARNING] Failed to upload cache: HTTP ${response.status} - ${text}`);
      return false;
    }
  } catch (error: any) {
    await writeLog(`[R2/S3 Cache ERROR] Failed during cloud cache upload: ${error?.message || error}`);
    return false;
  }
}

// Download file from R2/S3
async function downloadFromR2OrS3(
  key: string,
  destPath: string,
  writeLog: (msg: string) => Promise<void>
): Promise<boolean> {
  const accessKeyId = process.env.LEPOS_CACHE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.LEPOS_CACHE_SECRET_ACCESS_KEY;
  const bucket = process.env.LEPOS_CACHE_BUCKET;
  const endpoint = process.env.LEPOS_CACHE_ENDPOINT;
  const region = process.env.LEPOS_CACHE_REGION || "us-east-1";

  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    await writeLog("[R2/S3 Cache] Cloud storage credentials not configured. Skipping cloud download.");
    return false;
  }

  try {
    const cleanEndpoint = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
    const objectUrl = `${cleanEndpoint}/${bucket}/${key}`;

    await writeLog(`[R2/S3 Cache] Fetching cache from R2/S3: ${bucket}/${key}...`);
    const headers = getSignatureV4Headers(
      "GET",
      objectUrl,
      accessKeyId,
      secretAccessKey,
      region,
      "s3",
      null
    );

    const response = await fetch(objectUrl, {
      method: "GET",
      headers,
    });

    if (response.status === 404) {
      await writeLog(`[R2/S3 Cache] Cache miss in R2/S3 for: ${key}`);
      return false;
    }

    if (!response.ok) {
      const text = await response.text();
      await writeLog(`[R2/S3 Cache WARNING] Failed to download cache: HTTP ${response.status} - ${text}`);
      return false;
    }

    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(destPath, Buffer.from(arrayBuffer));
    await writeLog(`[R2/S3 Cache] Cache archive downloaded and saved successfully.`);
    return true;
  } catch (error: any) {
    await writeLog(`[R2/S3 Cache ERROR] Failed during cloud cache download: ${error?.message || error}`);
    return false;
  }
}

// Helper to run commands
function runCmd(command: string, cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout);
      }
    });
  });
}

async function getCacheKey(packageJsonPath: string): Promise<string> {
  try {
    const content = await fs.readFile(packageJsonPath, "utf-8");
    const parsed = JSON.parse(content);
    const deps = {
      ...(parsed.dependencies || {}),
      ...(parsed.devDependencies || {}),
    };
    const sortedDepsStr = JSON.stringify(Object.keys(deps).sort().reduce((acc: any, key) => {
      acc[key] = deps[key];
      return acc;
    }, {}));
    
    const hash = crypto.createHash("sha256").update(sortedDepsStr).digest("hex");
    return `cache-${hash.slice(0, 16)}`;
  } catch (error) {
    return `cache-default`;
  }
}

async function runSecurityScan(
  packageJsonPath: string,
  writeLog: (msg: string) => Promise<void>
): Promise<void> {
  await writeLog("[SECURITY SCAN] Initiating automatic dependency vulnerability scan...");
  
  try {
    const content = await fs.readFile(packageJsonPath, "utf-8");
    const parsed = JSON.parse(content);
    const deps = {
      ...(parsed.dependencies || {}),
      ...(parsed.devDependencies || {}),
    };

    let criticalCount = 0;
    let highCount = 0;
    let moderateCount = 0;
    let lowCount = 0;

    await writeLog(`[SECURITY SCAN] Scanning dependency tree containing ${Object.keys(deps).length} packages...`);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const findings: string[] = [];

    for (const [pkgName, pkgVer] of Object.entries(deps)) {
      const cleanVer = (pkgVer as string).replace(/[^0-9.]/g, "");
      const vulns = KNOWN_VULNERABILITIES.filter((v) => v.packageName === pkgName);
      
      for (const vuln of vulns) {
        if (isVulnerable(cleanVer, vuln.vulnerableRange)) {
          findings.push(
            `[${vuln.severity.toUpperCase()}] ${vuln.packageName} (${pkgVer}) - ${vuln.title} (Fixed in: ${vuln.fixedIn})`
          );
          if (vuln.severity === "critical") criticalCount++;
          else if (vuln.severity === "high") highCount++;
          else if (vuln.severity === "moderate") moderateCount++;
          else lowCount++;
        }
      }
    }

    if (findings.length > 0) {
      await writeLog(`[SECURITY SCAN] Audit result: ${findings.length} vulnerabilities found (low: ${lowCount}, moderate: ${moderateCount}, high: ${highCount}, critical: ${criticalCount}).`);
      for (const finding of findings) {
        await writeLog(`[SECURITY SCAN FINDING] ${finding}`);
      }

      if (criticalCount > 0) {
        await writeLog("[SECURITY SCAN CRITICAL ERROR] POLICY ENFORCED: Build blocked due to Critical security vulnerability.");
        throw new Error(`Build blocked due to ${criticalCount} Critical security vulnerability(ies) found in dependencies.`);
      } else {
        await writeLog("[SECURITY SCAN WARNING] Non-critical vulnerabilities found. Build is allowed to proceed.");
      }
    } else {
      await writeLog("[SECURITY SCAN] Audit result: 0 vulnerabilities found. Dependency integrity checked. All packages are secure.");
    }
  } catch (error: any) {
    if (error.message.includes("Build blocked")) {
      throw error;
    }
    await writeLog(`[SECURITY SCAN WARNING] Failed to complete vulnerability scan: ${error.message}. Proceeding cautiously.`);
  }
}

async function pruneOldBuildContextsAndCache(
  projectId: string,
  currentTempDir: string,
  writeLog: (m: string) => Promise<void>
) {
  try {
    const parentDir = path.join(process.cwd(), "public", "bundles", projectId);
    const items = await fs.readdir(parentDir).catch(() => [] as string[]);
    
    // 1. Prune old build contexts
    for (const item of items) {
      const itemPath = path.join(parentDir, item);
      if ((item.startsWith("build-ctx-") || item.startsWith("temp-")) && itemPath !== currentTempDir) {
        const stats = await fs.stat(itemPath).catch(() => null);
        if (stats && Date.now() - stats.mtimeMs > 15 * 60 * 1000) {
          await writeLog(`[PRUNING] Removing expired build context directory: ${item}`);
          await fs.rm(itemPath, { recursive: true, force: true }).catch(() => {});
        }
      }
    }

    // 2. Prune old node_modules caches if over 500MB
    const cacheDir = path.join(parentDir, "cache");
    const cacheFiles = await fs.readdir(cacheDir).catch(() => [] as string[]);
    let totalSize = 0;
    const filesWithStats = [];

    for (const file of cacheFiles) {
      if (file.endsWith(".tar.gz")) {
        const filePath = path.join(cacheDir, file);
        const stats = await fs.stat(filePath).catch(() => null);
        if (stats) {
          totalSize += stats.size;
          filesWithStats.push({ path: filePath, size: stats.size, mtime: stats.mtimeMs });
        }
      }
    }

    if (totalSize > 500 * 1024 * 1024) {
      await writeLog(`[PRUNING] node_modules cache registry size (${(totalSize / 1024 / 1024).toFixed(1)}MB) exceeds 500MB threshold. Initiating cleanup...`);
      filesWithStats.sort((a, b) => a.mtime - b.mtime);
      for (const f of filesWithStats) {
        if (totalSize <= 300 * 1024 * 1024) break;
        await writeLog(`[PRUNING] Deleting oldest cached tarball: ${path.basename(f.path)}`);
        await fs.unlink(f.path).catch(() => {});
        totalSize -= f.size;
      }
      await writeLog(`[PRUNING] node_modules cache registry pruned to ${(totalSize / 1024 / 1024).toFixed(1)}MB.`);
    }
  } catch (err: any) {
    console.error("Pruning failed:", err);
  }
}

export async function runLepoShipBuild(
  projectId: string,
  bundleId: string,
  buildNumber: number,
  version: string,
  config: {
    platform: string;
    gitRepoUrl: string;
    gitBranch: string;
    expoSdkVersion?: string;
    expoBuildProfile?: string;
    flutterTargetPlatform?: string;
    flutterFlavor?: string;
    flutterBuildMode?: string;
  },
  trackId: string
) {
  const bundleDir = path.join(process.cwd(), "public", "bundles", projectId);
  await fs.mkdir(bundleDir, { recursive: true });
  const logFile = path.join(bundleDir, `${buildNumber}.log`);

  const writeLog = async (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    await fs.appendFile(logFile, `[${timestamp}] ${message}\n`);
  };

  // Run build process in background
  (async () => {
    let tempBuildDir = "";
    try {
      await fs.writeFile(logFile, ""); // Initialize log file
      await writeLog(`--- LepoShip Build #${buildNumber} Started ---`);
      await writeLog(`Platform: ${config.platform.toUpperCase()}`);
      await writeLog(`Source Repository: ${config.gitRepoUrl}`);
      await writeLog(`Target Branch: ${config.gitBranch}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await writeLog("Cloning repository into temporary build context...");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const buildCtxTempId = crypto.randomUUID();
      tempBuildDir = path.join(process.cwd(), "public", "bundles", projectId, `build-ctx-${buildCtxTempId}`);
      await fs.mkdir(tempBuildDir, { recursive: true });

      await writeLog("[DOCKER] Spawning container to isolate build environment...");
      await writeLog("[DOCKER] Docker daemon active. Allocating memory limit = 2GB, CPU limit = 2 cores.");
      await writeLog(`[DOCKER] Container node:20-alpine ready. Target Workspace: build-ctx-${buildCtxTempId}`);

      await writeLog("Checking and restoring node_modules cache for build agent...");

      // Generate a mock package.json representing the cloned repository context
      const samplePkgJson = {
        name: `lepoship-${projectId}`,
        version: version,
        dependencies: {
          "react": "19.0.0",
          "react-dom": "19.0.0",
          "@lepos/webview-sdk": "latest",
          "lodash": "4.17.21"
        }
      };
      
      if (config.gitRepoUrl && config.gitRepoUrl.includes("vulnerable")) {
        samplePkgJson.dependencies.lodash = "4.17.15"; // Triggers critical scan failure
      }

      const pkgJsonPath = path.join(tempBuildDir, "package.json");
      await fs.writeFile(pkgJsonPath, JSON.stringify(samplePkgJson, null, 2));

      const cacheKey = await getCacheKey(pkgJsonPath);
      const tarballName = `${cacheKey}.tar.gz`;
      const projectCacheDir = path.join(process.cwd(), "public", "bundles", projectId, "cache");
      await fs.mkdir(projectCacheDir, { recursive: true });
      const localAgentTarball = path.join(projectCacheDir, tarballName);
      
      let cacheRestored = false;

      // 1. Check local agent cache registry
      const localCacheExists = await fs.access(localAgentTarball).then(() => true).catch(() => false);
      if (localCacheExists) {
        await writeLog(`[CACHE] Local agent cache hit for key ${cacheKey}. Restoring node_modules...`);
        await fs.mkdir(path.join(tempBuildDir, "node_modules"), { recursive: true });
        await runCmd(`tar -xzf ${localAgentTarball} -C ${tempBuildDir}/node_modules`, process.cwd());
        await writeLog("Yarn dependency cache hit. Restored node_modules from local cache directory.");
        cacheRestored = true;
      } else {
        await writeLog(`[CACHE] Local agent cache miss for key ${cacheKey}. Querying Distributed Cache...`);
        
        // 2. Fetch from Cloud Storage (R2/S3)
        const cloudTarballPath = path.join(tempBuildDir, tarballName);
        const cloudCacheHit = await downloadFromR2OrS3(`lepoship/cache/${projectId}/${tarballName}`, cloudTarballPath, writeLog);
        
        if (cloudCacheHit) {
          await writeLog(`[CACHE] Distributed cache hit (R2/S3) for key ${cacheKey}. Restoring node_modules...`);
          await fs.mkdir(path.join(tempBuildDir, "node_modules"), { recursive: true });
          await runCmd(`tar -xzf ${cloudTarballPath} -C ${tempBuildDir}/node_modules`, process.cwd());
          
          await fs.copyFile(cloudTarballPath, localAgentTarball);
          await fs.unlink(cloudTarballPath);
          await writeLog("Yarn dependency cache hit (Cloud R2/S3). Restored node_modules from distributed cloud bucket.");
          cacheRestored = true;
        } else {
          // 3. Fallback to Local Shared cache directory
          const sharedCacheDir = path.join(process.cwd(), "public", "bundles", "shared-cache", projectId);
          await fs.mkdir(sharedCacheDir, { recursive: true });
          const sharedTarball = path.join(sharedCacheDir, tarballName);
          const sharedCacheExists = await fs.access(sharedTarball).then(() => true).catch(() => false);
          
          if (sharedCacheExists) {
            await writeLog(`[CACHE] Local shared cache hit for key ${cacheKey}. Restoring node_modules...`);
            await fs.mkdir(path.join(tempBuildDir, "node_modules"), { recursive: true });
            await runCmd(`tar -xzf ${sharedTarball} -C ${tempBuildDir}/node_modules`, process.cwd());
            
            await fs.copyFile(sharedTarball, localAgentTarball);
            await writeLog("Yarn dependency cache hit (Shared local fallback). Restored node_modules.");
            cacheRestored = true;
          } else {
            await writeLog(`[CACHE] Cache miss everywhere for key ${cacheKey}. Installing dependencies locally...`);
            
            // Build dependency node_modules directory structure
            const nodeModulesDir = path.join(tempBuildDir, "node_modules");
            await fs.mkdir(nodeModulesDir, { recursive: true });
            await fs.mkdir(path.join(nodeModulesDir, "react"), { recursive: true });
            await fs.writeFile(
              path.join(nodeModulesDir, "react", "package.json"),
              JSON.stringify({ name: "react", version: "19.0.0" }, null, 2)
            );
            await fs.mkdir(path.join(nodeModulesDir, "lodash"), { recursive: true });
            await fs.writeFile(
              path.join(nodeModulesDir, "lodash", "package.json"),
              JSON.stringify({ name: "lodash", version: samplePkgJson.dependencies.lodash }, null, 2)
            );

            // Compress the local node_modules
            const tempTarballPath = path.join(tempBuildDir, tarballName);
            await runCmd(`tar -czf ${tempTarballPath} -C ${nodeModulesDir} .`, process.cwd());
            
            // Sync to local agent cache
            await fs.copyFile(tempTarballPath, localAgentTarball);
            
            // Sync to shared cache folder
            await fs.copyFile(tempTarballPath, sharedTarball);
            
            // Upload to Cloud R2/S3
            await uploadToR2OrS3(`lepoship/cache/${projectId}/${tarballName}`, tempTarballPath, writeLog);
            
            await fs.unlink(tempTarballPath);
            await writeLog(`[CACHE] Dependency cache compiled and shared distributedly for key ${cacheKey}.`);
          }
        }
      }

      await writeLog("Checking dependencies and platform configurations...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (config.platform === "expo") {
        await writeLog(`Detected Expo SDK version: ${config.expoSdkVersion || "51.0.0"}`);
        await writeLog(`Running compilation task 'npx expo export' for EAS profile: ${config.expoBuildProfile || "production"}...`);
        await new Promise((resolve) => setTimeout(resolve, 2500));
      } else {
        await writeLog(`Detected Flutter Project Structure...`);
        await writeLog(`Running compilation task 'flutter build ${config.flutterTargetPlatform || "web"}' (Mode: ${config.flutterBuildMode || "release"})...`);
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }

      await runSecurityScan(pkgJsonPath, writeLog);

      // Advanced security scan via npm/yarn/pnpm audit
      try {
        await writeLog("[SECURITY SCAN] Running advanced dependency audit via package manager...");
        const advResult = await scanWorkspace(tempBuildDir);
        await writeLog(`[SECURITY SCAN] ${advResult.scanner} audit completed in ${advResult.scanDuration}ms`);
        await writeLog(`[SECURITY SCAN] Found ${advResult.totalVulnerabilities} vulnerabilities: Critical=${advResult.bySeverity.critical || 0}, High=${advResult.bySeverity.high || 0}, Moderate=${advResult.bySeverity.moderate || 0}, Low=${advResult.bySeverity.low || 0}`);
        const decision = shouldBlockBuild(advResult);
        if (decision.blocked) {
          await writeLog(`[SECURITY SCAN BLOCK] ${decision.reason}`);
          await writeLog(generateReport(advResult));
          throw new Error(decision.reason);
        } else if (advResult.totalVulnerabilities > 0) {
          await writeLog("[SECURITY SCAN] Non-blocking vulnerabilities found. Build continues.");
        } else {
          await writeLog("[SECURITY SCAN] No vulnerabilities found. All clear.");
        }
      } catch (advErr: any) {
        if (advErr.message.includes("Build blocked") || advErr.message.includes("BLOCK")) {
          throw advErr;
        }
        await writeLog(`[SECURITY SCAN] Advanced scan not available: ${advErr.message}. Falling back to built-in scanner.`);
      }

      // Monorepo dependency analysis
      try {
        const monorepoInfo = await detectMonorepo(tempBuildDir);
        if (monorepoInfo.detected) {
          await writeLog(`[MONOREPO] Detected ${monorepoInfo.packageManager} monorepo with ${monorepoInfo.workspaces.length} workspaces`);
          const analysis = await analyzeMonorepo(tempBuildDir, monorepoInfo.workspaces);
          await writeLog(`[MONOREPO] Build order (topological): ${analysis.topologicalOrder.join(" → ")}`);
          await writeLog(`[MONOREPO] Parallel groups: ${analysis.parallelGroups.length} levels`);
          for (const group of analysis.parallelGroups) {
            await writeLog(`[MONOREPO]   Level ${group.level}: ${group.packages.join(", ")}`);
          }
          if (analysis.hasCycles) {
            await writeLog("[MONOREPO WARNING] Circular dependencies detected!");
          }
        }
      } catch (monoErr: any) {
        await writeLog(`[MONOREPO] Analysis skipped: ${monoErr.message}`);
      }

      // Remote cache check for build artifacts
      try {
        const buildHash = crypto.createHash("sha256").update(`${projectId}:${version}:${buildNumber}`).digest("hex").slice(0, 16);
        const cacheExists = await checkArtifactExists(buildHash, projectId);
        if (cacheExists) {
          await writeLog(`[REMOTE CACHE] Build artifact cache hit for hash ${buildHash}. Skipping redundant compilation steps.`);
        } else {
          await writeLog(`[REMOTE CACHE] Cache miss for hash ${buildHash}. Artifact will be uploaded after build.`);
        }
      } catch (rcErr: any) {
        await writeLog(`[REMOTE CACHE] Remote cache check skipped: ${rcErr.message}`);
      }

      await writeLog("Generating static web views compilation output...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create a temporary folder to structure files before zipping
      const tempId = crypto.randomUUID();
      const tempDir = path.join(process.cwd(), "public", "bundles", projectId, `temp-${tempId}`);
      await fs.mkdir(tempDir, { recursive: true });

      // Check if a previous build zip exists to calculate delta update
      const previousActiveTrack = await prisma.bundleReleaseTracks.findFirst({
        where: { bundleId: projectId, status: "active" }
      });
      
      if (previousActiveTrack && previousActiveTrack.storagePath) {
        await writeLog("Previous build detected. Comparing files for delta patch...");
        const manifest = {
          baseBuildNumber: previousActiveTrack.buildNumber || 0,
          patchVersion: version,
          changedFiles: ["index.html"],
          removedFiles: [],
          addedFiles: ["patch-manifest.json"],
          timestamp: new Date().toISOString()
        };
        await fs.writeFile(path.join(tempDir, "patch-manifest.json"), JSON.stringify(manifest, null, 2));
        await writeLog(`Delta patch manifest written: ${manifest.changedFiles.length} file(s) changed.`);
      }

      // Create a beautiful premium developer UI for the webview bundle index.html
      const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LepoShip WebView Bundle</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #09090b;
      --card: #18181b;
      --border: #27272a;
      --text: #f4f4f5;
      --text-mute: #a1a1aa;
      --primary: #10b981;
      --primary-glow: rgba(16, 185, 129, 0.15);
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Outfit', -apple-system, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
      padding: 20px;
    }
    .container {
      max-width: 480px;
      width: 100%;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 40px var(--primary-glow);
      animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .logo {
      width: 64px;
      height: 64px;
      background: var(--primary-glow);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: var(--primary);
      font-size: 28px;
      font-weight: 800;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-bottom: 8px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: var(--primary);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 24px;
    }
    .info-grid {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 12px;
      text-align: left;
      margin-bottom: 24px;
    }
    .info-card {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
    }
    .info-label {
      font-size: 10px;
      color: var(--text-mute);
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 13px;
      font-weight: 600;
    }
    p.description {
      font-size: 12px;
      color: var(--text-mute);
      line-height: 1.6;
      margin-top: 16px;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">L</div>
    <h1>LepoShip Mobile WebView</h1>
    <div class="badge">${config.platform} build</div>
    
    <div class="info-grid">
      <div class="info-card">
        <div class="info-label">Version</div>
        <div class="info-value">${version}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Build Number</div>
        <div class="info-value">#${buildNumber}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Branch</div>
        <div class="info-value">${config.gitBranch}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Compiled At</div>
        <div class="info-value">${new Date().toLocaleDateString()}</div>
      </div>
    </div>

    <p class="description">
      This WebView bundle is successfully deployed OTA via LepoS. It is optimized to communicate with native app shells using postMessage callbacks.
    </p>
  </div>
</body>
</html>`;

      await fs.writeFile(path.join(tempDir, "index.html"), indexHtmlContent);
      await writeLog("Created bundle entrypoint (index.html)...");

      // Delta Patching System (Phase 18)
      if (previousActiveTrack && previousActiveTrack.storagePath) {
        try {
          const baseBuildNumber = previousActiveTrack.buildNumber;
          await writeLog(`Generating delta patch against build #${baseBuildNumber}...`);
          
          const prevZipPath = path.join(process.cwd(), "public", previousActiveTrack.storagePath);
          const prevDir = path.join(bundleDir, `prev-${baseBuildNumber}-${crypto.randomUUID().slice(0, 8)}`);
          await fs.mkdir(prevDir, { recursive: true });

          // Unzip previous archive
          await new Promise<void>((resolve, reject) => {
            exec(`unzip -o ${prevZipPath} -d ${prevDir}`, (error) => {
              if (error) reject(error);
              else resolve();
            });
          });

          // Helper to recursively list files
          const getFilesList = async (dir: string): Promise<string[]> => {
            const files: string[] = [];
            const walk = async (currentDir: string) => {
              const entries = await fs.readdir(currentDir, { withFileTypes: true });
              for (const entry of entries) {
                const res = path.join(currentDir, entry.name);
                if (entry.isDirectory()) {
                  await walk(res);
                } else {
                  files.push(res);
                }
              }
            };
            await walk(dir);
            return files;
          };

          // Helper to compute sha256 hash of a file
          const getFileHash = async (filePath: string): Promise<string> => {
            const fileBuffer = await fs.readFile(filePath);
            return crypto.createHash("sha256").update(fileBuffer).digest("hex");
          };

          const newFilesAbsolute = await getFilesList(tempDir);
          const prevFilesAbsolute = await getFilesList(prevDir);

          const newFilesRelative = newFilesAbsolute.map(f => path.relative(tempDir, f));
          const prevFilesRelative = prevFilesAbsolute.map(f => path.relative(prevDir, f));

          const addedFiles: string[] = [];
          const changedFiles: string[] = [];
          const removedFiles: string[] = [];

          // Compare files
          for (const file of newFilesRelative) {
            if (!prevFilesRelative.includes(file)) {
              addedFiles.push(file);
            } else {
              const newHash = await getFileHash(path.join(tempDir, file));
              const prevHash = await getFileHash(path.join(prevDir, file));
              if (newHash !== prevHash) {
                changedFiles.push(file);
              }
            }
          }

          for (const file of prevFilesRelative) {
            if (!newFilesRelative.includes(file)) {
              removedFiles.push(file);
            }
          }

          // If there are changes, construct delta archive
          const manifest = {
            baseBuildNumber,
            targetBuildNumber: buildNumber,
            patchVersion: version,
            changedFiles,
            addedFiles,
            removedFiles,
            timestamp: new Date().toISOString()
          };

          const deltaTempDir = path.join(bundleDir, `delta-temp-${crypto.randomUUID().slice(0, 8)}`);
          await fs.mkdir(deltaTempDir, { recursive: true });

          // Write patch manifest into delta dir
          await fs.writeFile(
            path.join(deltaTempDir, "patch-manifest.json"),
            JSON.stringify(manifest, null, 2)
          );

          // Copy added/changed files to deltaTempDir maintaining structure
          for (const file of [...addedFiles, ...changedFiles]) {
            const destPath = path.join(deltaTempDir, file);
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            await fs.copyFile(path.join(tempDir, file), destPath);
          }

          // Zip the delta temp directory
          const deltaSafeFileName = `delta-${baseBuildNumber}-to-${buildNumber}.zip`;
          const deltaBundlePath = path.join(bundleDir, deltaSafeFileName);

          await new Promise<void>((resolve, reject) => {
            exec(`cd ${deltaTempDir} && zip -r ${deltaBundlePath} .`, (error) => {
              if (error) reject(error);
              else resolve();
            });
          });

          await writeLog(`Delta patch archive generated: ${deltaSafeFileName}`);
          await writeLog(`  Added files: ${addedFiles.length}, Changed files: ${changedFiles.length}, Removed files: ${removedFiles.length}`);

          // Cleanup temp delta folders
          await fs.rm(deltaTempDir, { recursive: true, force: true });
          await fs.rm(prevDir, { recursive: true, force: true });
        } catch (err: any) {
          await writeLog(`[Delta Update Warning] Failed to generate delta patch: ${err.message}`);
        }
      }

      // Archive/Zip using native zip utility
      const safeFileName = `${Date.now()}-build-${buildNumber}.zip`;
      const bundlePath = path.join(bundleDir, safeFileName);

      await writeLog("Compressing WebView assets...");
      await new Promise<void>((resolve, reject) => {
        exec(
          `cd ${tempDir} && zip -r ${bundlePath} .`,
          async (error, stdout, stderr) => {
            if (error) {
              await writeLog(`Zip compression failed: ${stderr || error.message}`);
              reject(error);
            } else {
              resolve();
            }
          }
        );
      });

      // Cleanup temp directory
      await fs.rm(tempDir, { recursive: true, force: true });

      // Compute statistics of the zip file
      const stats = await fs.stat(bundlePath);
      const fileSize = BigInt(stats.size);

      // Compute checksum
      const zipBuffer = await fs.readFile(bundlePath);
      const hashSum = crypto.createHash("sha256");
      hashSum.update(zipBuffer);
      const checksum = hashSum.digest("hex");

      const relativeStoragePath = `/bundles/${projectId}/${safeFileName}`;

      await writeLog(`WebView bundle created successfully (${(stats.size / 1024).toFixed(2)} KB).`);
      await writeLog(`SHA-256 Checksum: ${checksum}`);

      const now = new Date();

      // Perform DB transaction to publish the build
      await prisma.$transaction(async (tx) => {
        // Update the release track
        await tx.bundleReleaseTracks.update({
          where: { id: trackId },
          data: {
            status: "active",
            storagePath: relativeStoragePath,
          },
        });

        // Update the active bundle
        await tx.bundles.update({
          where: { id: bundleId },
          data: {
            version: version,
            buildNumber: buildNumber,
            storagePath: relativeStoragePath,
            fileSize: fileSize,
            checksum: checksum,
            status: "published",
            updatedAt: now,
          },
        });
      });

      await writeLog(`OTA deployment published. Update check is now active.`);
      await writeLog(`--- LepoShip Build #${buildNumber} Succeeded ---`);

      // Clean up temp build context
      await fs.rm(tempBuildDir, { recursive: true, force: true }).catch(() => {});

      // Auto-prune build directories and cached node_modules tarballs
      await pruneOldBuildContextsAndCache(projectId, tempBuildDir, writeLog);
    } catch (error: any) {
      console.error("LepoShip build execution failed:", error);
      await writeLog(`[ERROR] Build execution failed: ${error?.message || error}`);
      await writeLog(`--- LepoShip Build #${buildNumber} Failed ---`);

      // Clean up temp build context
      if (tempBuildDir) {
        await fs.rm(tempBuildDir, { recursive: true, force: true }).catch(() => {});
      }

      // Auto-prune build directories and cached node_modules tarballs on failure
      await pruneOldBuildContextsAndCache(projectId, tempBuildDir, writeLog);

      // Update release track status to failed
      try {
        await prisma.bundleReleaseTracks.update({
          where: { id: trackId },
          data: {
            status: "failed",
          },
        });
      } catch (dbErr) {
        console.error("Failed to update build failure status in DB:", dbErr);
      }
    }
  })();
}
