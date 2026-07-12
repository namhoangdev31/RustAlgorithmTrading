import * as React from "react";
import { getTranslations } from "next-intl/server";
import { ClientTabActive } from "../../../projects/[projectId]/ClientTabActive";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; projectId: string }>;
};

export default async function SettingsSubLayout({ children, params }: Props) {
  const { projectId } = await params;
  const base = `/lepoship/${projectId}/settings`;

  return (
    <div className="space-y-6">
      {/* Sub Settings tabs */}
      <div className="border-b border-hairline w-full overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1.5 -mb-px">
          <ClientTabActive href={base}>
            Build Settings
          </ClientTabActive>
          <ClientTabActive href={`${base}/ads`}>
            Advertising Configurations
          </ClientTabActive>
          <ClientTabActive href={`${base}/sdk-tokens`}>
            SDK Credentials
          </ClientTabActive>
          <ClientTabActive href={`${base}/webhooks`}>
            Outbound Webhooks
          </ClientTabActive>

        </nav>
      </div>
      <div>{children}</div>
    </div>
  );
}
