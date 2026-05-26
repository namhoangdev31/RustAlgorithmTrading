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

    const isDark = resolvedTheme !== "light"; // Default to dark for system/dark

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Theme-dependent colors (from DESIGN.md)
    const fogColor = isDark ? 0x1c1c1c : 0xfafafa; // canvas-night (#1c1c1c) / canvas-soft (#fafafa)
    const nodeColor = isDark ? 0x3ecf8e : 0x24b47e; // primary (#3ecf8e) / primary-deep (#24b47e)
    const lineColor = isDark ? 0x24b47e : 0x3ecf8e; // primary-deep (#24b47e) / primary (#3ecf8e)
    const packetColorVal = isDark ? 0xffdb13 : 0x054cff; // accent-yellow (#ffdb13) / accent-indigo (#054cff)

    // Create scene, camera, renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(fogColor, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 0, 30);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Procedural texture: Glowing Circle
    const createCircleTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.8)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 16, 16);
      }
      return new THREE.CanvasTexture(canvas);
    };

    // Procedural texture: Glowing Star Crystal
    const createStarTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 32, 32);
        const cx = 16;
        const cy = 16;

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
        gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.15)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 14);
        ctx.quadraticCurveTo(cx, cy, cx + 14, cy);
        ctx.quadraticCurveTo(cx, cy, cx, cy + 14);
        ctx.quadraticCurveTo(cx, cy, cx - 14, cy);
        ctx.quadraticCurveTo(cx, cy, cx, cy - 14);
        ctx.closePath();
        ctx.fill();
      }
      return new THREE.CanvasTexture(canvas);
    };

    const circleTexture = createCircleTexture();
    const starTexture = createStarTexture();

    // Create main nodes
    const particleCount = 140;
    const circleCount = 40;
    const starCount = 100;

    const nodes: { x: number; y: number; z: number; originalX: number; originalY: number; originalZ: number; speedX: number; speedY: number; speedZ: number }[] = [];
    const circlePositions = new Float32Array(circleCount * 3);
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 50;

      nodes.push({
        x,
        y,
        z,
        originalX: x,
        originalY: y,
        originalZ: z,
        speedX: (Math.random() - 0.5) * 0.005,
        speedY: (Math.random() - 0.5) * 0.005,
        speedZ: (Math.random() - 0.5) * 0.005,
      });

      if (i < circleCount) {
        circlePositions[i * 3] = x;
        circlePositions[i * 3 + 1] = y;
        circlePositions[i * 3 + 2] = z;
      } else {
        const idx = i - circleCount;
        starPositions[idx * 3] = x;
        starPositions[idx * 3 + 1] = y;
        starPositions[idx * 3 + 2] = z;
      }
    }

    // Circles Geometry & Material
    const circleGeometry = new THREE.BufferGeometry();
    circleGeometry.setAttribute("position", new THREE.BufferAttribute(circlePositions, 3));

    const circleMaterial = new THREE.PointsMaterial({
      color: nodeColor,
      size: 0.8,
      map: circleTexture,
      transparent: true,
      opacity: isDark ? 0.7 : 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const circleParticles = new THREE.Points(circleGeometry, circleMaterial);
    scene.add(circleParticles);

    // Stars Geometry & Material
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));

    const starMaterial = new THREE.PointsMaterial({
      color: nodeColor,
      size: 1.5, // Stars look better slightly larger
      map: starTexture,
      transparent: true,
      opacity: isDark ? 0.75 : 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const starParticles = new THREE.Points(starGeometry, starMaterial);
    scene.add(starParticles);

    // Connect nodes into grid lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: isDark ? 0.1 : 0.15,
    });

    let lineSegments = new THREE.LineSegments(new THREE.BufferGeometry(), lineMaterial);
    scene.add(lineSegments);

    // Order flow signals (packets traveling between nodes)
    const packetCount = 25;
    const packetGeometry = new THREE.BufferGeometry();
    const packetPositions = new Float32Array(packetCount * 3);
    packetGeometry.setAttribute("position", new THREE.BufferAttribute(packetPositions, 3));

    const packetMaterial = new THREE.PointsMaterial({
      color: packetColorVal,
      size: isDark ? 1.0 : 1.2,
      map: circleTexture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const packets = new THREE.Points(packetGeometry, packetMaterial);
    scene.add(packets);

    interface Packet {
      fromIndex: number;
      toIndex: number;
      progress: number;
      speed: number;
    }

    const packetData: Packet[] = [];
    const getConnections = (index: number): number[] => {
      const connections: number[] = [];
      const node = nodes[index];
      for (let j = 0; j < particleCount; j++) {
        if (index === j) continue;
        const dx = node.x - nodes[j].x;
        const dy = node.y - nodes[j].y;
        const dz = node.z - nodes[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 12) {
          connections.push(j);
        }
      }
      return connections;
    };

    for (let i = 0; i < packetCount; i++) {
      const fromIndex = Math.floor(Math.random() * particleCount);
      const connections = getConnections(fromIndex);
      const toIndex = connections.length > 0 
        ? connections[Math.floor(Math.random() * connections.length)] 
        : Math.floor(Math.random() * particleCount);

      packetData.push({
        fromIndex,
        toIndex,
        progress: Math.random(),
        speed: 0.005 + Math.random() * 0.015,
      });
    }

    // Scroll progress variable
    const scrollObj = { progress: 0 };
    
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);
    
    // Animate camera flying through nodes on scroll
    const scrollTriggerInstance = ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5,
      onUpdate: (self) => {
        scrollObj.progress = self.progress;
      }
    });

    // Mouse tracking for perspective tilt
    let mouseX = 0;
    let mouseY = 0;
    const targetX = { current: 0 };
    const targetY = { current: 0 };

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // 1. Update nodes positions (hover drift movement)
      for (let i = 0; i < particleCount; i++) {
        nodes[i].x += nodes[i].speedX;
        nodes[i].y += nodes[i].speedY;
        nodes[i].z += nodes[i].speedZ;

        if (Math.abs(nodes[i].x - nodes[i].originalX) > 4) nodes[i].speedX *= -1;
        if (Math.abs(nodes[i].y - nodes[i].originalY) > 4) nodes[i].speedY *= -1;
        if (Math.abs(nodes[i].z - nodes[i].originalZ) > 4) nodes[i].speedZ *= -1;
      }

      // Update Circles positions attributes
      const circlePositionsAttr = circleParticles.geometry.attributes.position as THREE.BufferAttribute;
      const circleArray = circlePositionsAttr.array as Float32Array;
      for (let i = 0; i < circleCount; i++) {
        circleArray[i * 3] = nodes[i].x;
        circleArray[i * 3 + 1] = nodes[i].y;
        circleArray[i * 3 + 2] = nodes[i].z;
      }
      circlePositionsAttr.needsUpdate = true;

      // Update Stars positions attributes
      const starPositionsAttr = starParticles.geometry.attributes.position as THREE.BufferAttribute;
      const starArray = starPositionsAttr.array as Float32Array;
      for (let i = 0; i < starCount; i++) {
        const idx = i + circleCount;
        starArray[i * 3] = nodes[idx].x;
        starArray[i * 3 + 1] = nodes[idx].y;
        starArray[i * 3 + 2] = nodes[idx].z;
      }
      starPositionsAttr.needsUpdate = true;

      // 2. Generate line connections dynamically
      const linePositions: number[] = [];
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dz = nodes[i].z - nodes[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 10) {
            linePositions.push(nodes[i].x, nodes[i].y, nodes[i].z);
            linePositions.push(nodes[j].x, nodes[j].y, nodes[j].z);
          }
        }
      }

      scene.remove(lineSegments);
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
      lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(lineSegments);

      // 3. Update packets (signals moving between nodes)
      const packetArray = packets.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < packetCount; i++) {
        const packet = packetData[i];
        packet.progress += packet.speed;

        if (packet.progress >= 1.0) {
          packet.progress = 0;
          packet.fromIndex = packet.toIndex;
          const connections = getConnections(packet.fromIndex);
          packet.toIndex = connections.length > 0 
            ? connections[Math.floor(Math.random() * connections.length)] 
            : Math.floor(Math.random() * particleCount);
        }

        const fromNode = nodes[packet.fromIndex];
        const toNode = nodes[packet.toIndex];

        if (fromNode && toNode) {
          packetArray[i * 3] = fromNode.x + (toNode.x - fromNode.x) * packet.progress;
          packetArray[i * 3 + 1] = fromNode.y + (toNode.y - fromNode.y) * packet.progress;
          packetArray[i * 3 + 2] = fromNode.z + (toNode.z - fromNode.z) * packet.progress;
        }
      }
      packets.geometry.attributes.position.needsUpdate = true;

      // 4. Animate Camera using scroll progress + mouse movement
      targetX.current += (mouseX * 5 - targetX.current) * 0.05;
      targetY.current += (mouseY * 5 - targetY.current) * 0.05;

      const flyZ = 30 - scrollObj.progress * 45;
      const flyY = scrollObj.progress * 15;
      const rotY = scrollObj.progress * Math.PI * 0.4;

      camera.position.x = targetX.current + Math.sin(rotY) * 10;
      camera.position.y = targetY.current + flyY;
      camera.position.z = flyZ;
      camera.lookAt(0, flyY * 0.3, -scrollObj.progress * 10);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      scrollTriggerInstance.kill();
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      circleGeometry.dispose();
      circleMaterial.dispose();
      circleTexture.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      starTexture.dispose();
      lineMaterial.dispose();
      packetGeometry.dispose();
      packetMaterial.dispose();
      renderer.dispose();
    };
  }, [resolvedTheme]);

  return <div ref={containerRef} className="fixed inset-0 -z-10 pointer-events-none bg-background transition-colors duration-500" />;
}
