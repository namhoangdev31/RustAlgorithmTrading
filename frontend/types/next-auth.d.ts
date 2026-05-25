import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firebaseUid?: string;
      provider?: string;
      userType?: string;
    } & DefaultSession["user"];
  }

  interface User {
    firebaseUid?: string;
    provider?: string | null;
    userType?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    firebaseUid?: string;
    provider?: string;
    userType?: string;
  }
}
