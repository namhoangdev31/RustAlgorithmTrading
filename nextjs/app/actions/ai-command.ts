"use server";

import { prisma } from "@/lib/server/prisma";
import { createFirewallRuleAction } from "@/app/actions/firewall";
import { getAuthorizedVercelClient, syncCentralEdgeConfig } from "@/lib/server/vercel";
import { getProjectProvidersAction } from "@/app/actions/vercel";
import { enqueueBuild } from "@/lib/server/build-queue";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getWorkspaceContext } from "@/lib/server/workspace";
import crypto from "crypto";

export interface AiCommandResult {
  type: "block_ip" | "view_logs" | "toggle_flag" | "trigger_build" | "navigate" | "unknown";
  ip?: string;
  target?: string;
  flagName?: string;
  value?: boolean;
  path?: string;
  message?: string;
}

async function callGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini API call failed:", err);
    return null;
  }
}

export async function executeAiCommandAction(
  query: string,
  projectId?: string
): Promise<AiCommandResult> {
  console.log(`[AiCommand] Parsing query: "${query}" for project: ${projectId || "Global"}`);

  // 1. Fallback regex matcher (useful for local offline testing/development)
  const cleanQuery = query.toLowerCase().trim();
  let parsedResult: {
    type: "block_ip" | "view_logs" | "toggle_flag" | "trigger_build" | "navigate" | "unknown";
    ip?: string;
    target?: string;
    flagName?: string;
    value?: boolean;
    projectName?: string;
    path?: string;
    message?: string;
  } | null = null;

  if (cleanQuery.includes("chặn ip") || cleanQuery.includes("block ip")) {
    const ipMatch = query.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    if (ipMatch) {
      parsedResult = { type: "block_ip", ip: ipMatch[1] };
    }
  }

  if (!parsedResult && (cleanQuery.includes("xem logs") || cleanQuery.includes("view logs") || cleanQuery.includes("show logs"))) {
    parsedResult = { type: "view_logs", target: "logs" };
  }

  if (!parsedResult && (cleanQuery.includes("cài đặt security") || cleanQuery.includes("waf") || cleanQuery.includes("firewall") || cleanQuery.includes("bảo mật"))) {
    parsedResult = { type: "navigate", path: "/dashboard/settings/security" };
  }

  if (!parsedResult && (cleanQuery.includes("lepoship") || cleanQuery.includes("mobile builder") || cleanQuery.includes("webview"))) {
    parsedResult = { type: "navigate", path: "/lepoship" };
  }

  if (!parsedResult && (cleanQuery.includes("cờ") || cleanQuery.includes("flag") || cleanQuery.includes("tính năng"))) {
    const toggleMatch = query.match(/(bật|tắt|enable|disable|turn on|turn off)\s+(?:cờ|flag|feature flag|tính năng)?\s*([a-zA-Z0-9_-]+)/i);
    if (toggleMatch) {
      const isEnable = ["bật", "enable", "turn on"].includes(toggleMatch[1].toLowerCase());
      parsedResult = {
        type: "toggle_flag",
        flagName: toggleMatch[2],
        value: isEnable
      };
    }
  }

  if (!parsedResult && (cleanQuery.includes("deployment") || cleanQuery.includes("deploy") || cleanQuery.includes("build"))) {
    const buildMatch = query.match(/(?:tạo deployment|trigger build|deploy mới|deploy|build)\s*(?:mới|cho)?\s*(?:dự án)?\s*([a-zA-Z0-9_-]+)/i);
    if (buildMatch && buildMatch[1]) {
      parsedResult = {
        type: "trigger_build",
        projectName: buildMatch[1]
      };
    } else {
      parsedResult = {
        type: "trigger_build"
      };
    }
  }

  // 2. Call Gemini for NLP parsing if API Key is available
  if (!parsedResult) {
    const prompt = `
You are an AI DevOps assistant inside the LepoS Platform Dashboard.
Your job is to parse a natural language command into a structured JSON action.

Supported commands:
1. block_ip: block a specific IP address.
   Example query: "chặn IP 1.2.3.4" or "block IP 1.2.3.4"
   Result: { "type": "block_ip", "ip": "1.2.3.4" }
2. view_logs: view logs for a project/function.
   Example query: "xem logs" or "show logs for api"
   Result: { "type": "view_logs", "target": "logs" }
3. toggle_flag: toggle a feature flag.
   Example query: "bật feature flag beta" or "turn off beta_flag"
   Result: { "type": "toggle_flag", "flagName": "beta", "value": true }
4. trigger_build: trigger a new deployment or build for a project.
   Example query: "tạo deployment mới cho dự án X" or "deploy project Y"
   Result: { "type": "trigger_build", "projectName": "X" }
5. navigate: go to a specific page on dashboard.
   Example query: "go to security settings" or "cấu hình firewall"
   Result: { "type": "navigate", "path": "/dashboard/settings/security" }
   
Respond ONLY with a valid JSON object matching one of the structures above. Do not include markdown code block formatting (e.g. \`\`\`json). If no command matches, return { "type": "unknown", "message": "Command not understood." }

User query: "${query}"
`;

    const geminiResponse = await callGemini(prompt);
    if (geminiResponse) {
      try {
        const parsed = JSON.parse(geminiResponse.trim());
        if (parsed && parsed.type) {
          parsedResult = parsed;
        }
      } catch (parseErr) {
        console.warn("Failed to parse Gemini response as JSON, fallback to regex:", parseErr);
      }
    }
  }

  if (!parsedResult || parsedResult.type === "unknown") {
    return {
      type: "unknown",
      message: parsedResult?.message || `Không nhận diện được lệnh: "${query}". Vui lòng thử lại với cú pháp như "chặn IP 1.2.3.4", "bật cờ beta", hoặc "tạo deployment".`
    };
  }

  // 3. Execute actions on the server
  try {
    const user = await requireCurrentUser();
    
    // Resolve organization ids
    const workspace = await getWorkspaceContext(user.id);
    const organizationIds = workspace.organizations.map((org) => org.id);
    
    // Fetch user owned projects
    const userProjects = await prisma.project.findMany({
      where: {
        organizationId: { in: organizationIds },
        deletedAt: null,
      },
      include: {
        bundle: true,
      },
    });
    
    if (userProjects.length === 0) {
      return {
        type: "unknown",
        message: "Không tìm thấy dự án nào trong workspace của bạn để thực thi hành động."
      };
    }
    
    // Pick target project
    let project = userProjects[0];
    if (projectId) {
      const match = userProjects.find((p) => p.id === projectId);
      if (match) project = match;
    } else if (parsedResult.projectName) {
      const match = userProjects.find(
        (p) => p.name.toLowerCase() === parsedResult.projectName?.toLowerCase()
      );
      if (match) project = match;
    } else {
      // Look for a project name inside the query text
      const match = userProjects.find((p) =>
        cleanQuery.includes(p.name.toLowerCase())
      );
      if (match) project = match;
    }
    
    if (parsedResult.type === "block_ip") {
      const ip = parsedResult.ip;
      if (!ip) {
        return { type: "unknown", message: "Địa chỉ IP không hợp lệ hoặc thiếu." };
      }
      
      await createFirewallRuleAction(
        project.id,
        `Block IP ${ip} (AI Command)`,
        "block",
        "ip",
        ip
      );
      
      return {
        type: "block_ip",
        ip,
        message: `Đã chặn thành công IP ${ip} tại WAF cho dự án "${project.name}".`
      };
    }
    
    if (parsedResult.type === "toggle_flag") {
      const flagName = parsedResult.flagName;
      const value = parsedResult.value ?? true;
      if (!flagName) {
        return { type: "unknown", message: "Thiếu tên cờ tính năng cần bật/tắt." };
      }
      
      if (!project.vercelProjectId) {
        return {
          type: "unknown",
          message: `Dự án "${project.name}" chưa được liên kết với Vercel.`
        };
      }
      
      const { vercel } = await getAuthorizedVercelClient(user.id, project.vercelProjectId, "editor");
      
      // Get envs to locate EDGE_CONFIG
      const envVarsRes = await vercel.projects.filterProjectEnvs({ idOrName: project.vercelProjectId });
      const envs = (envVarsRes as any).envs || [];
      const edgeConfigEnv = envs.find((v: any) => v.key === "EDGE_CONFIG");
      
      let edgeConfigId: string | undefined = undefined;
      if (edgeConfigEnv && edgeConfigEnv.value) {
        const match = edgeConfigEnv.value.match(/\/ecfg_([a-zA-Z0-9]+)/);
        if (match) {
          edgeConfigId = `ecfg_${match[1]}`;
        }
      }
      
      if (!edgeConfigId) {
        const stores = await vercel.edgeConfig.getEdgeConfigs({});
        if (stores && stores.length > 0) {
          edgeConfigId = stores[0].id;
        }
      }
      
      if (!edgeConfigId) {
        return {
          type: "unknown",
          message: `Không tìm thấy Edge Config liên kết cho dự án "${project.name}".`
        };
      }
      
      const items = [
        {
          operation: "upsert" as const,
          key: flagName,
          value
        }
      ];
      
      await vercel.edgeConfig.patchEdgeConfigItems({
        edgeConfigId,
        requestBody: { items }
      });
      
      // Replicate changes to all linked multi-providers (Vercel & Cloudflare KV) in parallel
      const projectProvidersRes = await getProjectProvidersAction(project.id);
      let syncedProvidersCount = 0;
      if (projectProvidersRes.success && projectProvidersRes.providers && projectProvidersRes.providers.length > 0) {
        const syncSuccess = await syncCentralEdgeConfig(user.id, projectProvidersRes.providers, items);
        if (syncSuccess) {
          syncedProvidersCount = projectProvidersRes.providers.length;
        }
      }
      
      return {
        type: "toggle_flag",
        flagName,
        value,
        message: `Đã ${value ? "bật" : "tắt"} cờ "${flagName}" thành công trên Edge Config${syncedProvidersCount > 0 ? ` và đồng bộ tới ${syncedProvidersCount} nhà cung cấp phụ` : ""} cho dự án "${project.name}".`
      };
    }
    
    if (parsedResult.type === "trigger_build") {
      if (!project.bundle) {
        return {
          type: "unknown",
          message: `Dự án "${project.name}" không có cấu hình đóng gói LepoShip Mobile.`
        };
      }
      
      const currentBundle = project.bundle;
      const newBuildNumber = currentBundle.buildNumber + 1;
      
      let newVersion = "1.0.0";
      const parts = currentBundle.version.split(".");
      if (parts.length === 3) {
        const patch = parseInt(parts[2], 10);
        if (!isNaN(patch)) {
          parts[2] = String(patch + 1);
          newVersion = parts.join(".");
        }
      } else {
        newVersion = currentBundle.version;
      }
      
      const integration = await prisma.bundleExternalIntegrations.findFirst({
        where: {
          bundleId: currentBundle.id,
          integrationType: "lepoship",
          isActive: true,
        },
        select: { config: true },
      });
      
      let configData = { platform: "expo", gitRepoUrl: "", gitBranch: "main" };
      if (integration?.config) {
        try {
          configData = JSON.parse(integration.config);
        } catch (_) {}
      }
      
      const trackId = crypto.randomUUID();
      const now = new Date();
      
      await prisma.$transaction(async (tx) => {
        await tx.bundles.update({
          where: { id: currentBundle.id },
          data: {
            buildNumber: newBuildNumber,
            updatedAt: now,
          },
        });
        await tx.bundleReleaseTracks.create({
          data: {
            id: trackId,
            bundleId: currentBundle.id,
            track: "production",
            version: newVersion,
            buildNumber: newBuildNumber,
            storagePath: "",
            releaseNotes: `Automated build #${newBuildNumber} triggered via AI Command Palette by ${user.fullName || user.email}`,
            status: "building",
            createdAt: now,
          },
        });
      });
      
      await enqueueBuild({
        projectId: project.id,
        bundleId: currentBundle.id,
        buildNumber: newBuildNumber,
        version: newVersion,
        config: configData,
        trackId
      });
      
      return {
        type: "trigger_build",
        message: `Đã kích hoạt bản build #${newBuildNumber} (phiên bản ${newVersion}) thành công cho dự án "${project.name}".`
      };
    }
    
    if (parsedResult.type === "navigate") {
      return {
        type: "navigate",
        path: parsedResult.path || "/dashboard"
      };
    }
    
    if (parsedResult.type === "view_logs") {
      return {
        type: "view_logs",
        target: "logs",
        message: `Đang chuyển hướng sang trang giám sát logs cho dự án "${project.name}".`
      };
    }
    
  } catch (err: any) {
    console.error("[AiCommand] Execution error:", err);
    return {
      type: "unknown",
      message: `Lỗi khi thực thi lệnh: ${err.message || err}`
    };
  }

  return {
    type: "unknown",
    message: `Không thể thực thi lệnh: "${query}".`
  };
}
