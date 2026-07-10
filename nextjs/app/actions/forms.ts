"use server";

import { prisma } from "@/lib/server/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
import { requireProjectRole } from "@/lib/server/permissions";
import { revalidatePath } from "next/cache";

export async function createFormAction(projectId: string, name: string) {
  const user = await requireCurrentUser();
  await requireProjectRole(user.id, projectId, "editor");

  const form = await prisma.form.create({
    data: {
      projectId,
      name,
    },
  });

  revalidatePath(`/projects/${projectId}/forms`);
  return {
    success: true,
    form: {
      id: form.id,
      name: form.name,
      projectId: form.projectId,
      definition: form.definition,
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
    definition?: unknown;
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
      definition: data.definition === undefined ? undefined : (data.definition as any),
    },
  });

  revalidatePath(`/projects/${form.projectId}/forms`);
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
      definition: updatedForm.definition,
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

  revalidatePath(`/projects/${form.projectId}/forms`);
  return { success: true };
}
