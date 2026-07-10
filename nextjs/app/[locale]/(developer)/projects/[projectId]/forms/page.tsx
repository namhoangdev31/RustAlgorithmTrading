import * as React from "react";
import { requireCurrentUser } from "@/lib/server/current-user";
import { notFound } from "next/navigation";
import { FormBuilderClient } from "@/components/dashboard/form-builder-client";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function ProjectFormsPage({ params }: PageProps) {
  const { projectId } = await params;
  const user = await requireCurrentUser();
  await requireProjectRole(user.id, projectId, "viewer");
  const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true, name: true } });

  if (!project) {
    notFound();
  }

  const forms = await prisma.form.findMany({
    where: { projectId },
    include: {
      submissions: { orderBy: { createdAt: "desc" } },
      webhookDeliveries: { orderBy: { createdAt: "desc" }, take: 20 },
    },
    orderBy: { createdAt: "desc" },
  });
  const serializedForms = forms.map((form) => ({
    ...form,
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString(),
    submissions: form.submissions.map((submission) => ({ ...submission, createdAt: submission.createdAt.toISOString() })),
    webhookDeliveries: form.webhookDeliveries.map((delivery) => ({
      ...delivery,
      createdAt: delivery.createdAt.toISOString(),
      nextRetryAt: delivery.nextRetryAt?.toISOString() || null,
    })),
  }));

  return (
    <FormBuilderClient
      projects={[{ id: project.id, name: project.name }]}
      selectedProjectId={project.id}
      initialForms={serializedForms as any}
    />
  );
}
