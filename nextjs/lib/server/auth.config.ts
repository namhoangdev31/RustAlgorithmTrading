import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "development-only-auth-secret"),
  trustHost: true,
  providers: [], // Configured with actual providers in auth.ts
} satisfies NextAuthConfig;
