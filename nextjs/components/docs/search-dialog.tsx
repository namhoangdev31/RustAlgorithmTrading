"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { docsNavigation } from "@/lib/docs";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { BookOpen, FileText, Home, Keyboard, Terminal } from "lucide-react";
import { GithubIcon } from "@/components/ui/icon";
import { Kbd } from "@/components/ui/kbd";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (slug: string) => {
    onOpenChange(false);
    router.push(`/docs/${slug}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search documentation..." />
      <CommandList className="max-h-[450px]">
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Navigation Categories */}
        {docsNavigation.map((group) => (
          <CommandGroup key={group.title} heading={group.title}>
            {group.items.map((item) => (
              <CommandItem
                key={item.slug}
                value={item.title}
                onSelect={() => handleSelect(item.slug)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 cursor-pointer rounded-md transition-colors"
              >
                <FileText className="size-4 text-muted-foreground shrink-0" />
                <div className="flex flex-col">
                  <span className="text-foreground font-medium text-sm">{item.title}</span>
                  <span className="text-muted-foreground text-xs font-mono">{`/docs/${item.slug}`}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        <CommandSeparator />

        {/* Quick Actions Group */}
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              router.push("/");
            }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 cursor-pointer rounded-md transition-colors"
          >
            <Home className="size-4 text-muted-foreground" />
            <span className="text-foreground">Go to Homepage</span>
            <CommandShortcut className="text-xs text-muted-foreground font-mono">/home</CommandShortcut>
          </CommandItem>
          
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              window.open("https://github.com/namhoangdev31/RustAlgorithmTrading", "_blank");
            }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 cursor-pointer rounded-md transition-colors"
          >
            <GithubIcon className="size-4 text-muted-foreground" />
            <span className="text-foreground">Open GitHub Repository</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Simple CommandShortcut component in case CommandShortcut is styled differently
function CommandShortcut({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-xs border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
      {children}
    </kbd>
  );
}
