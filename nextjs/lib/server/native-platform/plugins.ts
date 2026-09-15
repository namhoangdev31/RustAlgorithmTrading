import { prisma } from "@/lib/server/prisma";

export async function listNativePlugins(projectId?: string) {
  const plugins = await prisma.nativePlugin.findMany({
    orderBy: { createdAt: "desc" },
    include: projectId
      ? {
          installations: {
            where: { projectId },
          },
        }
      : undefined,
  });

  return plugins.map((plugin) => {
    const installations = (plugin as any).installations;
    return {
      ...plugin,
      installed: projectId ? (installations ? installations.length > 0 : false) : false,
    };
  });
}

export async function upsertNativePlugin(input: {
  slug: string;
  name: string;
  version: string;
  bundleUrl: string;
  permissions?: string[];
  description?: string;
}) {
  return prisma.nativePlugin.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      name: input.name,
      version: input.version,
      bundleUrl: input.bundleUrl,
      permissions: input.permissions || [],
      description: input.description || null,
    },
    update: {
      name: input.name,
      version: input.version,
      bundleUrl: input.bundleUrl,
      permissions: input.permissions || [],
      description: input.description || null,
      updatedAt: new Date(),
    },
  });
}

export async function installNativePlugin(projectId: string, pluginId: string, config?: unknown) {
  return prisma.nativePluginInstallation.upsert({
    where: {
      projectId_pluginId: {
        projectId,
        pluginId,
      },
    },
    create: {
      projectId,
      pluginId,
      config: (config || null) as any,
    },
    update: {
      enabled: true,
      config: (config || null) as any,
    },
  });
}

export async function uninstallNativePlugin(projectId: string, pluginId: string) {
  return prisma.nativePluginInstallation.delete({
    where: {
      projectId_pluginId: {
        projectId,
        pluginId,
      },
    },
  });
}

export async function toggleNativePlugin(projectId: string, pluginId: string, enabled: boolean) {
  return prisma.nativePluginInstallation.update({
    where: {
      projectId_pluginId: {
        projectId,
        pluginId,
      },
    },
    data: {
      enabled,
    },
  });
}

export async function searchMarketplace(query?: string, platform?: string, limit = 20, offset = 0) {
  const where: any = {};
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { slug: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  const [plugins, total] = await Promise.all([
    prisma.nativePlugin.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        _count: { select: { installations: true } },
      },
    }),
    prisma.nativePlugin.count({ where }),
  ]);

  return {
    plugins: plugins.map((p) => ({
      ...p,
      installCount: (p as any)._count?.installations || 0,
    })),
    total,
    limit,
    offset,
  };
}

export async function publishPlugin(input: {
  slug: string;
  name: string;
  version: string;
  bundleUrl: string;
  description?: string;
  permissions?: string[];
  metadata?: Record<string, unknown>;
}) {
  const isValid = await validateBundleUrl(input.bundleUrl);
  if (!isValid) {
    throw new Error(`Bundle URL is not accessible: ${input.bundleUrl}`);
  }

  return prisma.nativePlugin.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      name: input.name,
      version: input.version,
      bundleUrl: input.bundleUrl,
      description: input.description || null,
      permissions: input.permissions || [],
      metadata: {
        ...(input.metadata || {}),
        publishedAt: new Date().toISOString(),
        versionHistory: [{ version: input.version, date: new Date().toISOString() }],
      },
    },
    update: {
      name: input.name,
      version: input.version,
      bundleUrl: input.bundleUrl,
      description: input.description || null,
      permissions: input.permissions || [],
      metadata: {
        ...(input.metadata || {}),
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    },
  });
}

async function validateBundleUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getPluginVersionHistory(pluginId: string) {
  const plugin = await prisma.nativePlugin.findUnique({ where: { id: pluginId } });
  if (!plugin) return null;
  const meta = plugin.metadata as any;
  return {
    pluginId: plugin.id,
    slug: plugin.slug,
    currentVersion: plugin.version,
    history: meta?.versionHistory || [{ version: plugin.version, date: plugin.createdAt.toISOString() }],
  };
}

export async function generatePluginBridge(pluginId: string) {
  const plugin = await prisma.nativePlugin.findUnique({ where: { id: pluginId } });
  if (!plugin) throw new Error(`Plugin not found: ${pluginId}`);

  const permissions = plugin.permissions || [];
  const bridgeCode = `
// Auto-generated LepoShip Plugin Bridge for "${plugin.name}" v${plugin.version}
// Slug: ${plugin.slug}
(function(global) {
  'use strict';
  
  const PLUGIN_ID = '${plugin.id}';
  const PLUGIN_SLUG = '${plugin.slug}';
  const PLUGIN_VERSION = '${plugin.version}';
  const BUNDLE_URL = '${plugin.bundleUrl}';
  const PERMISSIONS = ${JSON.stringify(permissions)};
  
  class LepoShipPlugin {
    constructor() {
      this.id = PLUGIN_ID;
      this.slug = PLUGIN_SLUG;
      this.version = PLUGIN_VERSION;
      this._loaded = false;
    }
    
    async load() {
      if (this._loaded) return;
      console.log('[LepoShip Plugin Bridge] Loading ' + PLUGIN_SLUG + '...');
      // Execute plugin bundle initialization logic
      this._loaded = true;
    }
  }
  
  global.LepoShip = global.LepoShip || {};
  global.LepoShip.plugins = global.LepoShip.plugins || {};
  global.LepoShip.plugins[PLUGIN_SLUG] = new LepoShipPlugin();
})(typeof window !== 'undefined' ? window : this);
`;
  return bridgeCode;
}

