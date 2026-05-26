import { Navbar } from "@/components/layout/navbar";
import { AnimationProvider } from "@/components/layout/animation-provider";
import { TransitionProvider } from "@/components/layout/transition-provider";
import { InteractiveBackground } from "@/components/layout/interactive-background";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnimationProvider>
      <TransitionProvider>
        <Navbar />
        <InteractiveBackground />
        <div className="relative z-10">{children}</div>
      </TransitionProvider>
    </AnimationProvider>
  );
}

