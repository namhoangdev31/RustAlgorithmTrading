"use client";

import React, { useRef } from "react";
import { TransitionRouter } from "next-transition-router";
import gsap from "gsap";

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleLeave = (next: () => void) => {
    if (!overlayRef.current) {
      next();
      return;
    }
    
    // Slide up the transition overlay
    gsap.timeline({
      onComplete: next,
    })
    .set(overlayRef.current, { display: "block", yPercent: 100 })
    .to(overlayRef.current, {
      yPercent: 0,
      duration: 0.5,
      ease: "power3.inOut",
    });
  };

  const handleEnter = (next: () => void) => {
    if (!overlayRef.current) {
      next();
      return;
    }

    // Slide out the transition overlay
    gsap.timeline({
      onComplete: () => {
        next();
        if (overlayRef.current) {
          gsap.set(overlayRef.current, { display: "none" });
        }
      },
    })
    .set(overlayRef.current, { yPercent: 0 })
    .to(overlayRef.current, {
      yPercent: -100,
      duration: 0.5,
      ease: "power3.inOut",
    });
  };

  return (
    <TransitionRouter leave={handleLeave} enter={handleEnter}>
      {children}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9999] pointer-events-none hidden bg-gradient-to-tr from-[#D247BF] to-primary"
        style={{ transform: "translateY(100%)" }}
      />
    </TransitionRouter>
  );
}
