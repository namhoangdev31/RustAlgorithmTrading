import { redirect } from "next/navigation";

type SettingsIndexPageProps = {
  params: Promise<{ locale: string }>;
};

/** Canonical workspace settings entry point. */
export default async function SettingsIndexPage({ params }: SettingsIndexPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/settings/profile`);
}
