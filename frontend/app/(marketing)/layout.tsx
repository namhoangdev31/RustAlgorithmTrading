import { Navbar } from "@/components/layout/navbar";
import { AnimationProvider } from "@/components/layout/animation-provider";
import { TransitionProvider } from "@/components/layout/transition-provider";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnimationProvider>
      <TransitionProvider>
        <Navbar />
        {children}
      </TransitionProvider>
    </AnimationProvider>
  );
}

