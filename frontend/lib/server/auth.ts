import NextAuth from "next-auth";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import {
  lookupFirebaseUser,
  signInFirebaseWithIdentityProvider,
  signInFirebaseWithPassword,
  type FirebaseAuthUser,
} from "@/lib/server/firebase-auth";
import { prisma } from "@/lib/server/prisma";

function readCredential(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function splitDisplayName(displayName?: string) {
  const parts = displayName?.trim().split(/\s+/).filter(Boolean) ?? [];

  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
    fullName: displayName?.trim() || undefined,
  };
}

async function syncFirebaseUser(
  firebaseUser: FirebaseAuthUser,
  fallback: {
    email?: string | null;
    name?: string | null;
    provider?: string | null;
  } = {}
) {
  const email = (firebaseUser.email ?? fallback.email)?.toLowerCase();
  const displayName = firebaseUser.displayName ?? fallback.name ?? undefined;
  const names = splitDisplayName(displayName);
  const now = new Date();
  const provider = fallback.provider ?? firebaseUser.providerId ?? "firebase";

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { socialId: firebaseUser.localId },
        ...(email ? [{ email }] : []),
      ],
    },
  });

  if (existing) {
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        email: email ?? existing.email,
        provider: existing.provider || provider,
        socialId: firebaseUser.localId,
        firstName: names.firstName ?? existing.firstName,
        lastName: names.lastName ?? existing.lastName,
        fullName: names.fullName ?? existing.fullName,
        registerType: existing.registerType ?? provider,
        updatedAt: now,
      },
    });

    return user;
  }

  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email,
      provider,
      socialId: firebaseUser.localId,
      firstName: names.firstName,
      lastName: names.lastName,
      fullName: names.fullName,
      registerType: provider,
      createdAt: now,
      updatedAt: now,
    },
  });

  return user;
}

function getFirebaseProviderId(provider?: string) {
  switch (provider) {
    case "google":
      return "google.com";
    case "github":
      return "github.com";
    case "apple":
      return "apple.com";
    default:
      return null;
  }
}

async function syncOAuthUser({
  account,
  user,
}: {
  account: {
    provider?: string;
    id_token?: string;
    access_token?: string;
  };
  user: {
    email?: string | null;
    name?: string | null;
  };
}) {
  const providerId = getFirebaseProviderId(account.provider);

  if (!providerId) {
    return null;
  }

  const firebaseUser = await signInFirebaseWithIdentityProvider({
    providerId,
    idToken: account.id_token,
    accessToken: account.access_token,
  });

  return syncFirebaseUser(firebaseUser, {
    email: user.email,
    name: user.name,
    provider: account.provider,
  });
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
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
  providers: [
    Credentials({
      name: "Firebase",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        idToken: { label: "Firebase ID token", type: "text" },
      },
      async authorize(credentials) {
        const idToken = readCredential(credentials?.idToken);
        const email = readCredential(credentials?.email);
        const password = readCredential(credentials?.password);

        const firebaseUser = idToken
          ? await lookupFirebaseUser(idToken)
          : await signInFirebaseWithPassword(email, password);

        const user = await syncFirebaseUser(firebaseUser);

        return {
          id: user.id,
          email: user.email,
          name: user.fullName ?? user.email,
          firebaseUid: firebaseUser.localId,
          provider: user.provider,
          userType: user.userType,
        };
      },
    }),
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      allowDangerousEmailAccountLinking: true,
    }),
    Apple({
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && account.provider !== "credentials" && user) {
        const syncedUser = await syncOAuthUser({ account, user });

        if (syncedUser) {
          token.sub = syncedUser.id;
          token.firebaseUid = syncedUser.socialId ?? undefined;
          token.provider = syncedUser.provider;
          token.userType = syncedUser.userType;
        }
      } else if (user) {
        token.sub = user.id;
        token.firebaseUid = user.firebaseUid;
        token.provider = user.provider ?? undefined;
        token.userType = user.userType ?? undefined;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.firebaseUid =
          typeof token.firebaseUid === "string" ? token.firebaseUid : undefined;
        session.user.provider =
          typeof token.provider === "string" ? token.provider : undefined;
        session.user.userType =
          typeof token.userType === "string" ? token.userType : undefined;
      }

      return session;
    },
  },
});
