"use client";
import {
  Activity,
  Blocks,
  Menu,
  ShieldCheck,
  Zap,
} from "lucide-react";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Separator } from "../ui/separator";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import { Button } from "../ui/button";
import Link from "next/link";
import { ToggleTheme } from "./toogle-theme";
import { GithubIcon } from "../ui/icon";

interface RouteProps {
  href: string;
  label: string;
}

interface FeatureProps {
  title: string;
  description: string;
}

const routeList: RouteProps[] = [
  {
    href: "#benefits",
    label: "Benefits",
  },
  {
    href: "#features",
    label: "Features",
  },
  {
    href: "#pricing",
    label: "Plans",
  },
  {
    href: "#contact",
    label: "Contact",
  },
  {
    href: "#faq",
    label: "FAQ",
  },
];

const featureList: FeatureProps[] = [
  {
    title: "Rust runtime",
    description: "Keep signal, risk, and execution paths fast and bounded.",
  },
  {
    title: "Python research",
    description:
      "Move from backtest ideas to runtime contracts without copy drift.",
  },
  {
    title: "Go observability",
    description:
      "Surface health, metrics, and dashboard events on a clean control plane.",
  },
];

const featureIcons = [Zap, Blocks, Activity];

export const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <header className="shadow-inner bg-opacity-15 w-[90%] md:w-[70%] lg:w-[75%] lg:max-w-screen-xl top-5 mx-auto sticky border border-secondary z-40 rounded-2xl flex justify-between items-center p-2 bg-card/95 backdrop-blur">
      <Link href="/" className="font-bold text-lg flex items-center">
        <ShieldCheck className="bg-gradient-to-tr border-secondary from-primary via-primary/70 to-primary rounded-lg size-9 mr-2 border text-primary-foreground" />
        RustAT
      </Link>
      {/* <!-- Mobile --> */}
      <div className="flex items-center lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Menu
              onClick={() => setIsOpen(!isOpen)}
              className="cursor-pointer lg:hidden"
            />
          </SheetTrigger>

          <SheetContent
            side="left"
            className="flex flex-col justify-between rounded-tr-2xl rounded-br-2xl bg-card border-secondary"
          >
            <div>
              <SheetHeader className="mb-4 ml-4">
                <SheetTitle className="flex items-center">
                  <Link href="/" className="flex items-center">
                    <ShieldCheck className="bg-gradient-to-tr border-secondary from-primary via-primary/70 to-primary rounded-lg size-9 mr-2 border text-primary-foreground" />
                    RustAT
                  </Link>
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-2">
                {routeList.map(({ href, label }) => (
                  <Button
                    key={href}
                    onClick={() => setIsOpen(false)}
                    asChild
                    variant="ghost"
                    className="justify-start text-base"
                  >
                    <Link href={href}>{label}</Link>
                  </Button>
                ))}
              </div>
            </div>

            <SheetFooter className="flex-col sm:flex-col justify-start items-start">
              <Separator className="mb-2" />

              <ToggleTheme />
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* <!-- Desktop --> */}
      <NavigationMenu className="hidden lg:block mx-auto">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-card text-base">
              Features
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-[600px] grid-cols-2 gap-5 p-4">
                <div className="rounded-md border border-secondary bg-muted/60 p-5">
                  <p className="text-sm font-medium text-muted-foreground">
                    Tri-runtime posture
                  </p>
                  <p className="mt-3 text-2xl font-bold leading-tight">
                    Research in Python. Execute in Rust. Observe in Go.
                  </p>
                </div>
                <ul className="flex flex-col gap-2">
                  {featureList.map(({ title, description }, index) => {
                    const FeatureIcon = featureIcons[index];
                    return (
                    <li
                      key={title}
                      className="rounded-md p-3 text-sm hover:bg-muted"
                    >
                      <div className="mb-1 flex items-center gap-2 font-semibold leading-none text-foreground">
                        <FeatureIcon className="size-4 text-primary" />
                        {title}
                      </div>
                      <p className="line-clamp-2 text-muted-foreground">
                        {description}
                      </p>
                    </li>
                    );
                  })}
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            {routeList.map(({ href, label }) => (
              <NavigationMenuLink key={href} asChild>
                <Link href={href} className="text-base px-2">
                  {label}
                </Link>
              </NavigationMenuLink>
            ))}
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="hidden lg:flex">
        <ToggleTheme />

        <Button asChild size="sm" variant="ghost" aria-label="View on GitHub">
          <Link
            aria-label="View on GitHub"
            href="https://github.com/SamoraDC/RustAlgorithmTrading"
            target="_blank"
          >
            <GithubIcon className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
};
