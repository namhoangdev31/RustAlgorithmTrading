"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { GithubIcon } from "@/components/ui/icon";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TradingCanvas } from "./trading-canvas";

export const HeroSection = () => {
  const headingText = "RustAlgorithm Trading made simple";
  const words = headingText.split(" ");

  return (
    <section className="relative container w-full overflow-hidden min-h-[90vh] flex items-center justify-center">
      {/* 3D WebGL network background */}
      <TradingCanvas />

      <div className="relative z-10 grid place-items-center lg:max-w-screen-xl gap-8 mx-auto py-20 md:py-32 w-full">
        <div className="text-center flex flex-col gap-8 max-w-4xl">
          {/* Animated Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary shadow-[0_0_15px_rgba(210,71,191,0.1)]"
          >
            <ShieldCheck className="size-4 animate-pulse" />
            <span>Tri-Runtime Production Ready (v3.5)</span>
          </motion.div>

          {/* Title - Word Stagger Reveal */}
          <div className="max-w-screen-md mx-auto text-center text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight">
            <h1 className="leading-tight overflow-hidden py-1">
              {words.map((word, i) => {
                const isSpecial = word === "made" || word === "simple";
                return (
                  <motion.span
                    key={i}
                    className={`inline-block mr-[0.25em] last:mr-0 ${
                      isSpecial
                        ? "text-transparent bg-gradient-to-r from-[#24b47e] to-[#3ecf8e] bg-clip-text"
                        : ""
                    }`}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.08,
                      ease: [0.2, 0.65, 0.3, 0.9],
                    }}
                  >
                    {word}
                  </motion.span>
                );
              })}
            </h1>
          </div>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-screen-sm mx-auto text-xl text-muted-foreground"
          >
            A clean Next.js landing template for the hybrid trading stack:
            Python research, Rust runtime, Go observability, and a path from
            paper validation to production readiness.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="grid w-full max-w-md grid-cols-1 gap-4 sm:grid-cols-2 mx-auto"
          >
            <Button asChild className="w-full font-bold group/arrow hover:scale-105 transition-transform shadow-[0_0_20px_rgba(210,71,191,0.2)] hover:shadow-[0_0_25px_rgba(210,71,191,0.4)]">
              <Link href="#pricing">
                Start in minutes
                <ArrowRight
                  data-icon="inline-end"
                  className="group-hover/arrow:translate-x-1 transition-transform"
                />
              </Link>
            </Button>

            <Button
              asChild
              variant="secondary"
              className="w-full font-bold hover:scale-105 transition-transform"
            >
              <Link
                href="https://github.com/SamoraDC/RustAlgorithmTrading"
                target="_blank"
              >
                <GithubIcon className="mr-2 h-4 w-4" data-icon="inline-start" />
                View GitHub
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Live trading cockpit preview with GSAP animations */}
        <TradingPreview />
      </div>
    </section>
  );
};

const initialChartBars = [48, 66, 44, 74, 58, 86, 62, 92, 72, 78, 68, 96];

const TradingPreview = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Live state variables to make dashboard feel alive
  const [latency, setLatency] = useState("18.4ms");
  const [signals, setSignals] = useState(42);
  const [chartData, setChartData] = useState(initialChartBars);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Initial load animation for chart bars
    const bars = chartRef.current?.querySelectorAll(".chart-bar-fill");
    if (bars) {
      gsap.fromTo(
        bars,
        { height: "0%" },
        {
          height: (i) => `${chartData[i] - 18}%`,
          duration: 1.5,
          stagger: 0.05,
          ease: "elastic.out(1, 0.5)",
          delay: 0.5,
        }
      );
    }

    // Scroll trigger parallax/tilt effect on the dashboard mockup
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { 
          y: 100, 
          rotationX: 20,
          opacity: 0 
        },
        {
          y: 0,
          rotationX: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 95%",
            end: "top 40%",
            scrub: 1,
          }
        }
      );
    }

    // Live update tickers
    const interval = setInterval(() => {
      // 1. Latency fluctuation
      const newLat = (15 + Math.random() * 5).toFixed(1) + "ms";
      setLatency(newLat);

      // 2. Signals increment
      setSignals((prev) => prev + (Math.random() > 0.6 ? 1 : 0));

      // 3. Fluctuate chart bars slightly
      setChartData((prev) => 
        prev.map((val) => {
          const change = Math.floor((Math.random() - 0.5) * 8);
          return Math.max(30, Math.min(100, val + change));
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Update chart bars whenever state triggers new layout values
  useEffect(() => {
    const bars = chartRef.current?.querySelectorAll(".chart-bar-fill");
    if (bars) {
      bars.forEach((bar, i) => {
        gsap.to(bar, {
          height: `${chartData[i] - 18}%`,
          duration: 0.6,
          ease: "power2.out",
        });
      });
    }
  }, [chartData]);

  // Dynamic 3D mouse hover tilt handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Relative coordinates from card center (-1 to 1)
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Limit rotation to max 8 degrees
    const rotateY = x * 16;
    const rotateX = -y * 16;

    gsap.to(card, {
      rotateY,
      rotateX,
      transformPerspective: 1200,
      ease: "power2.out",
      duration: 0.5,
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      rotateY: 0,
      rotateX: 0,
      ease: "power2.out",
      duration: 0.8,
    });
  };

  return (
    <div 
      ref={containerRef} 
      className="relative mt-14 w-full max-w-6xl perspective-1000"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute top-2 lg:-top-8 left-1/2 h-24 w-[90%] -translate-x-1/2 rounded-full bg-primary/40 blur-3xl lg:h-80 pointer-events-none" />
      
      {/* 3D Tilting Card */}
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden rounded-lg border border-t-2 border-secondary border-t-primary/30 bg-card shadow-2xl shadow-primary/10 transition-shadow duration-500 hover:shadow-[0_20px_50px_rgba(210,71,191,0.2)]"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="flex items-center justify-between border-b border-secondary px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="size-3 rounded-full bg-destructive" />
            <div className="size-3 rounded-full bg-primary" />
            <div className="size-3 rounded-full bg-accent" />
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Live trading cockpit
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[240px_1fr]">
          <aside className="hidden border-r border-secondary bg-muted/40 p-5 lg:block">
            <div className="mb-6 text-sm font-semibold text-muted-foreground">
              Runtime
            </div>
            {["Market data", "Signal bridge", "Risk manager", "Execution"].map(
              (item, index) => (
                <div
                  key={item}
                  className="mb-3 flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm border border-secondary/20 hover:border-primary/40 transition-colors duration-300"
                >
                  <span>{item}</span>
                  <span
                    className={
                      index === 2
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    }
                  >
                    {index === 2 ? "armed" : "live"}
                  </span>
                </div>
              )
            )}
          </aside>

          <div className="p-4 sm:p-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["P99 latency", latency, "Go API"],
                ["Risk state", "Clear", "pre-trade"],
                ["Signals", signals.toString(), "last hour"],
              ].map(([label, value, meta]) => (
                <div
                  key={label}
                  className="rounded-md border border-secondary bg-background p-4 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(210,71,191,0.05)]"
                >
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-3xl font-bold font-mono tracking-tight text-transparent bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="rounded-md border border-secondary bg-background p-4">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">SPY signal stream</p>
                    <p className="text-sm text-muted-foreground">
                      Momentum confirmation with risk gate overlay
                    </p>
                  </div>
                  <Activity className="text-primary animate-pulse" />
                </div>
                <div ref={chartRef} className="flex h-56 items-end gap-2">
                  {initialChartBars.map((height, index) => (
                    <div
                      key={`${height}-${index}`}
                      className="flex flex-1 items-end rounded-sm bg-muted overflow-hidden"
                      style={{ height: `${height}%` }}
                    >
                      <div
                        className="chart-bar-fill w-full rounded-sm bg-gradient-to-t from-[#24b47e] via-[#3ecf8e] to-[#4ade80]"
                        style={{ height: `0%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-secondary bg-background p-4">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-primary" />
                  <p className="font-semibold">Execution checks</p>
                </div>
                {[
                  ["Exposure limit", "pass"],
                  ["Circuit breaker", "idle"],
                  ["Order route", "paper"],
                  ["Correlation id", "attached"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="mb-3 flex items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-sm border border-secondary/20 hover:border-primary/20 transition-all duration-300"
                  >
                    <span>{label}</span>
                    <span className="font-medium text-primary">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 h-20 w-full bg-gradient-to-b from-background/0 via-background/50 to-background pointer-events-none" />
      </div>
    </div>
  );
};
