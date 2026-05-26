"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AppWindow,
  ChevronRight,
  FileWarning,
  HelpCircle,
  Laptop,
  LayoutDashboard,
  ListTodo,
  MessagesSquare,
  Moon,
  SearchIcon,
  Settings,
  ShieldCheck,
  Sun,
  UserCog,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";

import { useSearch } from "@/components/dashboard/search-provider";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type CommandLink = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  parent?: string;
};

const commandLinks: { heading: string; items: CommandLink[] }[] = [
  {
    heading: "General",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
      { title: "Apps", href: "/dashboard/apps", icon: AppWindow },
      { title: "Chats", href: "/dashboard/chats", icon: MessagesSquare },
      { title: "Users", href: "/dashboard/users", icon: Users },
    ],
  },
  {
    heading: "Pages",
    items: [
      { title: "Auth", href: "/login", icon: ShieldCheck, parent: "Sign In" },
      {
        title: "Errors",
        href: "/dashboard/errors/not-found",
        icon: FileWarning,
        parent: "Not Found",
      },
    ],
  },
  {
    heading: "Other",
    items: [
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
      { title: "Account", href: "/dashboard/settings/account", icon: UserCog },
      { title: "Help Center", href: "/dashboard/help-center", icon: HelpCircle },
    ],
  },
];

export function Search({ className }: { className?: string }) {
  const router = useRouter();
  const { open, setOpen } = useSearch();
  const { setTheme } = useTheme();

  function runCommand(command: () => void) {
    setOpen(false);
    command();
  }

  return (
    <>
      <Button
        className={className}
        onClick={() => setOpen(true)}
        type="button"
        variant="outline"
      >
        <SearchIcon data-icon="inline-start" />
        <span className="hidden md:inline-flex">Search</span>
        <kbd className="pointer-events-none ms-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
          {commandLinks.map((group) => (
            <CommandGroup heading={group.heading} key={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => runCommand(() => router.push(item.href))}
                  value={`${group.heading} ${item.title} ${item.parent ?? ""}`}
                >
                  <item.icon data-icon="inline-start" />
                  <span>{item.title}</span>
                  {item.parent ? (
                    <>
                      <ChevronRight className="text-muted-foreground" />
                      <span>{item.parent}</span>
                    </>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Theme">
            {[
              { title: "Light", value: "light", icon: Sun },
              { title: "Dark", value: "dark", icon: Moon },
              { title: "System", value: "system", icon: Laptop },
            ].map((item) => (
              <CommandItem
                key={item.value}
                onSelect={() => runCommand(() => setTheme(item.value))}
                value={`Theme ${item.title}`}
              >
                <item.icon data-icon="inline-start" />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick filters">
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/tasks?status=pending"))
              }
            >
              Pending tasks
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/apps?active=true"))}
            >
              Active integrations
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <Link className="sr-only" href="/dashboard">Dashboard</Link>
    </>
  );
}
