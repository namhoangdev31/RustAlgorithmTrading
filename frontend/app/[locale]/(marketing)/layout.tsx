import { Navbar } from "@/components/layout/navbar";
import { AnimationProvider } from "@/components/layout/animation-provider";
import { TransitionProvider } from "@/components/layout/transition-provider";
import { InteractiveBackground } from "@/components/layout/interactive-background";
import { getCurrentUser } from "@/lib/server/current-user";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const serializedUser = user
    ? {
        email: user.email ?? null,
        fullName: user.fullName ?? null,
        provider: user.provider,
      }
    : null;

  return (
    <AnimationProvider>
      <TransitionProvider>
        <Navbar user={serializedUser} />
        <InteractiveBackground />
        <div className="relative z-10">{children}</div>
      </TransitionProvider>
    </AnimationProvider>
  );
}


