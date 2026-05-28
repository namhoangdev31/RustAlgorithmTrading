"use client";

import { useTranslations } from "next-intl";

import { logoutAction } from "@/app/actions/auth";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/firebase/firebase";

type ProfileDropdownProps = {
  user: {
    email: string | null;
    fullName: string | null;
    provider: string;
    photoUrl?: string | null;
  };
};

export function ProfileDropdown({ user }: ProfileDropdownProps) {
  const t = useTranslations("Dashboard.shell");
  const displayName = user.fullName ?? user.email ?? "satnaing";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative size-8 rounded-full" size="icon" variant="ghost">
          <Avatar className="size-8">
            {user.photoUrl ? (
              <AvatarImage
                alt={displayName}
                referrerPolicy="no-referrer"
                src={user.photoUrl}
              />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="sr-only">{t("user_menu.open")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email ?? user.provider}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              {t("user_menu.profile")}
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings/account">
              {t("user_menu.billing")}
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              {t("user_menu.account")}
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>{t("user_menu.new_team")}</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={logoutAction}>
            <button
              className="flex w-full items-center text-destructive"
              type="submit"
              onClick={async () => {
                try {
                  await firebaseSignOut(auth);
                } catch (e) {
                  console.error("Firebase signout error:", e);
                }
              }}
            >
              {t("user_menu.sign_out")}
              <DropdownMenuShortcut className="text-current">
                ⇧⌘Q
              </DropdownMenuShortcut>
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
