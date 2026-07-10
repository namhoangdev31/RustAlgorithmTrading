import { PageHeader } from "@/components/portal/PageHeader";
import { PersonalAccessTokens } from "@/components/portal/PersonalAccessTokens";
import { requireCurrentUser } from "@/lib/server/current-user";
import { prisma } from "@/lib/server/prisma";

export default async function TokensSettingsPage() {
  const user = await requireCurrentUser();
  const tokens = await prisma.personalAccessToken.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, scopes: true, createdAt: true, expiresAt: true, lastUsedAt: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Personal Access Tokens" description="Create scoped credentials for automation and API access." />
      <PersonalAccessTokens tokens={tokens.map((token) => ({
        ...token,
        createdAt: token.createdAt.toISOString(),
        expiresAt: token.expiresAt?.toISOString() || null,
        lastUsedAt: token.lastUsedAt?.toISOString() || null,
      }))} />
    </div>
  );
}
