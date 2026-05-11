import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";

enum PopularPlan {
  NO = 0,
  YES = 1,
}

interface PlanProps {
  title: string;
  popular: PopularPlan;
  price: string;
  description: string;
  buttonText: string;
  benefitList: string[];
}

const plans: PlanProps[] = [
  {
    title: "Explore",
    popular: 0,
    price: "Free",
    description:
      "Best for reviewing the design and adapting the copy to your team.",
    buttonText: "Preview template",
    benefitList: [
      "Next.js App Router",
      "Shadcn components",
      "Light and dark themes",
      "Local hero imagery",
    ],
  },
  {
    title: "Paper trading",
    popular: 1,
    price: "Ops",
    description:
      "Shape the page around staging, paper validation, and runbook links.",
    buttonText: "Use this path",
    benefitList: [
      "Risk-first messaging",
      "Observability sections",
      "Contact capture",
      "FAQ for maintainers",
    ],
  },
  {
    title: "Production",
    popular: 0,
    price: "LTS",
    description:
      "Keep the landing page aligned with the production-ready migration story.",
    buttonText: "Plan rollout",
    benefitList: [
      "Tri-runtime positioning",
      "GitHub handoff CTA",
      "Reusable copy blocks",
      "Production status framing",
    ],
  },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="container py-24 sm:py-32">
      <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
        Plans
      </h2>

      <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
        Pick a landing page path
      </h2>

      <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground pb-14">
        Use the same layout for a quick demo, a paper-trading launch, or a
        production-readiness handoff.
      </h3>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-4">
        {plans.map(
          ({ title, popular, price, description, buttonText, benefitList }) => (
            <Card
              key={title}
              className={
                popular === PopularPlan?.YES
                  ? "drop-shadow-xl shadow-black/10 dark:shadow-white/10 border-[1.5px] border-primary lg:scale-[1.1]"
                  : ""
              }
            >
              <CardHeader>
                <CardTitle className="pb-2">{title}</CardTitle>

                <CardDescription className="pb-4">
                  {description}
                </CardDescription>

                <div>
                  <span className="text-3xl font-bold">{price}</span>
                  <span className="text-muted-foreground"> mode</span>
                </div>
              </CardHeader>

              <CardContent className="flex">
                <div className="flex flex-col gap-4">
                  {benefitList.map((benefit) => (
                    <span key={benefit} className="flex gap-2">
                      <Check className="text-primary mr-2" />
                      <h3>{benefit}</h3>
                    </span>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  variant={
                    popular === PopularPlan?.YES ? "default" : "secondary"
                  }
                  className="w-full"
                >
                  {buttonText}
                </Button>
              </CardFooter>
            </Card>
          )
        )}
      </div>
    </section>
  );
};
