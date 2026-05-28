"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { FooterSection } from "@/components/layout/sections/footer";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  ArrowRight, BookOpen, Cpu, Code2, Globe, Server,
  Smartphone, Terminal, Webhook, Database, Layers, Shield,
} from "lucide-react";

interface DocCard {
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  href: string;
  accent: string;
  iconColor: string;
}

export default function DocsPage() {
  const t = useTranslations("Docs");
  const params = useParams();
  const locale = params?.locale as string || "vi";
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const docCards: DocCard[] = [
    { icon: Layers, titleKey: "arch_title", descKey: "arch_desc", href: "/docs/architecture/SYSTEM_ARCHITECTURE", accent: "border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(52,211,153,0.1)]", iconColor: "text-emerald-500 bg-emerald-500/10" },
    { icon: Cpu, titleKey: "rust_title", descKey: "rust_desc", href: "/docs/api/rust", accent: "border-orange-500/30 hover:border-orange-500/60 hover:shadow-[0_0_25px_rgba(249,115,22,0.1)]", iconColor: "text-orange-400 bg-orange-500/10" },
    { icon: Code2, titleKey: "python_title", descKey: "python_desc", href: "/docs/api/python", accent: "border-yellow-500/30 hover:border-yellow-500/60 hover:shadow-[0_0_25px_rgba(234,179,8,0.1)]", iconColor: "text-yellow-400 bg-yellow-500/10" },
    { icon: Server, titleKey: "go_title", descKey: "go_desc", href: "/docs/observability/OBSERVABILITY_OVERVIEW", accent: "border-cyan-500/30 hover:border-cyan-500/60 hover:shadow-[0_0_25px_rgba(6,182,212,0.1)]", iconColor: "text-cyan-400 bg-cyan-500/10" },
    { icon: Smartphone, titleKey: "mobile_title", descKey: "mobile_desc", href: "/docs/architecture/SYSTEM_ARCHITECTURE", accent: "border-pink-500/30 hover:border-pink-500/60 hover:shadow-[0_0_25px_rgba(236,72,153,0.1)]", iconColor: "text-pink-400 bg-pink-500/10" },
    { icon: Webhook, titleKey: "api_title", descKey: "api_desc", href: "/docs/API_DOCUMENTATION", accent: "border-blue-500/30 hover:border-blue-500/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.1)]", iconColor: "text-blue-400 bg-blue-500/10" },
    { icon: Terminal, titleKey: "cli_title", descKey: "cli_desc", href: "/docs/setup/DEVELOPMENT", accent: "border-violet-500/30 hover:border-violet-500/60 hover:shadow-[0_0_25px_rgba(139,92,246,0.1)]", iconColor: "text-violet-400 bg-violet-500/10" },
    { icon: Shield, titleKey: "security_title", descKey: "security_desc", href: "/docs/security/SECURITY_STANDARDS", accent: "border-rose-500/30 hover:border-rose-500/60 hover:shadow-[0_0_25px_rgba(244,63,94,0.1)]", iconColor: "text-rose-400 bg-rose-500/10" },
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(headerRef.current.children, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.15, ease: "power3.out" });
      }
      const cards = gridRef.current?.querySelectorAll(".doc-card");
      if (cards) {
        gsap.set(cards, { clearProps: "all" });
        gsap.fromTo(cards, { opacity: 0, y: 50, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: gridRef.current, start: "top 85%", toggleActions: "play none none none" } });
      }
    });
    return () => ctx.revert();
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const icon = e.currentTarget.querySelector(".doc-icon");
    gsap.to(e.currentTarget, { y: -6, duration: 0.3, ease: "power2.out" });
    if (icon) gsap.to(icon, { scale: 1.15, rotation: 10, duration: 0.4, ease: "power2.out" });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const icon = e.currentTarget.querySelector(".doc-icon");
    gsap.to(e.currentTarget, { y: 0, duration: 0.4, ease: "power2.out" });
    if (icon) gsap.to(icon, { scale: 1, rotation: 0, duration: 0.5, ease: "power2.out" });
  };

  return (
    <>
      <section className="container py-24 sm:py-32 overflow-hidden">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <BookOpen className="size-4" />
            <span>{t("badge")}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">{t("title")}</h1>
          <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Quick start */}
        <div className="max-w-4xl mx-auto mb-16 rounded-xl border border-primary/20 bg-card/80 backdrop-blur-sm p-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Terminal className="size-5 text-primary" />
            {t("quickstart_title")}
          </h2>
          <p className="text-muted-foreground mb-6">{t("quickstart_desc")}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { step: "01", label: t("qs_step1") },
              { step: "02", label: t("qs_step2") },
              { step: "03", label: t("qs_step3") },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-start gap-3 rounded-lg border border-secondary bg-background p-4">
                <span className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">{step}</span>
                <p className="text-sm text-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Doc cards grid */}
        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {docCards.map(({ icon: CardIcon, titleKey, descKey, href, accent, iconColor }) => (
            <Link
              key={titleKey}
              href={href}
              className={`doc-card group rounded-xl border bg-card/80 backdrop-blur-sm p-6 transition-all duration-300 cursor-pointer ${accent}`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className={`doc-icon inline-flex items-center justify-center size-11 rounded-lg mb-4 ${iconColor}`}>
                <CardIcon className="size-5" />
              </div>
              <h3 className="text-base font-bold mb-2">{t(titleKey)}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{t(descKey)}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
                {t("read_more")} <ArrowRight className="size-3" />
              </span>
            </Link>
          ))}
        </div>

        {/* Architecture diagram placeholder */}
        <div id="architecture" className="max-w-5xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-center mb-4">{t("arch_section_title")}</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">{t("arch_section_desc")}</p>
          <div className="rounded-xl border border-secondary bg-card/80 backdrop-blur-sm p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: "Frontend", tech: "Next.js 16", color: "border-white/20", icon: Globe },
                { name: "Go API", tech: "Observability", color: "border-cyan-500/30", icon: Server },
                { name: "Rust Engine", tech: "6 Crates", color: "border-orange-500/30", icon: Cpu },
                { name: "Python", tech: "12+ Strategies", color: "border-yellow-500/30", icon: Code2 },
                { name: "iOS App", tech: "SwiftUI", color: "border-pink-500/30", icon: Smartphone },
                { name: "Android", tech: "Kotlin", color: "border-violet-500/30", icon: Smartphone },
              ].map((layer) => (
                <div key={layer.name} className={`flex flex-col items-center p-4 rounded-lg border ${layer.color} bg-background text-center`}>
                  <layer.icon className="size-6 mb-2 text-muted-foreground" />
                  <p className="text-sm font-semibold">{layer.name}</p>
                  <p className="text-xs text-muted-foreground">{layer.tech}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Database className="size-3" />
              <span>DuckDB · PostgreSQL · Firebase</span>
              <span className="mx-2">|</span>
              <Webhook className="size-3" />
              <span>ZMQ · WebSocket · REST</span>
            </div>
          </div>
        </div>
      </section>
      <FooterSection />
    </>
  );
}
