"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { BundlesSubTab } from "./deployments/BundlesSubTab";
import { NativeSubTab } from "./deployments/NativeSubTab";
import { VercelDeploymentsTab } from "./deployments/VercelDeploymentsTab";
import { DeploymentsTabSwitcher } from "./deployments/DeploymentsTabSwitcher";

interface DeploymentsTabProps {
  vercelConnected: boolean;
  vercelDeployments: any[];
  vercelConnectionError?: boolean;
  locale: string;
  projects?: any[];
  returnTo?: string;
  searchParams?: any;
  project?: any;
  nativeDeployments?: any[];
}

export function DeploymentsTab({
  vercelConnected,
  vercelDeployments,
  vercelConnectionError,
  locale,
  projects = [],
  returnTo,
  searchParams,
  project,
  nativeDeployments = [],
}: DeploymentsTabProps) {
  const t = useTranslations("Deployments");
  const [isPending, startTransition] = useTransition();
  const [activeSubTab, setActiveSubTab] = useState<"bundles" | "native" | "vercel">("bundles");
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects.length > 0 ? projects[0].id : ""
  );

  return (
    <div className="space-y-6">
      {/* Subsystem Switcher Tabs */}
      <DeploymentsTabSwitcher activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />

      <div className="animate-in fade-in duration-200">
        {activeSubTab === "bundles" && (
          <BundlesSubTab
            projects={projects}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            locale={locale}
            isPending={isPending}
            startTransition={startTransition}
          />
        )}

        {activeSubTab === "native" && (
          <NativeSubTab
            nativeDeployments={nativeDeployments}
            project={project}
            selectedProjectId={selectedProjectId}
            locale={locale}
            isPending={isPending}
            startTransition={startTransition}
          />
        )}

        {activeSubTab === "vercel" && (
          <VercelDeploymentsTab
            vercelConnected={vercelConnected}
            vercelDeployments={vercelDeployments}
            vercelConnectionError={vercelConnectionError}
            locale={locale}
            projects={projects}
            selectedProjectId={selectedProjectId}
            returnTo={returnTo}
            searchParams={searchParams}
            project={project}
            isPending={isPending}
            startTransition={startTransition}
          />
        )}
      </div>
    </div>
  );
}
