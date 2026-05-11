import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";

interface FeaturesProps {
  icon: string;
  title: string;
  description: string;
}

const featureList: FeaturesProps[] = [
  {
    icon: "LineChart",
    title: "Strategy narrative",
    description:
      "Show how research signals move from notebook-friendly workflows into production contracts.",
  },
  {
    icon: "Gauge",
    title: "Observability ready",
    description:
      "Highlight health, latency, metrics, and dashboard posture without heavy implementation detail.",
  },
  {
    icon: "Shield",
    title: "Risk-first framing",
    description:
      "Put pre-trade limits, circuit breakers, and operational controls into plain language.",
  },
  {
    icon: "PanelsTopLeft",
    title: "Reusable sections",
    description:
      "Hero, benefits, features, testimonials, pricing, contact, FAQ, and footer are easy to reorder.",
  },
  {
    icon: "Terminal",
    title: "Developer friendly",
    description:
      "Next.js App Router, TypeScript, Tailwind, and shadcn components keep the project familiar.",
  },
  {
    icon: "Sparkles",
    title: "Light polish",
    description:
      "Theme toggle, carousel, form, and local imagery make the page feel complete out of the box.",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="container py-24 sm:py-32">
      <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
        Features
      </h2>

      <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
        What makes it useful
      </h2>

      <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-8">
        Keep the template practical: strong first viewport, clear conversion
        path, and enough product detail for a technical trading audience.
      </h3>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {featureList.map(({ icon, title, description }) => (
          <div key={title}>
            <Card className="h-full bg-background border-0 shadow-none">
              <CardHeader className="flex justify-center items-center">
                <div className="bg-primary/20 p-2 rounded-full ring-8 ring-primary/10 mb-4">
                  <Icon
                    name={icon as keyof typeof icons}
                    size={24}
                    color="hsl(var(--primary))"
                    className="text-primary"
                  />
                </div>

                <CardTitle>{title}</CardTitle>
              </CardHeader>

              <CardContent className="text-muted-foreground text-center">
                {description}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
};
