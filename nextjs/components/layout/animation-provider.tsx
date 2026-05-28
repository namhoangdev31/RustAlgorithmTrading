"use client";

import React, { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only execute on client side
    if (typeof window === "undefined") return;

    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    // Update ScrollTrigger on Lenis scroll
    lenis.on("scroll", () => {
      ScrollTrigger.update();
    });

    // Connect Lenis to GSAP ticker
    const updateGsapTicker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateGsapTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateGsapTicker);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
