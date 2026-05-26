"use client";

import React, { useEffect, useRef } from "react";
// @ts-ignore
import * as THREE from "three";

export const TradingCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current || !containerRef.current) return;

    // --- Setup Scene, Camera, Renderer ---
    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0c, 0.0015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    camera.position.z = 280;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    // --- State & Interaction Variables ---
    const mouseRef = new THREE.Vector2(0, 0);
    const mouseTargetStrength = { value: 0.0 };
    const mouseCurrentStrength = { value: 0.0 };
    const mouse3D = new THREE.Vector3(0, 0, 0);
    const mouse3DInterp = new THREE.Vector3(0, 0, 0);

    const scrollState = {
      target: 0,
      current: 0,
    };

    // --- Particle System Generation ---
    const particleCount = 15000;
    const positions = new Float32Array(particleCount * 3);
    const randoms = new Float32Array(particleCount * 4); // [orbitRadius, phaseOffset, orbitSpeed, heightOffset]
    const colors = new Float32Array(particleCount * 3);

    // Define color palettes
    const palette = [
      new THREE.Color("#3ecf8e"), // Emerald Green
      new THREE.Color("#24b47e"), // Darker Emerald
      new THREE.Color("#06b6d4"), // Bright Cyan
      new THREE.Color("#10b981"), // Mint
      new THREE.Color("#6366f1"), // Indigo accents
    ];

    for (let i = 0; i < particleCount; i++) {
      // Distribute particles in a large 3D volume
      const x = (Math.random() - 0.5) * 800;
      const y = (Math.random() - 0.5) * 500;
      const z = (Math.random() - 0.5) * 400;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Random parameters for mouse swirl and animation phase
      randoms[i * 4] = Math.random(); // orbitRadius scaling
      randoms[i * 4 + 1] = Math.random(); // phaseOffset
      randoms[i * 4 + 2] = 0.5 + Math.random() * 1.5; // orbitSpeed modifier
      randoms[i * 4 + 3] = Math.random(); // heightOffset scaling

      // Distribute colors across the palette
      let colorIndex = 0;
      const r = Math.random();
      if (r < 0.45) {
        colorIndex = 0; // Emerald
      } else if (r < 0.7) {
        colorIndex = 1; // Darker Emerald
      } else if (r < 0.9) {
        colorIndex = 2; // Cyan
      } else if (r < 0.96) {
        colorIndex = 3; // Mint
      } else {
        colorIndex = 4; // Indigo
      }

      const color = palette[colorIndex];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 4));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

    // --- Custom Shader Material ---
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uMouse: { value: new THREE.Vector3(0, 0, 0) },
        uScrollY: { value: 0.0 },
        uMouseStrength: { value: 0.0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec3 uMouse;
        uniform float uScrollY;
        uniform float uMouseStrength;

        attribute vec4 aRandom;
        attribute vec3 aColor;

        varying vec3 vColor;
        varying float vOpacity;
        varying float vWeight;

        void main() {
          vec3 pos = position;

          // 1. Jellyfish Pulsation & Radial Waves
          float r = length(pos.xz);
          
          // Breathing contraction cycle (jellyfish bell motion)
          float pulse = 1.0 + 0.20 * sin(uTime * 1.4 - r * 0.012) * (0.6 + 0.4 * sin(uTime * 0.4));
          
          // Continuous 3D vertical wave
          float waveY = sin(pos.x * 0.01 + uTime * 0.6) * cos(pos.z * 0.01 + uTime * 0.5) * 35.0;
          // Outer contracting ripple
          waveY += sin(r * 0.02 - uTime * 1.5) * 12.0;

          vec3 wavePos = vec3(pos.x * pulse, pos.y + waveY, pos.z * pulse);

          // 2. Scroll Interaction
          // Shift particles vertically on scroll
          float scrollOffset = uScrollY * 0.25;
          wavePos.y -= scrollOffset;

          // Subtle spiral rotation on scroll
          float scrollAngle = uScrollY * 0.0008;
          float cosA = cos(scrollAngle);
          float sinA = sin(scrollAngle);
          float rx = wavePos.x * cosA - wavePos.z * sinA;
          float rz = wavePos.x * sinA + wavePos.z * cosA;
          wavePos.xz = vec2(rx, rz);

          // 3. Mouse Convergence & Orbit
          float orbitRadius = aRandom.x * 60.0 + 20.0;
          float orbitPhase = aRandom.y * 6.28318 + uTime * (aRandom.z * 1.4 + 0.7);
          
          vec3 mouseTarget = vec3(
            uMouse.x + cos(orbitPhase) * orbitRadius,
            uMouse.y + (aRandom.w - 0.5) * 45.0,
            uMouse.z + sin(orbitPhase) * orbitRadius
          );

          // Distance from particle's wave position to mouse position
          float distToMouse = distance(wavePos, uMouse);
          
          // Gaussian weight for attraction influence field
          float weight = exp(-(distToMouse * distToMouse) / (2.0 * 95.0 * 95.0));
          weight = smoothstep(0.0, 1.0, weight) * uMouseStrength;

          vec3 finalPos = mix(wavePos, mouseTarget, weight);

          // Project position
          vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Varying parameters
          vec3 activeColor = vec3(0.95, 0.28, 0.85); // Glow magenta/purple (#f347d9)
          vColor = mix(aColor, activeColor, weight * 0.85);
          vWeight = weight;

          // Depth attenuation & volume bounds fadeout
          vOpacity = smoothstep(-600.0, -100.0, mvPosition.z) * (1.0 - smoothstep(120.0, 480.0, length(finalPos.xz)));

          // Perspective particle sizing
          gl_PointSize = (aRandom.x * 4.5 + 2.5) * (300.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        varying float vWeight;

        void main() {
          // Circular particle shape
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          // Smooth radial fadeout
          float alpha = smoothstep(0.5, 0.08, dist);

          // Enhance glow brightness for active swarming particles
          vec3 glowColor = vColor;
          if (vWeight > 0.15) {
            glowColor += vec3(0.12, 0.04, 0.18) * vWeight;
          }

          gl_FragColor = vec4(glowColor, alpha * vOpacity * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // --- Mouse Event Handlers ---
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.y = -(event.clientY / window.innerHeight) * 2 + 1;
      mouseTargetStrength.value = 1.0;
    };

    const handleMouseLeave = () => {
      mouseTargetStrength.value = 0.0;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    // --- Window Resize Handler ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener("resize", handleResize);

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      material.uniforms.uTime.value = elapsed;

      // 1. Mouse presence interpolation
      mouseCurrentStrength.value += (mouseTargetStrength.value - mouseCurrentStrength.value) * 0.08;
      material.uniforms.uMouseStrength.value = mouseCurrentStrength.value;

      // 2. Project mouse coordinates onto the 3D plane at z=0
      if (mouseCurrentStrength.value > 0.01) {
        const mouseVector = new THREE.Vector3(mouseRef.x, mouseRef.y, 0.5);
        mouseVector.unproject(camera);
        const dir = mouseVector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        mouse3D.copy(camera.position).add(dir.multiplyScalar(distance));
      }

      // Smooth lag / tailing effect on the mouse vector
      mouse3DInterp.lerp(mouse3D, 0.1);
      material.uniforms.uMouse.value.copy(mouse3DInterp);

      // 3. Scroll damping
      scrollState.target = window.scrollY;
      scrollState.current += (scrollState.target - scrollState.current) * 0.06;
      material.uniforms.uScrollY.value = scrollState.current;

      // 4. Subtle background rotation of the whole scene
      particles.rotation.y = elapsed * 0.015;
      particles.rotation.x = elapsed * 0.008;

      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup ---
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      // Dispose of Three.js objects to prevent memory leaks
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />
    </div>
  );
};
