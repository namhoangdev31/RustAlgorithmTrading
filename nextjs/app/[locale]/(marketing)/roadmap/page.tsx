"use client";

import React, { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { FooterSection } from "@/components/layout/sections/footer";
import {
  CheckCircle2, Clock, Rocket, Sparkles, ArrowRight,
  Cpu, LineChart, Smartphone, Terminal, Shield,
} from "lucide-react";

type PhaseStatus = "completed" | "in-progress" | "planned" | "future";

interface Milestone { text: string; tags: string[]; }
interface Phase { id: string; status: PhaseStatus; icon: React.ElementType; milestones: Milestone[]; }

const statusConfig: Record<PhaseStatus, { color: string; bg: string; border: string; glow: string; dot: string }> = {
  completed: { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "shadow-[0_0_20px_rgba(52,211,153,0.15)]", dot: "bg-emerald-500" },
  "in-progress": { color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", glow: "shadow-[0_0_20px_rgba(62,207,142,0.2)]", dot: "bg-primary animate-pulse" },
  planned: { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30", glow: "", dot: "bg-blue-400" },
  future: { color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30", glow: "", dot: "bg-purple-400" },
};

const tagColors: Record<string, string> = {
  Rust: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  Python: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  Go: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  Swift: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  Kotlin: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  "Next.js": "bg-white/10 text-white/80 border-white/20",
  TypeScript: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  DuckDB: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Postgres: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  ZMQ: "bg-red-500/15 text-red-400 border-red-500/20",
  WebSocket: "bg-teal-500/15 text-teal-400 border-teal-500/20",
  Firebase: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  SwiftUI: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  "Edge CDN": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  RBAC: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  ML: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20",
  Stripe: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

export default function RoadmapPage() {
  const t = useTranslations("Roadmap");
  const headerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const phases: Phase[] = [
    { id: "phase1", status: "completed", icon: Cpu, milestones: [
      { text: t("p1_m1"), tags: ["Rust"] }, { text: t("p1_m2"), tags: ["Rust"] },
      { text: t("p1_m3"), tags: ["Rust"] }, { text: t("p1_m4"), tags: ["Python"] },
      { text: t("p1_m5"), tags: ["Python"] }, { text: t("p1_m6"), tags: ["Python", "Rust", "ZMQ"] },
      { text: t("p1_m7"), tags: ["Python", "Rust", "ZMQ"] },
    ]},
    { id: "phase2", status: "completed", icon: LineChart, milestones: [
      { text: t("p2_m1"), tags: ["Go", "DuckDB", "Postgres"] }, { text: t("p2_m2"), tags: ["Go", "WebSocket"] },
      { text: t("p2_m3"), tags: ["Go"] }, { text: t("p2_m4"), tags: ["Rust"] },
      { text: t("p2_m5"), tags: ["Go", "DuckDB"] }, { text: t("p2_m6"), tags: ["Go"] },
    ]},
    { id: "phase3", status: "in-progress", icon: Smartphone, milestones: [
      { text: t("p3_m1"), tags: ["Swift", "SwiftUI"] },
      { text: t("p3_m2"), tags: ["Kotlin"] },
      { text: t("p3_m3"), tags: ["Go"] },
      { text: t("p3_m4"), tags: ["Next.js", "TypeScript"] },
      { text: t("p3_m5"), tags: ["Next.js", "TypeScript"] },
      { text: t("p3_m6"), tags: ["Next.js", "Postgres"] },
      { text: t("p3_m7"), tags: ["Rust", "Python", "TypeScript"] },
      { text: t("p3_m8"), tags: ["SwiftUI", "Go"] },
      { text: t("p3_m9"), tags: ["Go", "Stripe"] },
      { text: t("p3_m10"), tags: ["Go", "Edge CDN"] },
    ]},
    { id: "phase4", status: "planned", icon: Terminal, milestones: [
      { text: t("p4_m1"), tags: ["Next.js", "TypeScript"] }, { text: t("p4_m2"), tags: ["Swift", "Kotlin", "TypeScript"] },
      { text: t("p4_m3"), tags: ["Go"] }, { text: t("p4_m4"), tags: ["Next.js", "Edge CDN"] },
      { text: t("p4_m5"), tags: ["Go"] }, { text: t("p4_m6"), tags: ["Go", "WebSocket"] },
    ]},
    { id: "phase5", status: "future", icon: Shield, milestones: [
      { text: t("p5_m1"), tags: ["Rust", "Go"] }, { text: t("p5_m2"), tags: ["RBAC"] },
      { text: t("p5_m3"), tags: ["Edge CDN"] }, { text: t("p5_m4"), tags: ["ML", "Python"] },
      { text: t("p5_m5"), tags: ["Go"] }, { text: t("p5_m6"), tags: ["Edge CDN"] },
    ]},
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(headerRef.current.children, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.15, ease: "power3.out" });
      }
      if (lineRef.current) {
        gsap.fromTo(lineRef.current, { scaleY: 0 }, { scaleY: 1, duration: 1.5, ease: "power2.inOut", scrollTrigger: { trigger: timelineRef.current, start: "top 80%", end: "bottom 60%", scrub: 1 } });
      }
      const cards = timelineRef.current?.querySelectorAll(".phase-card");
      if (cards) {
        cards.forEach((card, i) => {
          gsap.fromTo(card, { opacity: 0, x: i % 2 === 0 ? -60 : 60, y: 20 }, { opacity: 1, x: 0, y: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 85%", toggleActions: "play none none none" } });
        });
      }
    });
    return () => ctx.revert();
  }, []);

  return (
    <>
      <section className="container py-24 sm:py-32 overflow-hidden">
        <div ref={headerRef} className="text-center mb-20 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Rocket className="size-4" />
            <span>{t("badge")}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">{t("title")}</h1>
          <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div ref={timelineRef} className="relative max-w-5xl mx-auto">
          <div ref={lineRef} className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-primary/30 to-transparent hidden lg:block origin-top" />
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-primary/30 to-transparent lg:hidden" />

          {phases.map((phase, index) => {
            const cfg = statusConfig[phase.status];
            const isEven = index % 2 === 0;
            const PhaseIcon = phase.icon;
            return (
              <div key={phase.id} className={`phase-card relative mb-16 last:mb-0 lg:grid lg:grid-cols-2 lg:gap-12`}>
                <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-8 z-10">
                  <div className={`size-5 rounded-full ${cfg.dot} ring-4 ring-background`} />
                </div>
                <div className="lg:hidden absolute left-6 -translate-x-1/2 top-8 z-10">
                  <div className={`size-4 rounded-full ${cfg.dot} ring-4 ring-background`} />
                </div>
                <div className={`ml-12 lg:ml-0 ${isEven ? "lg:col-start-1 lg:pr-12 lg:text-right" : "lg:col-start-2 lg:pl-12"}`}>
                  <div className={`rounded-xl border ${cfg.border} bg-card/80 backdrop-blur-sm p-6 sm:p-8 ${cfg.glow} hover:shadow-lg transition-shadow duration-500`}>
                    <div className={`flex items-center gap-3 mb-4 ${isEven ? "lg:flex-row-reverse" : ""}`}>
                      <div className={`flex items-center justify-center size-10 rounded-lg ${cfg.bg}`}>
                        <PhaseIcon className={`size-5 ${cfg.color}`} />
                      </div>
                      <div>
                        <Badge variant="outline" className={`${cfg.bg} ${cfg.color} ${cfg.border} text-xs mb-1`}>
                          {t(`${phase.id}_status`)}
                        </Badge>
                        <h3 className="text-lg font-bold">{t(`${phase.id}_title`)}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{t(`${phase.id}_timeline`)}</p>
                    <p className={`text-sm text-foreground/80 mt-2 leading-relaxed border-l-2 border-primary/20 pl-3 italic ${isEven ? "lg:border-l-0 lg:border-r-2 lg:pl-0 lg:pr-3" : ""}`}>
                      {t(`${phase.id}_desc`)}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {phase.milestones.map((m, mi) => (
                        <li key={mi} className={`flex items-start gap-2 text-sm ${isEven ? "lg:flex-row-reverse lg:text-right" : ""}`}>
                          {phase.status === "completed" ? <CheckCircle2 className="size-4 mt-0.5 text-emerald-500 shrink-0" /> :
                           phase.status === "in-progress" ? <Clock className="size-4 mt-0.5 text-primary shrink-0 animate-pulse" /> :
                           <Sparkles className={`size-4 mt-0.5 ${cfg.color} shrink-0`} />}
                          <div>
                            <span className="text-foreground">{m.text}</span>
                            <div className={`flex flex-wrap gap-1 mt-1.5 ${isEven ? "lg:justify-end" : ""}`}>
                              {m.tags.map((tag) => (
                                <span key={tag} className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${tagColors[tag] || "bg-muted text-muted-foreground border-border"}`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {isEven ? <div className="hidden lg:block lg:col-start-2" /> : <div className="hidden lg:block lg:col-start-1" />}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-20">
          <p className="text-lg text-muted-foreground mb-6">{t("cta_text")}</p>
          <a href="https://github.com/SamoraDC/RustAlgorithmTrading" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            {t("cta_button")}
            <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
      <FooterSection />
    </>
  );
}
