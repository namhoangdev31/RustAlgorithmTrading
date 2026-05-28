"use client";

import React, { useState, useRef } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  children?: React.ReactNode;
}

export function PreBlock({ children, className, ...props }: PreBlockProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const getCodeText = (): string => {
    if (!preRef.current) return "";
    return preRef.current.textContent || "";
  };

  const handleCopy = async () => {
    const code = getCodeText();
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  return (
    <div className="relative group/code-block my-6">
      <pre
        ref={preRef}
        className={cn(
          "overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 font-mono text-sm leading-relaxed select-text shadow-inner",
          className
        )}
        {...props}
      >
        {children}
      </pre>
      
      {/* Floating Copy Button */}
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "absolute right-3 top-3 p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-400 opacity-0 hover:opacity-100 focus:opacity-100 group-hover/code-block:opacity-100 transition-all duration-200 hover:text-zinc-200 hover:bg-zinc-800/80",
          copied ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 opacity-100 group-hover/code-block:opacity-100" : ""
        )}
        aria-label="Copy code to clipboard"
      >
        {copied ? (
          <Check className="size-4 animate-scale-in" />
        ) : (
          <Copy className="size-4" />
        )}
      </button>
    </div>
  );
}
