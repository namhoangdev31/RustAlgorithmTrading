"use server";

import { prisma } from "@/lib/server/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { revalidatePath } from "next/cache";

export async function getFormsAction(projectId: string) {
  const user = await requireCurrentUser();
  await requireProjectRole(user.id, projectId, "viewer");

  const forms = await prisma.form.findMany({
    where: { projectId },
    include: {
      submissions: {
        orderBy: { createdAt: "desc" },
      },
      webhookDeliveries: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    forms: forms.map((f) => ({
      id: f.id,
      name: f.name,
      projectId: f.projectId,
      googleSheetsSync: f.googleSheetsSync,
      salesforceSync: f.salesforceSync,
      webhookUrl: f.webhookUrl,
      webhookSecret: f.webhookSecret,
      createdAt: f.createdAt.toISOString(),
      submissions: f.submissions.map((sub) => ({
        id: sub.id,
        data: sub.data,
        ipAddress: sub.ipAddress,
        userAgent: sub.userAgent,
        createdAt: sub.createdAt.toISOString(),
      })),
      webhookDeliveries: f.webhookDeliveries.map((delivery) => ({
        id: delivery.id,
        url: delivery.url,
        status: delivery.status,
        attempts: delivery.attempts,
        lastError: delivery.lastError,
        nextRetryAt: delivery.nextRetryAt?.toISOString() || null,
        createdAt: delivery.createdAt.toISOString(),
      })),
    })),
  };
}

export async function createFormAction(projectId: string, name: string) {
  const user = await requireCurrentUser();
  await requireProjectRole(user.id, projectId, "editor");

  const form = await prisma.form.create({
    data: {
      projectId,
      name,
    },
  });

  revalidatePath("/dashboard/forms");
  return {
    success: true,
    form: {
      id: form.id,
      name: form.name,
      projectId: form.projectId,
      createdAt: form.createdAt.toISOString(),
    },
  };
}

export async function updateFormSettingsAction(
  formId: string,
  data: {
    name?: string;
    googleSheetsSync?: boolean;
    salesforceSync?: boolean;
    webhookUrl?: string | null;
    webhookSecret?: string | null;
  }
) {
  const user = await requireCurrentUser();

  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form) {
    throw new Error("Form not found");
  }

  await requireProjectRole(user.id, form.projectId, "editor");

  const updatedForm = await prisma.form.update({
    where: { id: formId },
    data: {
      name: data.name ?? undefined,
      googleSheetsSync: data.googleSheetsSync ?? undefined,
      salesforceSync: data.salesforceSync ?? undefined,
      webhookUrl: data.webhookUrl,
      webhookSecret: data.webhookSecret,
    },
  });

  revalidatePath("/dashboard/forms");
  return {
    success: true,
    form: {
      id: updatedForm.id,
      name: updatedForm.name,
      projectId: updatedForm.projectId,
      googleSheetsSync: updatedForm.googleSheetsSync,
      salesforceSync: updatedForm.salesforceSync,
      webhookUrl: updatedForm.webhookUrl,
      webhookSecret: updatedForm.webhookSecret,
    },
  };
}

export async function deleteFormAction(formId: string) {
  const user = await requireCurrentUser();

  const form = await prisma.form.findUnique({
    where: { id: formId },
  });

  if (!form) {
    throw new Error("Form not found");
  }

  await requireProjectRole(user.id, form.projectId, "editor");

  await prisma.form.delete({
    where: { id: formId },
  });

  revalidatePath("/dashboard/forms");
  return { success: true };
}
