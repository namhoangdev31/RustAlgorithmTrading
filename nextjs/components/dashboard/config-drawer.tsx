"use client";

import * as React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import {
  CheckCircle2,
  Columns3,
  Laptop,
  Moon,
  PanelLeft,
  PanelLeftClose,
  PanelTop,
  RotateCcw,
  Settings,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

import { useLayoutPreferences } from "@/components/dashboard/layout-preferences";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type Option = {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function ConfigDrawer() {
  const { setOpen, open } = useSidebar();
  const { setTheme, theme = "system" } = useTheme();
  const {
    collapsible,
    direction,
    resetLayout,
    setCollapsible,
    setDirection,
    setVariant,
    variant,
  } = useLayoutPreferences();

  const layoutValue = open ? "default" : collapsible;

  function handleReset() {
    setOpen(true);
    setTheme("system");
    resetLayout();
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button aria-label="Open theme settings" className="rounded-full" size="icon" variant="ghost">
          <Settings data-icon="inline-start" />
          <span className="sr-only">Open theme settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-[360px] flex-col px-0 sm:max-w-[360px]">
        <SheetHeader className="px-6 pb-0 text-start">
          <SheetTitle>Theme Settings</SheetTitle>
          <SheetDescription>
            Adjust the appearance and layout to suit your preferences.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
          <OptionSection
            onReset={() => setTheme("system")}
            options={[
              { value: "system", label: "System", icon: Laptop },
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
            ]}
            title="Theme"
            value={theme}
            onValueChange={setTheme}
          />
          <OptionSection
            className="max-md:hidden"
            onReset={() => setVariant("sidebar")}
            options={[
              { value: "inset", label: "Inset", icon: PanelLeftClose },
              { value: "floating", label: "Floating", icon: PanelTop },
              { value: "sidebar", label: "Sidebar", icon: PanelLeft },
            ]}
            title="Sidebar"
            value={variant}
            onValueChange={(value) =>
              setVariant(value as "inset" | "floating" | "sidebar")
            }
          />
          <OptionSection
            className="max-md:hidden"
            onReset={() => {
              setOpen(true);
              setCollapsible("icon");
            }}
            options={[
              { value: "default", label: "Default", icon: Columns3 },
              { value: "icon", label: "Compact", icon: PanelLeftClose },
              { value: "offcanvas", label: "Full layout", icon: PanelTop },
            ]}
            title="Layout"
            value={layoutValue}
            onValueChange={(value) => {
              if (value === "default") {
                setOpen(true);
                return;
              }
              setOpen(false);
              setCollapsible(value as "icon" | "offcanvas");
            }}
          />
          <OptionSection
            onReset={() => setDirection("ltr")}
            options={[
              { value: "ltr", label: "Left to Right", icon: PanelLeft },
              { value: "rtl", label: "Right to Left", icon: PanelLeftClose },
            ]}
            title="Direction"
            value={direction}
            onValueChange={(value) => setDirection(value as "ltr" | "rtl")}
          />
        </div>

        <SheetFooter className="px-6">
          <Button
            aria-label="Reset all settings to default values"
            onClick={handleReset}
            variant="destructive"
          >
            Reset
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function OptionSection({
  className,
  onReset,
  onValueChange,
  options,
  title,
  value,
}: {
  className?: string;
  onReset: () => void;
  onValueChange: (value: string) => void;
  options: Option[];
  title: string;
  value: string;
}) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        {title}
        <Button
          aria-label={`Reset ${title.toLowerCase()} preference to default`}
          className="size-4 rounded-full"
          onClick={onReset}
          size="icon"
          type="button"
          variant="secondary"
        >
          <RotateCcw className="size-3" />
        </Button>
      </div>
      <RadioGroup.Root
        aria-label={`Select ${title.toLowerCase()} preference`}
        className="grid w-full grid-cols-3 gap-4"
        onValueChange={onValueChange}
        value={value}
      >
        {options.map((option) => (
          <RadioGroup.Item
            aria-label={`Select ${option.label.toLowerCase()}`}
            className="group outline-none"
            key={option.value}
            value={option.value}
          >
            <div
              className={cn(
                "relative flex aspect-[4/3] items-center justify-center rounded-[6px] ring-1 ring-border transition",
                "group-data-[state=checked]:shadow-2xl group-data-[state=checked]:ring-primary group-focus-visible:ring-2"
              )}
            >
              <CheckCircle2 className="absolute right-0 top-0 size-6 -translate-y-1/2 translate-x-1/2 fill-primary stroke-white group-data-[state=unchecked]:hidden" />
              <option.icon className="size-8 text-muted-foreground group-data-[state=checked]:text-primary" />
            </div>
            <div className="mt-1 text-xs">{option.label}</div>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </section>
  );
}
