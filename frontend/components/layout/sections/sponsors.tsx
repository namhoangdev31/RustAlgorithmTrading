"use client";

import { Icon } from "@/components/ui/icon";
import { Marquee } from "@devnomic/marquee";
import "@devnomic/marquee/dist/index.css";
import { icons } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface sponsorsProps {
  icon: string;
  name: string;
}

const sponsors: sponsorsProps[] = [
  {
    icon: "Code",
    name: "Python Research",
  },
  {
    icon: "Cpu",
    name: "Rust Runtime",
  },
  {
    icon: "Activity",
    name: "Go Control Plane",
  },
  {
    icon: "Database",
    name: "DuckDB Metrics",
  },
  {
    icon: "ShieldCheck",
    name: "Risk Guardrails",
  },
  {
    icon: "RadioTower",
    name: "ZeroMQ Bridge",
  },
  {
    icon: "Workflow",
    name: "Alpaca Paper Flow",
  },
];

export const SponsorsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const element = containerRef.current;
    if (!element) return;

    const anim = gsap.fromTo(
      element.children,
      { opacity: 0, y: 30, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: element,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    );

    return () => {
      if (anim.scrollTrigger) anim.scrollTrigger.kill();
      anim.kill();
    };
  }, []);

  return (
    <section id="sponsors" ref={containerRef} className="max-w-[75%] mx-auto pb-24 sm:pb-32">
      <h2 className="text-lg md:text-xl text-center mb-6">
        Built around the stack your team already uses
      </h2>

      <div className="mx-auto">
        <Marquee
          className="gap-[3rem]"
          fade
          innerClassName="gap-[3rem]"
          pauseOnHover
        >
          {sponsors.map(({ icon, name }) => (
            <div
              key={name}
              className="flex items-center text-xl md:text-2xl font-medium"
            >
              <Icon
                name={icon as keyof typeof icons}
                size={32}
                color="hsl(var(--primary))"
                className="mr-2 text-primary"
              />
              {name}
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
};
