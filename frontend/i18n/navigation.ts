import { createNavigation } from "next-intl/navigation";
import { getLocale } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import type { RedirectType } from "next/navigation";

import { routing } from "./routing";

// Locale-aware client-side navigation hooks and Link component
const {
  Link,
  redirect: intlRedirect,
  usePathname,
  useRouter,
} = createNavigation(routing);

export { Link, usePathname, useRouter };

/**
 * Builds a locale-prefixed path for use in server actions.
 * Call this before redirect() to get the full locale URL:
 *
 *   const url = await localizedHref("/dashboard");
 *   redirect(url); // synchronous, TypeScript infers never
 */
export async function localizedHref(href: string): Promise<string> {
  const locale = await getLocale();
  const localePrefix = `/${locale}`;
  if (href.startsWith(localePrefix)) return href;
  return `${localePrefix}${href.startsWith("/") ? href : `/${href}`}`;
}

/**
 * Synchronous locale-aware redirect for use in server actions.
 * Pass a path that already has a locale prefix (e.g. from useNativePathname()
 * or from localizedHref()). Returns `never` so TypeScript narrows correctly.
 *
 * For paths without locale prefix, call `await localizedHref(path)` first:
 *   redirect(await localizedHref("/dashboard"));
 */
export function redirect(href: string, type?: RedirectType): never {
  nextRedirect(href, type);
}

/**
 * Low-level locale-aware redirect from createNavigation (requires { href, locale }).
 * Use redirect() above instead for server actions.
 */
export { intlRedirect };
