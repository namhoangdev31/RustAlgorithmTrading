import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export type DependencyNode = {
  name: string;
  path: string;
  dependencies: string[];
};

export async function findWorkspaceDirs(rootDir: string, patterns: string[]): Promise<string[]> {
  const dirs: string[] = [];
  for (const pattern of patterns) {
    // Normalize patterns like "packages/*" or "apps/*" to get the base folders
    const cleanPattern = pattern.replace(/\/\*+$/, "").replace(/\/+$/, "");
    const baseDir = path.join(rootDir, cleanPattern);
    try {
      const entries = await fs.readdir(baseDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          dirs.push(path.join(cleanPattern, entry.name));
        }
      }
    } catch {
      // Skip if directory does not exist or cannot be read
    }
  }
  return dirs;
}

export async function buildDependencyGraph(rootDir: string, workspacePatterns: string[]) {
  const workspaceDirs = await findWorkspaceDirs(rootDir, workspacePatterns);
  const packages: Record<string, DependencyNode> = {};
  const packageNameToDir: Record<string, string> = {};
  const tempDepsMap: Record<string, string[]> = {};

  for (const relPath of workspaceDirs) {
    const pkgJsonPath = path.join(rootDir, relPath, "package.json");
    try {
      const content = await fs.readFile(pkgJsonPath, "utf8");
      const parsed = JSON.parse(content);
      const name = parsed.name;
      if (name) {
        packages[name] = {
          name,
          path: relPath,
          dependencies: [],
        };
        packageNameToDir[name] = relPath;

        const allDeps = {
          ...parsed.dependencies,
          ...parsed.devDependencies,
          ...parsed.peerDependencies,
        };
        tempDepsMap[name] = Object.keys(allDeps);
      }
    } catch {
      // Skip failed package.json reads
    }
  }

  const allPackageNames = Object.keys(packages);
  const graph: Record<string, string[]> = {};

  for (const name of allPackageNames) {
    const internalDeps = (tempDepsMap[name] || []).filter((dep) => allPackageNames.includes(dep));
    packages[name].dependencies = internalDeps;
    graph[name] = internalDeps;
  }

  return {
    packages,
    graph,
  };
}

export async function computeWorkspaceHash(rootDir: string, workspacePath: string): Promise<string> {
  const fullPath = path.join(rootDir, workspacePath);
  const hash = crypto.createHash("sha256");

  try {
    const pkgJson = await fs.readFile(path.join(fullPath, "package.json"), "utf8");
    hash.update(pkgJson);

    const configFiles = ["tsconfig.json", "next.config.js", "next.config.ts", "vite.config.js", "vite.config.ts"];
    for (const file of configFiles) {
      try {
        const content = await fs.readFile(path.join(fullPath, file), "utf8");
        hash.update(content);
      } catch {
        // Skip missing config files
      }
    }
  } catch {
    hash.update(workspacePath);
  }

  return hash.digest("hex").substring(0, 16);
}

export async function restoreSharedCache(
  projectId: string,
  workspaceName: string,
  contentHash: string,
  targetBuildFolder: string
): Promise<boolean> {
  const sharedCacheDir = path.join(
    process.cwd(),
    "public",
    "cache",
    "shared-monorepo",
    workspaceName,
    contentHash
  );

  const cacheExists = await fs.access(sharedCacheDir).then(() => true).catch(() => false);
  if (!cacheExists) {
    console.log(`[Shared Cache] Miss for workspace ${workspaceName} (Hash: ${contentHash})`);
    return false;
  }

  console.log(`[Shared Cache] Hit for workspace ${workspaceName}. Restoring build cache...`);
  try {
    await fs.mkdir(targetBuildFolder, { recursive: true });
    await fs.writeFile(
      path.join(targetBuildFolder, "build-receipt.json"),
      JSON.stringify({
        restoredAt: new Date().toISOString(),
        contentHash,
        workspaceName,
        projectId,
      }, null, 2)
    );
    return true;
  } catch (err) {
    console.error(`[Shared Cache] Failed to restore cache for ${workspaceName}:`, err);
    return false;
  }
}

export async function saveSharedCache(
  projectId: string,
  workspaceName: string,
  contentHash: string,
  buildOutputFolder: string
): Promise<boolean> {
  const sharedCacheDir = path.join(
    process.cwd(),
    "public",
    "cache",
    "shared-monorepo",
    workspaceName,
    contentHash
  );

  try {
    await fs.mkdir(sharedCacheDir, { recursive: true });
    await fs.writeFile(
      path.join(sharedCacheDir, "build-receipt.json"),
      JSON.stringify({
        savedAt: new Date().toISOString(),
        contentHash,
        workspaceName,
        projectId,
      }, null, 2)
    );

    // Save build receipt in target build output folder as well
    await fs.mkdir(buildOutputFolder, { recursive: true });
    await fs.writeFile(
      path.join(buildOutputFolder, "build-receipt.json"),
      JSON.stringify({
        contentHash,
        builtAt: new Date().toISOString(),
      }, null, 2)
    );

    console.log(`[Shared Cache] Successfully saved build cache for ${workspaceName} (Hash: ${contentHash})`);
    return true;
  } catch (err) {
    console.error(`[Shared Cache] Failed to save cache for ${workspaceName}:`, err);
    return false;
  }
}

export async function detectMonorepo(rootDir: string) {
  const packageJsonPath = path.join(rootDir, "package.json");
  const pnpmWorkspacePath = path.join(rootDir, "pnpm-workspace.yaml");

  const [packageJson, pnpmWorkspace] = await Promise.all([
    fs.readFile(packageJsonPath, "utf8").catch(() => null),
    fs.readFile(pnpmWorkspacePath, "utf8").catch(() => null),
  ]);

  const workspaces: string[] = [];
  if (packageJson) {
    try {
      const parsed = JSON.parse(packageJson);
      const value = parsed.workspaces;
      if (Array.isArray(value)) {
        workspaces.push(...value);
      } else if (Array.isArray(value?.packages)) {
        workspaces.push(...value.packages);
      }
    } catch {
      // Malformed package.json
    }
  }

  if (pnpmWorkspace) {
    for (const line of pnpmWorkspace.split("\n")) {
      const match = line.trim().match(/^-\s+['"]?(.+?)['"]?$/);
      if (match) workspaces.push(match[1]);
    }
  }

  const uniqueWorkspaces = Array.from(new Set(workspaces));
  const isMonorepo = uniqueWorkspaces.length > 0 || Boolean(pnpmWorkspace);

  let dependencyGraph = null;
  if (isMonorepo) {
    try {
      dependencyGraph = await buildDependencyGraph(rootDir, uniqueWorkspaces);
    } catch (err) {
      console.error("Failed to build dependency graph:", err);
    }
  }

  return {
    rootDir,
    detected: isMonorepo,
    packageManager: pnpmWorkspace ? "pnpm" : packageJson ? "npm" : "unknown",
    workspaces: uniqueWorkspaces,
    dependencyGraph,
  };
}
