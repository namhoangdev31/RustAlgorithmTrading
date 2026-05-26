"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../card";
import { Check } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

enum PopularPlan {
  NO = 0,
  YES = 1,
}

interface PlanProps {
  title: string;
  popular: PopularPlan;
  price: number;
  description: string;
  buttonText: string;
  benefitList: string[];
}

const plans: PlanProps[] = [
  {
    title: "Starter",
    popular: 0,
    price: 0,
    description:
      "Perfect for individuals and small projects getting started.",
    buttonText: "Start Free",
    benefitList: [
      "3 Mini Apps",
      "5 Websites",
      "Community support",
      "Basic analytics",
      "1 GB storage",
    ],
  },
  {
    title: "Pro",
    popular: 1,
    price: 49,
    description:
      "For growing teams that need more power and flexibility.",
    buttonText: "Get Started",
    benefitList: [
      "25 Mini Apps",
      "Unlimited websites",
      "Priority support",
      "Advanced analytics",
      "Paper trading",
    ],
  },
  {
    title: "Enterprise",
    popular: 0,
    price: 199,
    description:
      "For organizations with advanced requirements and scale.",
    buttonText: "Contact Sales",
    benefitList: [
      "Unlimited Mini Apps",
      "Unlimited websites",
      "24/7 dedicated support",
      "Live trading engine",
      "500 GB storage",
    ],
  },
];

export const PricingSection = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    // Animate Header
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    }

    // Animate Cards
    if (cardsContainerRef.current) {
      const cards = cardsContainerRef.current.querySelectorAll(".pricing-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 50, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: (i) => plans[i].popular === PopularPlan.YES && window.innerWidth >= 1024 ? 1.1 : 1,
          duration: 1,
          stagger: 0.15,
          ease: "back.out(1.1)",
          scrollTrigger: {
            trigger: cardsContainerRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    }
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, isPopular: boolean) => {
    const card = e.currentTarget;
    const targetScale = isPopular && window.innerWidth >= 1024 ? 1.13 : 1.03;

    gsap.to(card, {
      scale: targetScale,
      borderColor: isPopular ? "rgba(210,71,191,0.8)" : "rgba(0,229,255,0.5)",
      boxShadow: isPopular
        ? "0 20px 40px -15px rgba(210,71,191,0.3)"
        : "0 15px 30px -15px rgba(0,229,255,0.15)",
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>, isPopular: boolean) => {
    const card = e.currentTarget;
    const targetScale = isPopular && window.innerWidth >= 1024 ? 1.1 : 1;

    gsap.to(card, {
      scale: targetScale,
      borderColor: isPopular ? "" : "",
      boxShadow: "",
      duration: 0.4,
      ease: "power2.out",
    });
  };

  return (
    <section id="pricing" className="container py-24 sm:py-32 overflow-hidden">
      <div ref={headerRef} className="text-center mb-12">
        <h2 className="text-lg text-primary mb-2 tracking-wider">
          Pricing
        </h2>

        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Simple, Transparent Pricing
        </h2>

        <h3 className="md:w-1/2 mx-auto text-xl text-muted-foreground">
          Start free and scale as you grow. No hidden fees.
        </h3>
      </div>

      <div
        ref={cardsContainerRef}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-4 pt-4"
      >
        {plans.map(
          ({ title, popular, price, description, buttonText, benefitList }) => {
            const isPopular = popular === PopularPlan.YES;
            return (
              <div
                key={title}
                onMouseEnter={(e) => handleMouseEnter(e, isPopular)}
                onMouseLeave={(e) => handleMouseLeave(e, isPopular)}
                className={`pricing-card transition-all duration-300 rounded-lg ${isPopular
                    ? "lg:scale-[1.1] z-10"
                    : ""
                  }`}
              >
                <Card
                  className={`h-full border transition-colors duration-300 bg-background ${isPopular
                      ? "drop-shadow-xl shadow-primary/5 border-primary"
                      : "border-secondary/50 dark:border-secondary/20"
                    }`}
                >
                  <CardHeader>
                    <CardTitle className="pb-2">{title}</CardTitle>

                    <CardDescription className="pb-4">
                      {description}
                    </CardDescription>

                    <div>
                      <span className="text-3xl font-bold">${price}</span>
                      <span className="text-muted-foreground"> /month</span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex">
                    <div className="space-y-4">
                      {benefitList.map((benefit) => (
                        <span key={benefit} className="flex items-center">
                          <Check className="text-primary mr-2 size-4" />
                          <h3 className="text-sm">{benefit}</h3>
                        </span>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      variant={isPopular ? "default" : "secondary"}
                      className={`w-full font-bold ${isPopular
                          ? "shadow-[0_0_15px_rgba(210,71,191,0.25)] hover:shadow-[0_0_20px_rgba(210,71,191,0.4)]"
                          : ""
                        }`}
                    >
                      {buttonText}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            );
          }
        )}
      </div>
    </section>
  );
};