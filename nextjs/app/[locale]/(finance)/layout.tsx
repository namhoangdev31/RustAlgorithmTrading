import React from "react";
import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Bfxps.metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0e1117] text-[#e6edf3]">
      {children}
    </div>
  );
}
