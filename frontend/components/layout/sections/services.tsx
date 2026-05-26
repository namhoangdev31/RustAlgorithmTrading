"use client";

import React, { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "../card";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

enum ProService {
  YES = 1,
  NO = 0,
}
interface ServiceProps {
  title: string;
  pro: ProService;
  description: string;
}
const serviceList: ServiceProps[] = [
  {
    title: "Mini App Distribution",
    description:
      "Publish and manage custom mini apps and micro-frontends through our integrated marketplace.",
    pro: 0,
  },
  {
    title: "Website Hosting & CI/CD",
    description:
      "Automatic deployments from Git with preview URLs, rollback, and custom domains.",
    pro: 0,
  },
  {
    title: "Trading Strategy Builder",
    description:
      "Visual strategy editor with backtesting, paper trading, and live execution.",
    pro: 0,
  },
  {
    title: "Advanced Analytics & AI Insights",
    description: "AI-powered analytics across all platform products with real-time alerts.",
    pro: 1,
  },
];

export const ServicesSection = () => {
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
      const cards = cardsContainerRef.current.querySelectorAll(".service-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: cardsContainerRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1.03,
      borderColor: "rgba(62, 207, 142, 0.4)",
      boxShadow: "0 10px 25px -10px rgba(62, 207, 142, 0.15)",
      backgroundColor: "rgba(62, 207, 142, 0.01)",
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      borderColor: "",
      boxShadow: "",
      backgroundColor: "",
      duration: 0.4,
      ease: "power2.out",
    });
  };

  return (
    <section id="services" className="container py-24 sm:py-32 overflow-hidden">
      <div ref={headerRef} className="text-center mb-12">
        <h2 className="text-lg text-primary mb-2 tracking-wider">
          Services
        </h2>

        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Platform Capabilities
        </h2>
        <h3 className="md:w-1/2 mx-auto text-xl text-muted-foreground">
          From app distribution to financial trading, explore the full range
          of platform services.
        </h3>
      </div>

      <div 
        ref={cardsContainerRef} 
        className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4 w-full lg:w-[60%] mx-auto"
      >
        {serviceList.map(({ title, description, pro }) => (
          <Card
            key={title}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="service-card bg-muted/60 dark:bg-card h-full relative border border-transparent transition-all duration-300 cursor-pointer"
          >
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <Badge
              data-pro={ProService.YES === pro}
              variant="secondary"
              className="absolute -top-2 -right-3 data-[pro=false]:hidden shadow-[0_0_10px_rgba(210,71,191,0.3)] animate-pulse"
            >
              PRO
            </Badge>
          </Card>
        ))}
      </div>
    </section>
  );
};