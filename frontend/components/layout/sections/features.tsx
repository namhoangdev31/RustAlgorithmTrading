"use client";

import React, { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface FeaturesProps {
  icon: string;
  title: string;
  description: string;
}

const featureList: FeaturesProps[] = [
  {
    icon: "TabletSmartphone",
    title: "Mobile Friendly",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. A odio velit cum aliquam, consectetur.",
  },
  {
    icon: "BadgeCheck",
    title: "Social Proof",
    description:
      "Lorem ipsum dolor sit amet consectetur. Natus consectetur, odio ea accusamus aperiam.",
  },
  {
    icon: "Goal",
    title: "Targeted Content",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. odio ea accusamus aperiam.",
  },
  {
    icon: "PictureInPicture",
    title: "Strong Visuals",
    description:
      "Lorem elit. A odio velit cum aliquam. Natus consectetur dolores, odio ea accusamus aperiam.",
  },
  {
    icon: "MousePointerClick",
    title: "Clear CTA",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing. odio ea accusamus consectetur.",
  },
  {
    icon: "Newspaper",
    title: "Clear Headline",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. A odio velit cum aliquam. Natus consectetur.",
  },
];

export const FeaturesSection = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    let headerAnim: gsap.core.Tween | null = null;
    let gridAnim: gsap.core.Tween | null = null;
    let items: NodeListOf<Element> | null = null;

    // Animate Header
    if (headerRef.current) {
      headerAnim = gsap.fromTo(
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

    // Animate Grid Items (Slide-in and stagger)
    if (gridRef.current) {
      items = gridRef.current.querySelectorAll(".feature-item");
      
      // Clear any leftover inline styles from hot-reloads
      gsap.set(items, { clearProps: "all" });

      gridAnim = gsap.fromTo(
        items,
        { opacity: 0, y: 50, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }

    return () => {
      if (headerAnim) {
        if (headerAnim.scrollTrigger) headerAnim.scrollTrigger.kill();
        headerAnim.kill();
      }
      if (gridAnim) {
        if (gridAnim.scrollTrigger) gridAnim.scrollTrigger.kill();
        gridAnim.kill();
      }
      if (items) {
        gsap.set(items, { clearProps: "all" });
      }
    };
  }, []);
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const icon = card.querySelector(".feature-icon");

    gsap.to(card, {
      y: -6,
      borderColor: "rgba(62, 207, 142, 0.4)", // Emerald green border highlight
      boxShadow: "0 15px 30px -15px rgba(62, 207, 142, 0.2)",
      backgroundColor: "rgba(62, 207, 142, 0.02)",
      duration: 0.3,
      ease: "power2.out",
    });

    if (icon) {
      gsap.to(icon, {
        scale: 1.2,
        rotation: 360,
        color: "#3ecf8e", // Emerald green
        duration: 0.6,
        ease: "power2.out",
      });
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const icon = card.querySelector(".feature-icon");

    gsap.to(card, {
      y: 0,
      borderColor: "",
      boxShadow: "",
      backgroundColor: "",
      duration: 0.4,
      ease: "power2.out",
    });

    if (icon) {
      gsap.to(icon, {
        scale: 1,
        rotation: 0,
        color: "",
        duration: 0.5,
        ease: "power2.out",
      });
    }
  };

  return (
    <section id="features" className="container py-24 sm:py-32 overflow-hidden">
      <div ref={headerRef} className="text-center mb-12">
        <h2 className="text-lg text-primary mb-2 tracking-wider">
          Features
        </h2>

        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          What Makes Us Different
        </h2>

        <h3 className="md:w-1/2 mx-auto text-xl text-muted-foreground">
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Voluptatem
          fugiat, odit similique quasi sint reiciendis quidem iure veritatis optio
          facere tenetur.
        </h3>
      </div>

      <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {featureList.map(({ icon, title, description }) => (
          <div key={title} className="feature-item">
            <Card
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="h-full bg-background border border-secondary/50 dark:border-secondary/20 shadow-sm transition-all duration-300 cursor-pointer"
            >
              <CardHeader className="flex justify-center items-center">
                <div className="feature-icon text-primary transition-all duration-300">
                  <Icon
                    name={icon as keyof typeof icons}
                    size={32}
                    className="mb-6"
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