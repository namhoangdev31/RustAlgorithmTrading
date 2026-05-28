"use client";

import React, { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

interface BenefitsProps {
  icon: string;
  title: string;
  description: string;
}

export const BenefitsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Benefits");

  const benefitList: BenefitsProps[] = [
    {
      icon: "Rocket",
      title: t("benefit_1_title"),
      description: t("benefit_1_desc"),
    },
    {
      icon: "Globe",
      title: t("benefit_2_title"),
      description: t("benefit_2_desc"),
    },
    {
      icon: "TrendingUp",
      title: t("benefit_3_title"),
      description: t("benefit_3_desc"),
    },
    {
      icon: "BarChart3",
      title: t("benefit_4_title"),
      description: t("benefit_4_desc"),
    },
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Left-side text reveal + parallax glide
    if (textRef.current && containerRef.current) {
      // Reveal text elements
      gsap.fromTo(
        textRef.current.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: textRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );

      // Glide text downwards during scroll on desktop
      if (window.innerWidth >= 1024) {
        gsap.to(textRef.current, {
          y: 80,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 50%",
            end: "bottom 30%",
            scrub: true,
          }
        });
      }
    }

    // Right-side cards stagger animation + rotation reveal
    if (cardsContainerRef.current) {
      const cards = cardsContainerRef.current.querySelectorAll(".benefit-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 60, rotationX: 10, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          scale: 1,
          duration: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsContainerRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    }
  }, []);

  // Card hover interactive animations
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const icon = card.querySelector(".benefit-icon");
    const bgNumber = card.querySelector(".benefit-number");

    // Scale up card & color tint border
    gsap.to(card, {
      scale: 1.03,
      borderColor: "rgba(62,207,142,0.5)",
      boxShadow: "0 10px 30px -10px rgba(62,207,142,0.2)",
      duration: 0.3,
      ease: "power2.out",
    });

    // Bounce and rotate icon slightly
    if (icon) {
      gsap.to(icon, {
        scale: 1.15,
        rotation: 10,
        color: "#3ecf8e",
        duration: 0.4,
        ease: "back.out(2.5)",
      });
    }

    // Move number up and highlight it
    if (bgNumber) {
      gsap.to(bgNumber, {
        y: -10,
        color: "rgba(62,207,142,0.25)",
        duration: 0.3,
      });
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const icon = card.querySelector(".benefit-icon");
    const bgNumber = card.querySelector(".benefit-number");

    gsap.to(card, {
      scale: 1,
      borderColor: "",
      boxShadow: "",
      duration: 0.4,
      ease: "power2.out",
    });

    if (icon) {
      gsap.to(icon, {
        scale: 1,
        rotation: 0,
        color: "",
        duration: 0.4,
        ease: "power2.out",
      });
    }

    if (bgNumber) {
      gsap.to(bgNumber, {
        y: 0,
        color: "",
        duration: 0.4,
      });
    }
  };

  return (
    <section id="benefits" ref={containerRef} className="container py-24 sm:py-32 overflow-hidden">
      <div className="grid lg:grid-cols-2 place-items-center lg:gap-24">
        <div ref={textRef} className="w-full">
          <h2 className="text-lg text-primary mb-2 tracking-wider">{t("section_title")}</h2>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.rich("main_title", {
              brand: (chunks) => <span className="text-primary">{chunks}</span>
            })}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t("description")}
          </p>
        </div>

        <div ref={cardsContainerRef} className="grid lg:grid-cols-2 gap-4 w-full">
          {benefitList.map(({ icon, title, description }, index) => (
            <Card
              key={title}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="benefit-card bg-muted/50 dark:bg-card hover:bg-background transition-all duration-300 group/number border border-transparent"
            >
              <CardHeader>
                <div className="flex justify-between">
                  <div className="benefit-icon text-primary transition-all duration-300">
                    <Icon
                      name={icon as keyof typeof icons}
                      size={32}
                      className="mb-6"
                    />
                  </div>
                  <span className="benefit-number text-5xl text-muted-foreground/15 font-medium transition-all duration-300">
                    0{index + 1}
                  </span>
                </div>

                <CardTitle>{title}</CardTitle>
              </CardHeader>

              <CardContent className="text-muted-foreground">
                {description}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};