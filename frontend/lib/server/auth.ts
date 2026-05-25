import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import {
  lookupFirebaseUser,
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

async function syncFirebaseUser(firebaseUser: FirebaseAuthUser) {
  const email = firebaseUser.email?.toLowerCase();
  const names = splitDisplayName(firebaseUser.displayName);
  const now = new Date();
  const provider = firebaseUser.providerId ?? "firebase";

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { socialId: firebaseUser.localId },
        ...(email ? [{ email }] : []),
      ],
    },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        email,
        provider: existing.provider || provider,
        socialId: firebaseUser.localId,
        firstName: names.firstName ?? existing.firstName,
        lastName: names.lastName ?? existing.lastName,
        fullName: names.fullName ?? existing.fullName,
        registerType: existing.registerType ?? provider,
        updatedAt: now,
      },
    });
  }

  return prisma.user.create({
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
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.firebaseUid = user.firebaseUid;
        token.provider = user.provider;
        token.userType = user.userType;
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
