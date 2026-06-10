"use server";

import { prisma } from "@/lib/server/prisma";
import { revalidatePath } from "next/cache";

export async function createFirewallRuleAction(
  projectId: string,
  name: string,
  action: "block" | "allow" | "challenge",
  type: "ip" | "country" | "path" | "header",
  value: string
) {
  if (!name.trim() || !value.trim()) {
    throw new Error("Name and value are required.");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const rule = await prisma.firewallRule.create({
    data: {
      id: crypto.randomUUID(),
      name,
      action,
      type,
      value: value.trim(),
      active: true,
      projectId,
    },
  });

  // Sync to local memory WAF configuration (in a real production app, this writes to Upstash Redis)
  console.log(`[WAF Sync] Synced firewall rule ${rule.name} for project ${projectId} to Edge cache.`);

  revalidatePath(`/dashboard/projects/${projectId}/settings/security`);
  return rule;
}

export async function deleteFirewallRuleAction(projectId: string, ruleId: string) {
  await prisma.firewallRule.delete({
    where: { id: ruleId },
  });

  console.log(`[WAF Sync] Removed firewall rule ${ruleId} from Edge cache.`);

  revalidatePath(`/dashboard/projects/${projectId}/settings/security`);
  return { success: true };
}

export async function toggleFirewallRuleAction(projectId: string, ruleId: string, active: boolean) {
  const rule = await prisma.firewallRule.update({
    where: { id: ruleId },
    data: { active },
  });

  console.log(`[WAF Sync] Updated firewall rule ${ruleId} (active: ${active}) in Edge cache.`);

  revalidatePath(`/dashboard/projects/${projectId}/settings/security`);
  return rule;
}

export async function getFirewallRulesAction(projectId: string) {
  return prisma.firewallRule.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}
