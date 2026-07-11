import * as React from "react";
import { requireCurrentUser } from "@/lib/server/current-user";
import { notFound } from "next/navigation";
import { getNativePlatformData } from "@/lib/server/native-platform/data";
import { requireProjectRole } from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";
import { ProjectDeliverySurface } from "@/components/portal/ProjectDeliverySurface";

type PageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function ProjectDeliveryPage({ params }: PageProps) {
  const { locale, projectId } = await params;
  const user = await requireCurrentUser();
  await requireProjectRole(user.id, projectId, "viewer");
  const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true, name: true } });

  if (!project) {
    notFound();
  }

  const nativePlatformData = await getNativePlatformData(project.id);

  return <ProjectDeliverySurface project={project} data={nativePlatformData} />;
}
