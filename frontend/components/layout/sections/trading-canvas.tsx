"use client";

import React, { useEffect, useRef } from "react";
// @ts-ignore
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "next-themes";

export function TradingCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    const isDark = resolvedTheme !== "light";
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // ─── Theme colors (DESIGN.md) ───
    const fogColor = isDark ? 0x1c1c1c : 0xfafafa;
    const primaryGreen = isDark ? 0x3ecf8e : 0x24b47e;
    const accentIndigo = isDark ? 0x054cff : 0x644fc1;
    const accentYellow = isDark ? 0xffdb13 : 0xffdb13;
    const lineColor = isDark ? 0x24b47e : 0x3ecf8e;
    const beamColor = isDark ? 0x3ecf8e : 0x24b47e;

    // ─── Scene ───
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(fogColor, 0.008);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
    camera.position.set(0, 12, 45);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ─── Procedural textures ───
    const createGlowTexture = (size: number) => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const half = size / 2;
        const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
        gradient.addColorStop(0, "rgba(255,255,255,1)");
        gradient.addColorStop(0.3, "rgba(255,255,255,0.6)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const createDiamondTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 32, 32);
        const cx = 16, cy = 16;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
        gradient.addColorStop(0, "rgba(255,255,255,1)");
        gradient.addColorStop(0.2, "rgba(255,255,255,0.85)");
        gradient.addColorStop(0.5, "rgba(255,255,255,0.2)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 13);
        ctx.lineTo(cx + 13, cy);
        ctx.lineTo(cx, cy + 13);
        ctx.lineTo(cx - 13, cy);
        ctx.closePath();
        ctx.fill();
      }
      return new THREE.CanvasTexture(canvas);
    };

    const glowTex = createGlowTexture(16);
    const diamondTex = createDiamondTexture();

    // ════════════════════════════════════════
    // LAYER 1 — APP DISTRIBUTION (top, y ≈ +8)
    // ════════════════════════════════════════
    const appNodeCount = 28;
    const appPositions = new Float32Array(appNodeCount * 3);
    const appNodes: { x: number; y: number; z: number; phase: number; radius: number }[] = [];

    // Arrange in small clustered groups (like mini-app modules)
    const clusterCenters = [
      { x: -14, z: -8 }, { x: 6, z: -12 }, { x: 18, z: -4 },
      { x: -8, z: 6 }, { x: 10, z: 8 }, { x: -18, z: 2 }, { x: 0, z: -2 },
    ];

    for (let i = 0; i < appNodeCount; i++) {
      const cluster = clusterCenters[i % clusterCenters.length];
      const x = cluster.x + (Math.random() - 0.5) * 8;
      const z = cluster.z + (Math.random() - 0.5) * 8;
      const y = 8 + (Math.random() - 0.5) * 1.5;
      appPositions[i * 3] = x;
      appPositions[i * 3 + 1] = y;
      appPositions[i * 3 + 2] = z;
      appNodes.push({ x, y, z, phase: Math.random() * Math.PI * 2, radius: 0.8 + Math.random() * 0.6 });
    }

    const appGeometry = new THREE.BufferGeometry();
    appGeometry.setAttribute("position", new THREE.BufferAttribute(appPositions, 3));
    const appMaterial = new THREE.PointsMaterial({
      color: primaryGreen,
      size: 2.2,
      map: diamondTex,
      transparent: true,
      opacity: isDark ? 0.85 : 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const appParticles = new THREE.Points(appGeometry, appMaterial);
    scene.add(appParticles);

    // ════════════════════════════════════════
    // LAYER 2 — CLOUD HOSTING GRID (middle, y ≈ 0)
    // ════════════════════════════════════════
    const gridCols = 10;
    const gridRows = 10;
    const cloudNodeCount = gridCols * gridRows;
    const cloudPositions = new Float32Array(cloudNodeCount * 3);
    const cloudNodes: { x: number; y: number; z: number; origX: number; origZ: number }[] = [];

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const idx = r * gridCols + c;
        const x = (c - (gridCols - 1) / 2) * 5.5 + (Math.random() - 0.5) * 0.4;
        const z = (r - (gridRows - 1) / 2) * 5.5 + (Math.random() - 0.5) * 0.4;
        const y = 0;
        cloudPositions[idx * 3] = x;
        cloudPositions[idx * 3 + 1] = y;
        cloudPositions[idx * 3 + 2] = z;
        cloudNodes.push({ x, y, z, origX: x, origZ: z });
      }
    }

    const cloudGeometry = new THREE.BufferGeometry();
    cloudGeometry.setAttribute("position", new THREE.BufferAttribute(cloudPositions, 3));
    const cloudMaterial = new THREE.PointsMaterial({
      color: accentIndigo,
      size: 1.0,
      map: glowTex,
      transparent: true,
      opacity: isDark ? 0.65 : 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const cloudParticles = new THREE.Points(cloudGeometry, cloudMaterial);
    scene.add(cloudParticles);

    // Cloud grid lines
    const cloudLineMaterial = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: isDark ? 0.06 : 0.08,
    });
    let cloudLineSegments = new THREE.LineSegments(new THREE.BufferGeometry(), cloudLineMaterial);
    scene.add(cloudLineSegments);

    // ════════════════════════════════════════
    // LAYER 3 — TRADING ENGINE (bottom, y ≈ -8)
    // ════════════════════════════════════════
    const candleCount = 24;
    const candleGroup = new THREE.Group();
    candleGroup.position.y = -8;
    scene.add(candleGroup);

    interface CandleData {
      body: THREE.Mesh;
      wick: THREE.Mesh;
      baseHeight: number;
      targetHeight: number;
      phase: number;
    }
    const candles: CandleData[] = [];

    for (let i = 0; i < candleCount; i++) {
      const x = (i - candleCount / 2) * 2.2;
      const isBullish = Math.random() > 0.4;
      const bodyH = 1 + Math.random() * 3;
      const wickH = bodyH + 0.5 + Math.random() * 1.5;

      const bodyColor = isBullish ? primaryGreen : (isDark ? 0xff4444 : 0xcc3333);

      // Candle body
      const bodyGeo = new THREE.BoxGeometry(1.2, bodyH, 1.2);
      const bodyMat = new THREE.MeshBasicMaterial({
        color: bodyColor,
        transparent: true,
        opacity: isDark ? 0.55 : 0.5,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(x, bodyH / 2, 0);

      // Candle wick
      const wickGeo = new THREE.BoxGeometry(0.15, wickH, 0.15);
      const wickMat = new THREE.MeshBasicMaterial({
        color: bodyColor,
        transparent: true,
        opacity: isDark ? 0.35 : 0.3,
      });
      const wick = new THREE.Mesh(wickGeo, wickMat);
      wick.position.set(x, wickH / 2, 0);

      candleGroup.add(body);
      candleGroup.add(wick);
      candles.push({ body, wick, baseHeight: bodyH, targetHeight: bodyH, phase: Math.random() * Math.PI * 2 });
    }

    // ════════════════════════════════════════
    // VERTICAL DATA BEAMS (connecting 3 layers)
    // ════════════════════════════════════════
    const beamCount = 8;
    const beamGroup = new THREE.Group();
    scene.add(beamGroup);

    interface BeamData {
      mesh: THREE.Mesh;
      x: number;
      z: number;
      speed: number;
      pulsePhase: number;
    }
    const beams: BeamData[] = [];

    for (let i = 0; i < beamCount; i++) {
      const x = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 20;
      const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 20, 4);
      const beamMat = new THREE.MeshBasicMaterial({
        color: beamColor,
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(beamGeo, beamMat);
      mesh.position.set(x, -2, z);
      beamGroup.add(mesh);
      beams.push({ mesh, x, z, speed: 0.5 + Math.random() * 1.5, pulsePhase: Math.random() * Math.PI * 2 });
    }

    // ════════════════════════════════════════
    // GLASSMORPHIC LAYER PLANES (subtle reference planes)
    // ════════════════════════════════════════
    const createLayerPlane = (y: number, color: number, opacityVal: number) => {
      const planeGeo = new THREE.PlaneGeometry(60, 50);
      const planeMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: opacityVal,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = y;
      return plane;
    };

    const topPlane = createLayerPlane(8, primaryGreen, isDark ? 0.012 : 0.015);
    const midPlane = createLayerPlane(0, accentIndigo, isDark ? 0.015 : 0.02);
    const botPlane = createLayerPlane(-8, accentYellow, isDark ? 0.012 : 0.015);
    scene.add(topPlane);
    scene.add(midPlane);
    scene.add(botPlane);

    // ════════════════════════════════════════
    // SCROLL & MOUSE TRACKING
    // ════════════════════════════════════════
    const scrollObj = { progress: 0 };
    gsap.registerPlugin(ScrollTrigger);

    const scrollTriggerInstance = ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5,
      onUpdate: (self) => {
        scrollObj.progress = self.progress;
      },
    });

    let mouseX = 0;
    let mouseY = 0;
    const smoothMouse = { x: 0, y: 0 };

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // ════════════════════════════════════════
    // ANIMATION LOOP
    // ════════════════════════════════════════
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      // Smooth mouse interpolation
      smoothMouse.x += (mouseX - smoothMouse.x) * 0.04;
      smoothMouse.y += (mouseY - smoothMouse.y) * 0.04;

      // ── Layer 1: App nodes gentle float ──
      const appAttr = appParticles.geometry.attributes.position as THREE.BufferAttribute;
      const appArr = appAttr.array as Float32Array;
      for (let i = 0; i < appNodeCount; i++) {
        const node = appNodes[i];
        appArr[i * 3 + 1] = node.y + Math.sin(time * 0.6 + node.phase) * node.radius;
        appArr[i * 3] = node.x + Math.cos(time * 0.3 + node.phase) * 0.4;
      }
      appAttr.needsUpdate = true;

      // ── Layer 2: Cloud grid subtle wave ──
      const cloudAttr = cloudParticles.geometry.attributes.position as THREE.BufferAttribute;
      const cloudArr = cloudAttr.array as Float32Array;
      for (let i = 0; i < cloudNodeCount; i++) {
        const node = cloudNodes[i];
        node.y = Math.sin(time * 0.8 + node.origX * 0.08) * 0.6 +
                 Math.cos(time * 0.5 + node.origZ * 0.06) * 0.4;
        cloudArr[i * 3 + 1] = node.y;
      }
      cloudAttr.needsUpdate = true;

      // Cloud grid lines (connect neighbors)
      const linePosArr: number[] = [];
      for (let i = 0; i < cloudNodeCount; i++) {
        for (let j = i + 1; j < cloudNodeCount; j++) {
          const dx = cloudNodes[i].x - cloudNodes[j].x;
          const dy = cloudNodes[i].y - cloudNodes[j].y;
          const dz = cloudNodes[i].z - cloudNodes[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 7.5) {
            linePosArr.push(cloudNodes[i].x, cloudNodes[i].y, cloudNodes[i].z);
            linePosArr.push(cloudNodes[j].x, cloudNodes[j].y, cloudNodes[j].z);
          }
        }
      }
      scene.remove(cloudLineSegments);
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePosArr, 3));
      cloudLineSegments = new THREE.LineSegments(lineGeo, cloudLineMaterial);
      scene.add(cloudLineSegments);

      // ── Layer 3: Candle height fluctuation ──
      for (let i = 0; i < candleCount; i++) {
        const c = candles[i];
        const fluctuation = Math.sin(time * 1.2 + c.phase) * 0.8;
        const newH = Math.max(0.5, c.baseHeight + fluctuation);
        c.body.scale.y = newH / c.baseHeight;
        c.body.position.y = newH / 2;
      }

      // ── Vertical data beams pulse ──
      for (let i = 0; i < beamCount; i++) {
        const b = beams[i];
        const pulse = Math.sin(time * b.speed + b.pulsePhase);
        const mat = b.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, pulse * 0.35);
      }

      // ── Camera: scroll-driven layer focus + mouse parallax ──
      const sp = scrollObj.progress;

      // Camera Y: top layer → mid → bottom
      const camY = 12 - sp * 22;
      // Camera Z: pull in slightly as we scroll
      const camZ = 45 - sp * 15;
      // Camera rotation: tilt down as we go deeper
      const lookY = 6 - sp * 16;

      camera.position.x = smoothMouse.x * 6 + Math.sin(sp * Math.PI * 0.5) * 4;
      camera.position.y = camY + smoothMouse.y * 3;
      camera.position.z = camZ;
      camera.lookAt(smoothMouse.x * 2, lookY, -sp * 8);

      renderer.render(scene, camera);
    };

    animate();

    // ── Resize handler ──
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ── Cleanup ──
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      scrollTriggerInstance.kill();
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      appGeometry.dispose();
      appMaterial.dispose();
      cloudGeometry.dispose();
      cloudMaterial.dispose();
      cloudLineMaterial.dispose();
      glowTex.dispose();
      diamondTex.dispose();
      candles.forEach((c) => {
        c.body.geometry.dispose();
        (c.body.material as THREE.Material).dispose();
        c.wick.geometry.dispose();
        (c.wick.material as THREE.Material).dispose();
      });
      beams.forEach((b) => {
        b.mesh.geometry.dispose();
        (b.mesh.material as THREE.Material).dispose();
      });
      [topPlane, midPlane, botPlane].forEach((p) => {
        p.geometry.dispose();
        (p.material as THREE.Material).dispose();
      });
      renderer.dispose();
    };
  }, [resolvedTheme]);

  return <div ref={containerRef} className="fixed inset-0 -z-10 pointer-events-none bg-background transition-colors duration-500" />;
}
