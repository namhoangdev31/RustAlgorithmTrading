import { redirect } from "next/navigation";

export default async function BfxpsRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/bot`);
}
