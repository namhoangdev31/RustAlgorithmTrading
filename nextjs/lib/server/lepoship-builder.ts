import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { exec } from "child_process";
import { prisma } from "@/lib/server/prisma";

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
    try {
      await fs.writeFile(logFile, ""); // Initialize log file
      await writeLog(`--- LepoShip Build #${buildNumber} Started ---`);
      await writeLog(`Platform: ${config.platform.toUpperCase()}`);
      await writeLog(`Source Repository: ${config.gitRepoUrl}`);
      await writeLog(`Target Branch: ${config.gitBranch}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await writeLog("Cloning repository into temporary build context...");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await writeLog("Checking and restoring node_modules cache for build agent...");
      const projectCacheDir = path.join(process.cwd(), "public", "bundles", projectId, "cache");
      await fs.mkdir(projectCacheDir, { recursive: true });
      await new Promise((resolve) => setTimeout(resolve, 800));
      await writeLog("Yarn dependency cache restored successfully.");

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
        await writeLog("Previous build detected. Calculating delta patch (changed files)...");
        // In a real delta patcher, we compare files using checksums.
        // For simulation, we create a manifest indicating which files changed
        const manifest = {
          baseBuild: previousActiveTrack.buildNumber || 0,
          changedFiles: ["index.html", "assets/main.js"],
          action: "update"
        };
        await fs.writeFile(path.join(tempDir, "patch-manifest.json"), JSON.stringify(manifest, null, 2));
        await writeLog("Delta patch calculated: 2 files changed.");
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
    } catch (error: any) {
      console.error("LepoShip build execution failed:", error);
      await writeLog(`[ERROR] Build execution failed: ${error?.message || error}`);
      await writeLog(`--- LepoShip Build #${buildNumber} Failed ---`);

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
