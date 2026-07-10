"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type CodePanelProps = {
  code: string;
  language?: string;
  title?: string;
  className?: string;
};

export function CodePanel({
  code,
  language = "javascript",
  title,
  className,
}: CodePanelProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div
      className={cn(
        "border border-hairline rounded-md bg-card overflow-hidden shadow-light",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-hairline bg-secondary/50">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {title || language}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono text-foreground leading-relaxed bg-card select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
}
