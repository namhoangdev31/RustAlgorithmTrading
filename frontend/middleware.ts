import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames, avoiding API and static files
  matcher: ["/", "/(en|vi)/:path*"],
};
