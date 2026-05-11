"use client";

import { Icon } from "@/components/ui/icon";
import { Marquee } from "@devnomic/marquee";
import "@devnomic/marquee/dist/index.css";
import { icons } from "lucide-react";
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
  return (
    <section id="sponsors" className="max-w-[75%] mx-auto pb-24 sm:pb-32">
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
