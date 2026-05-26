"use client";
import {
  Activity,
  Blocks,
  LogIn,
  Menu,
  ShieldCheck,
  Zap,
} from "lucide-react";
import React from "react";
import Image from "next/image";
import logoImg from "@/app/logo_nonbg.png";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import { Button } from "../ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface RouteProps {
  href: string;
  label: string;
}

interface FeatureProps {
  title: string;
  description: string;
}

const featureIcons = [Zap, Blocks, Activity];

export const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const t = useTranslations("Navbar");

  const routeList: RouteProps[] = [
    {
      href: "#benefits",
      label: t("route_benefits"),
    },
    {
      href: "#features",
      label: t("route_features"),
    },
    {
      href: "#pricing",
      label: t("route_pricing"),
    },
    {
      href: "/roadmap",
      label: t("route_roadmap"),
    },
    {
      href: "/docs",
      label: t("route_docs"),
    },
    {
      href: "#faq",
      label: t("route_faq"),
    },
  ];

  const featureList: FeatureProps[] = [
    {
      title: t("rust_title"),
      description: t("rust_desc"),
    },
    {
      title: t("python_title"),
      description: t("python_desc"),
    },
    {
      title: t("go_title"),
      description: t("go_desc"),
    },
  ];

  return (
    <header className="shadow-inner bg-opacity-15 w-[90%] md:w-[70%] lg:w-[75%] lg:max-w-screen-xl top-5 mx-auto sticky border border-secondary z-40 rounded-2xl flex justify-between items-center p-2 bg-card/95 backdrop-blur">
      <Link href="/" className="font-bold text-lg flex items-center">
        <Image
          src={logoImg}
          alt="Lepos Logo"
          width={36}
          height={36}
          className="mr-2 object-contain"
        />
        {t("logo")}
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
                    <Image
                      src={logoImg}
                      alt="Lepos Logo"
                      width={36}
                      height={36}
                      className="mr-2 object-contain"
                    />
                    {t("logo")}
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
          </SheetContent>
        </Sheet>
      </div>

      {/* <!-- Desktop --> */}
      <NavigationMenu className="hidden lg:block mx-auto">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-card text-base">
              {t("features_trigger")}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-[600px] grid-cols-2 gap-5 p-4">
                <div className="rounded-md border border-secondary bg-muted/60 p-5">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("features_label")}
                  </p>
                  <p className="mt-3 text-2xl font-bold leading-tight">
                    {t("features_tagline")}
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
        <Button asChild size="sm" variant="ghost" aria-label="Login to Platform">
          <Link
            aria-label="Login to Platform"
            href="/login"
          >
            <LogIn className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
};
