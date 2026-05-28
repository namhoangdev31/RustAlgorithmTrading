"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createRiskEventAction(formData: FormData) {
  await requireCurrentUser();

  const eventType = readFormValue(formData, "eventType");
  const severity = readFormValue(formData, "severity");
  const message = readFormValue(formData, "message");

  if (!eventType || !severity || !message) {
    return;
  }

  await prisma.riskEvent.create({
    data: {
      eventType,
      severity,
      message,
      occurredAt: new Date(),
    },
  });

  revalidatePath("/dashboard");
}

export async function updateRiskEventSeverityAction(formData: FormData) {
  await requireCurrentUser();

  const id = Number(readFormValue(formData, "id"));
  const severity = readFormValue(formData, "severity");

  if (!Number.isInteger(id) || !severity) {
    return;
  }

  await prisma.riskEvent.update({
    where: { id },
    data: { severity },
  });

  revalidatePath("/dashboard");
}

export async function deleteRiskEventAction(formData: FormData) {
  await requireCurrentUser();

  const id = Number(readFormValue(formData, "id"));

  if (!Number.isInteger(id)) {
    return;
  }

  await prisma.riskEvent.delete({
    where: { id },
  });

  revalidatePath("/dashboard");
}
