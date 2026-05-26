"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
  color: string;
  growthRate: number;
}

export const InteractiveBackground = () => {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const containerRef = useRef<HTMLDivElement>(null);
  const interactiveWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const interactiveWrapper = interactiveWrapperRef.current;
    const canvas = canvasRef.current;
    const spotlight = spotlightRef.current;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);

    // Mouse tracking
    let mouseX = -1000;
    let mouseY = -1000;
    let lastMouseX = -1000;
    let lastMouseY = -1000;
    let isMouseOnScreen = false;

    // Smoothly interpolated coordinate for spotlight tracking
    let spotlightX = -1000;
    let spotlightY = -1000;

    // Target opacity for smooth entry/exit
    let currentOpacity = 0;
    let targetOpacity = 0;

    // Scroll tracking
    let scrollY = window.scrollY;

    // Helper to convert hex colors from the design system to rgb string
    const hexToRgb = (hex: string): string => {
      const cleanHex = hex.replace("#", "").trim();
      if (cleanHex.length === 3) {
        const r = parseInt(cleanHex[0] + cleanHex[0], 16);
        const g = parseInt(cleanHex[1] + cleanHex[1], 16);
        const b = parseInt(cleanHex[2] + cleanHex[2], 16);
        return `${r}, ${g}, ${b}`;
      } else if (cleanHex.length === 6) {
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        return `${r}, ${g}, ${b}`;
      }
      return "62, 207, 142"; // fallback to emerald
    };

    // Dynamically retrieve Design System colors from CSS variables
    const rootStyle = getComputedStyle(document.documentElement);
    const primaryHex = rootStyle.getPropertyValue("--primary").trim() || "#3ecf8e";
    const accentPurpleHex = rootStyle.getPropertyValue("--accent-purple").trim() || "#6b01c2";
    const accentIndigoHex = rootStyle.getPropertyValue("--accent-indigo").trim() || "#054cff";

    const smokeColors = [
      `rgba(${hexToRgb(primaryHex)}, ALPHA)`,
      `rgba(${hexToRgb(accentPurpleHex)}, ALPHA)`,
      `rgba(${hexToRgb(accentIndigoHex)}, ALPHA)`,
    ];

    // Smoke particle array
    const particles: SmokeParticle[] = [];

    const spawnParticle = (x: number, y: number) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.5 + 0.1;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        // Small upward drift to simulate smoke rising
        vy: Math.sin(angle) * speed - 0.2,
        size: Math.random() * 15 + 20,
        alpha: 0.18,
        maxLife: Math.random() * 20 + 45, // Lifespan in frames
        life: 0,
        color: smokeColors[Math.floor(Math.random() * smokeColors.length)],
        growthRate: Math.random() * 0.9 + 1.2, // Growth speed per frame
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isMouseOnScreen = true;
      targetOpacity = 1.0;

      // Initialize positions on first entry
      if (lastMouseX < -500) {
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        spotlightX = mouseX;
        spotlightY = mouseY;
      }

      // Linear interpolation to spawn smoke particles between last position and current position
      const dx = mouseX - lastMouseX;
      const dy = mouseY - lastMouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 2) {
        const steps = Math.min(Math.floor(dist / 8), 12);
        for (let i = 0; i < steps; i++) {
          const t = i / steps;
          const spawnX = lastMouseX + dx * t;
          const spawnY = lastMouseY + dy * t;
          spawnParticle(spawnX, spawnY);
        }
        lastMouseX = mouseX;
        lastMouseY = mouseY;
      } else {
        if (Math.random() < 0.2) {
          spawnParticle(mouseX, mouseY);
        }
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

    // Animation loop
    let animationFrameId: number;
    const update = () => {
      const viewportHeight = window.innerHeight || 800;
      const startFade = viewportHeight * 0.35;
      const endFade = viewportHeight * 0.8;
      
      const isHomepage = pathnameRef.current === "/" || pathnameRef.current === "";
      let scrollFactor = 1.0;
      
      if (isHomepage) {
        scrollFactor = 0;
        if (scrollY > startFade) {
          scrollFactor = Math.min((scrollY - startFade) / (endFade - startFade), 1.0);
        }
      }

      // 1. Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // 2. Draw 3D Concave Deformed Grid
      ctx.globalCompositeOperation = "source-over";
      
      // Determine theme values
      const isDark = document.documentElement.classList.contains("dark");
      const foregroundRgb = isDark ? "255, 255, 255" : "23, 23, 23";
      const gridOpacity = isDark ? 0.05 : 0.08;
      
      ctx.strokeStyle = `rgba(${foregroundRgb}, ${gridOpacity})`;
      ctx.lineWidth = 1.5; // Thicker 1.5px lines as requested

      const gridRadius = 180;
      const maxDistortion = 32;
      const gridSpacing = 56; // Sparser 56px spacing

      // Draw Vertical Grid Lines
      for (let x = 0; x <= width; x += gridSpacing) {
        ctx.beginPath();
        if (isMouseOnScreen && Math.abs(x - mouseX) < gridRadius) {
          let first = true;
          for (let y = 0; y <= height; y += 8) {
            let px = x;
            let py = y;

            const dx = mouseX - px;
            const dy = mouseY - py;
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d < gridRadius && d > 0) {
              const t = d / gridRadius;
              // Concave warp pulling points towards the cursor center
              const displacement = maxDistortion * Math.sin(t * Math.PI) * (1.0 - t);
              px += (dx / d) * displacement;
              py += (dy / d) * displacement;
            }

            if (first) {
              ctx.moveTo(px, py);
              first = false;
            } else {
              ctx.lineTo(px, py);
            }
          }
        } else {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        ctx.stroke();
      }

      // Draw Horizontal Grid Lines
      for (let y = 0; y <= height; y += gridSpacing) {
        ctx.beginPath();
        if (isMouseOnScreen && Math.abs(y - mouseY) < gridRadius) {
          let first = true;
          for (let x = 0; x <= width; x += 8) {
            let px = x;
            let py = y;

            const dx = mouseX - px;
            const dy = mouseY - py;
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d < gridRadius && d > 0) {
              const t = d / gridRadius;
              const displacement = maxDistortion * Math.sin(t * Math.PI) * (1.0 - t);
              px += (dx / d) * displacement;
              py += (dy / d) * displacement;
            }

            if (first) {
              ctx.moveTo(px, py);
              first = false;
            } else {
              ctx.lineTo(px, py);
            }
          }
        } else {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();
      }

      // 3. Draw/Update Smoke Particles on Canvas on top of grid
      if (particles.length > 0) {
        ctx.globalCompositeOperation = "screen";

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.size += p.growthRate;
          p.life += 1;
          
          const lifeRatio = p.life / p.maxLife;
          p.alpha = (1.0 - lifeRatio) * 0.16;

          p.vx *= 0.97;
          p.vy *= 0.97;

          if (p.life >= p.maxLife) {
            particles.splice(i, 1);
            continue;
          }

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, p.color.replace("ALPHA", p.alpha.toString()));
          grad.addColorStop(0.35, p.color.replace("ALPHA", (p.alpha * 0.4).toString()));
          grad.addColorStop(1, p.color.replace("ALPHA", "0"));

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Smoothly track spotlight position
      if (isMouseOnScreen && mouseX > -500) {
        spotlightX += (mouseX - spotlightX) * 0.12;
        spotlightY += (mouseY - spotlightY) * 0.12;

        if (spotlight) {
          spotlight.style.transform = `translate3d(${spotlightX - 360}px, ${spotlightY - 360}px, 0)`;
        }
      }

      // Smoothly transition opacity
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
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const isHomepage = pathname === "/" || pathname === "";

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-background transition-opacity duration-500"
      style={{ opacity: isHomepage ? 0 : 1 }}
    >
      {/* High-performance canvas that draws the concave deformed grid and the smoke particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Wrapper for interactive back-glow, which fades out when mouse leaves */}
      <div
        ref={interactiveWrapperRef}
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: 0 }}
      >
        {/* Soft backlight behind the grid to emphasize the concave shape */}
        <div
          ref={spotlightRef}
          className="absolute rounded-full blur-[140px] opacity-[0.16] dark:opacity-[0.22] mix-blend-screen"
          style={{
            width: "720px",
            height: "720px",
            background: "radial-gradient(circle, color-mix(in srgb, var(--primary) 20%, transparent) 0%, color-mix(in srgb, var(--accent-purple) 8%, transparent) 50%, transparent 100%)",
            transform: "translate3d(-1000px, -1000px, 0)",
            willChange: "transform",
          }}
        />
      </div>
    </div>
  );
};
