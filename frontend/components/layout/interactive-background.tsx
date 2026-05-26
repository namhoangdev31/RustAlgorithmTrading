"use client";

import React, { useEffect, useRef } from "react";

export const InteractiveBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const interactiveWrapperRef = useRef<HTMLDivElement>(null);
  const glowARef = useRef<HTMLDivElement>(null);
  const glowBRef = useRef<HTMLDivElement>(null);
  const gridHighlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const container = containerRef.current;
    const interactiveWrapper = interactiveWrapperRef.current;
    const glowA = glowARef.current;
    const glowB = glowBRef.current;
    const gridHighlight = gridHighlightRef.current;

    // Mouse coordinates (client-based)
    let mouseX = -1000;
    let mouseY = -1000;
    let isMouseOnScreen = false;

    // Interpolated coordinates for smooth lagging secondary glow
    let interpX = -1000;
    let interpY = -1000;

    // Target opacity for smooth entry/exit
    let currentOpacity = 0;
    let targetOpacity = 0;

    // Scroll tracking
    let scrollY = window.scrollY;

    const handleMouseMove = (e: MouseEvent) => {
      // Get viewport-relative coordinates
      mouseX = e.clientX;
      mouseY = e.clientY;
      isMouseOnScreen = true;
      targetOpacity = 1.0;

      // First run initialization of interpolation to prevent snapping from (-1000, -1000)
      if (interpX < -500) {
        interpX = mouseX;
        interpY = mouseY;
      }

      // Update instantaneous properties immediately (pixel-perfect!)
      if (glowA) {
        glowA.style.transform = `translate3d(${mouseX - 250}px, ${mouseY - 250}px, 0)`;
      }

      if (gridHighlight) {
        gridHighlight.style.setProperty("--mask-x", `${mouseX}px`);
        gridHighlight.style.setProperty("--mask-y", `${mouseY}px`);
      }
    };

    const handleMouseLeave = () => {
      isMouseOnScreen = false;
      targetOpacity = 0.0;
    };

    const handleMouseEnter = () => {
      isMouseOnScreen = true;
      targetOpacity = 1.0;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    document.addEventListener("mouseenter", handleMouseEnter, { passive: true });

    // Animation loop for smooth lagging secondary glow & opacity transitions
    let animationFrameId: number;
    const update = () => {
      const viewportHeight = window.innerHeight || 800;
      // Start fading in as the Hero section scrolls out (from 35% of viewport to 80% of viewport)
      const startFade = viewportHeight * 0.35;
      const endFade = viewportHeight * 0.8;
      
      let scrollFactor = 0;
      if (scrollY > startFade) {
        scrollFactor = Math.min((scrollY - startFade) / (endFade - startFade), 1.0);
      }

      // Smoothly interpolate secondary glow position (adds organic lag)
      if (isMouseOnScreen) {
        interpX += (mouseX - interpX) * 0.075;
        interpY += (mouseY - interpY) * 0.075;

        if (glowB) {
          glowB.style.transform = `translate3d(${interpX - 300}px, ${interpY - 300}px, 0)`;
        }
      }

      // Smoothly transition opacity of interactive elements
      currentOpacity += (targetOpacity - currentOpacity) * 0.08;

      if (container) {
        container.style.opacity = `${scrollFactor}`;
      }

      if (interactiveWrapper) {
        interactiveWrapper.style.opacity = `${currentOpacity}`;
      }

      animationFrameId = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-background transition-opacity duration-500"
      style={{ opacity: 0 }}
    >
      {/* 1. Base grid pattern covering the entire background (adapts to light/dark themes via currentColor) */}
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] transition-all"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          color: "var(--foreground)",
        }}
      />

      {/* Wrapper for interactive cursor-based glows and highlights, which can fade out when mouse leaves */}
      <div
        ref={interactiveWrapperRef}
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: 0 }}
      >
        {/* 2. Spotlight Glow A (Instantaneous, Emerald Green) */}
        <div
          ref={glowARef}
          className="absolute rounded-full blur-[130px] opacity-[0.09] dark:opacity-[0.12] mix-blend-screen"
          style={{
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, #3ecf8e 0%, rgba(6, 182, 212, 0.2) 60%, transparent 100%)",
            transform: "translate3d(-1000px, -1000px, 0)",
            willChange: "transform",
          }}
        />

        {/* 3. Spotlight Glow B (Smooth Lagging, Neon Pink/Violet) */}
        <div
          ref={glowBRef}
          className="absolute rounded-full blur-[160px] opacity-[0.07] dark:opacity-[0.10] mix-blend-screen"
          style={{
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, #d247bf 0%, rgba(99, 102, 241, 0.15) 60%, transparent 100%)",
            transform: "translate3d(-1000px, -1000px, 0)",
            willChange: "transform",
          }}
        />

        {/* 4. Interactive Grid Highlights (Pixel-perfect mask centered on mouse position) */}
        <div
          ref={gridHighlightRef}
          className="absolute inset-0 opacity-[0.25] dark:opacity-[0.18]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #3ecf8e 1.5px, transparent 1.5px),
              linear-gradient(to bottom, #d247bf 1.5px, transparent 1.5px)
            `,
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(circle 220px at var(--mask-x, -1000px) var(--mask-y, -1000px), black 20%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(circle 220px at var(--mask-x, -1000px) var(--mask-y, -1000px), black 20%, transparent 100%)",
          }}
        />
      </div>
    </div>
  );
};
