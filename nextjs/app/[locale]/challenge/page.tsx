"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, Shield, Cpu, CheckCircle } from "lucide-react";

function ChallengeContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [status, setStatus] = useState<"initializing" | "solving" | "verifying" | "success" | "failed">("initializing");
  const [progress, setProgress] = useState(0);
  const [nonce, setNonce] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-5));
  };

  useEffect(() => {
    let active = true;

    async function runChallenge() {
      if (!active) return;
      
      // Step 1: Handshake
      setStatus("initializing");
      addLog("Initializing Edge WAF Browser verification handshake...");
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Step 2: Solve JS DOM Browser Checks
      if (!active) return;
      setStatus("solving");
      addLog("Evaluating client JS DOM parameters to verify browser integrity...");
      setProgress(10);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Check 1: Automation Check (navigator.webdriver)
      const isWebdriver = navigator.webdriver;
      addLog(`[DOM] Webdriver validation: ${isWebdriver ? "AUTOMATED CLIENT" : "PASSED"}`);
      setProgress(20);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Check 2: Display Check (screen dimensions)
      const isHeadless = window.screen.width === 0 || window.screen.height === 0;
      addLog(`[DOM] Display validation: ${isHeadless ? "HEADLESS" : "PASSED (" + window.screen.width + "x" + window.screen.height + ")"}`);
      setProgress(30);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Check 3: Canvas Rendering Verification
      let canvasOk = false;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 30;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#6366f1";
          ctx.fillRect(0, 0, 100, 30);
          ctx.fillStyle = "#ffffff";
          ctx.font = "12px sans-serif";
          ctx.fillText("LepoS WAF", 5, 20);
          const dataUrl = canvas.toDataURL();
          canvasOk = dataUrl.startsWith("data:image/png;base64,") && dataUrl.length > 100;
        }
      } catch (e) {
        canvasOk = false;
      }
      addLog(`[DOM] Canvas subsystem: ${canvasOk ? "PASSED" : "FAILED"}`);
      setProgress(40);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Step 3: Run Crypto PoW challenge
      addLog("Starting cryptographic Proof-of-Work SHA-256 challenge...");
      const challengeSeed = Math.random().toString(36).substring(2, 15);
      addLog(`Generating seed: ${challengeSeed}`);
      
      let solved = false;
      let currentNonce = 0;
      let hashStr = "";
      const difficulty = 4; // requires 4 leading zeros
      const targetPrefix = "0".repeat(difficulty);
      const startTime = performance.now();

      while (!solved && active && currentNonce < 15000) {
        // Run in batches to not lock event loop
        for (let i = 0; i < 400; i++) {
          currentNonce++;
          const candidate = challengeSeed + currentNonce;
          const msgBuffer = new TextEncoder().encode(candidate);
          const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
          if (hex.startsWith(targetPrefix)) {
            hashStr = hex;
            solved = true;
            break;
          }
        }
        setNonce(currentNonce);
        setProgress(40 + Math.min(Math.floor((currentNonce / 15000) * 45), 45));
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      const powDuration = ((performance.now() - startTime) / 1000).toFixed(2);
      if (solved && active) {
        addLog(`[PoW] Cryptographic solution verified! Nonce: ${currentNonce}`);
        addLog(`[PoW] Hash: ${hashStr.substring(0, 24)}...`);
        addLog(`[PoW] Solved in ${powDuration}s`);
      } else if (active) {
        addLog("[PoW] Cryptographic challenge timed out or failed.");
      }
      
      setProgress(90);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const isBot = isWebdriver || isHeadless || !canvasOk || !solved;

      if (!active) return;
      
      // Step 4: Verifying
      setStatus("verifying");
      setProgress(98);
      addLog(isBot ? "Client validation failed. WAF Blocked." : "Client signatures valid. Granting access...");
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (!active) return;
      
      if (isBot) {
        setStatus("failed");
        addLog("Access Denied: Environment or cryptographic challenge verification failed.");
        return;
      }

      // Step 5: Success
      setStatus("success");
      setProgress(100);
      addLog("JS DOM & Cryptographical challenge passed! Redirecting...");
      
      // Set bypass cookie for 2 hours (7200 seconds)
      document.cookie = "lepos-challenge-passed=true; path=/; max-age=7200; SameSite=Lax";
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!active) return;
      
      // Redirect back to original route
      window.location.href = callbackUrl;
    }

    runChallenge();

    return () => {
      active = false;
    };
  }, [callbackUrl]);

  return (
    <div className="min-h-screen bg-canvas-night flex flex-col items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-md bg-canvas-night/40 backdrop-blur-md border border-hairline/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6">
        
        {/* WAF Status Icon */}
        <div className="relative size-16 flex items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          {status === "success" ? (
            <CheckCircle className="size-8 text-emerald-400 animate-in zoom-in-50" />
          ) : status === "solving" ? (
            <Cpu className="size-8 text-indigo-400 animate-spin" />
          ) : (
            <Shield className="size-8 text-indigo-400 animate-pulse" />
          )}
          
          {status === "solving" && (
            <span className="absolute -inset-1 rounded-2xl border border-indigo-500/30 animate-ping opacity-75" />
          )}
        </div>

        {/* Header Description */}
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-100">LepoS Security Gateway</h2>
          <p className="text-xs text-slate-400 max-w-[285px]">
            Please wait while we verify your browser integrity to protect against automated scrapers and DDoS attacks.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span className="uppercase font-bold tracking-widest">
              {status === "initializing" && "Initializing handshake..."}
              {status === "solving" && "Solving JS DOM Browser Checks..."}
              {status === "verifying" && "Verifying client signature..."}
              {status === "success" && "Verification Passed!"}
              {status === "failed" && "Verification Failed"}
            </span>
            <span className="font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Real-time telemetry log logs */}
        <div className="w-full p-4 rounded-xl bg-slate-950/40 border border-slate-900 font-mono text-[9px] text-slate-400 flex flex-col gap-1.5 min-h-[96px]">
          {logs.map((log, index) => (
            <div key={index} className={`truncate ${index === logs.length - 1 ? "text-indigo-300" : ""}`}>
              {log}
            </div>
          ))}
          {status === "solving" && (
            <div className="text-slate-500 animate-pulse">
              Evaluating DOM properties...
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-2">
          <ShieldCheck className="size-3.5 text-slate-500" />
          <span>Secured dynamically by LepoS Edge WAF (v2.4.1)</span>
        </div>
      </div>
    </div>
  );
}

export default function ChallengePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-canvas-night flex items-center justify-center text-slate-400 text-xs">
        Loading challenge verification...
      </div>
    }>
      <ChallengeContent />
    </Suspense>
  );
}
