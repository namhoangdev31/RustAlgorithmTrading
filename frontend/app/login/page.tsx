import React from "react";
import { headers } from "next/headers";
import { CardLogin } from "@/components/layout/login";
import ResetPassword from "@/components/layout/reset-password";
import {
  confirmPasswordResetAction,
  loginWithEmailAction,
  loginWithOAuthAction,
  requestPasswordResetAction,
} from "@/app/actions/auth";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    info?: string;
    oobCode?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const headerStore = await headers();
  const error = params.error;
  const info = params.info;
  const oobCode = params.oobCode || "";
  const showApple = /Macintosh|Mac OS X/.test(headerStore.get("user-agent") ?? "");

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-primary/15 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex justify-center">
        {oobCode ? (
          <ResetPassword
            action={confirmPasswordResetAction}
            oobCode={oobCode}
            error={error}
            info={info}
          />
        ) : (
          <CardLogin
            loginAction={loginWithEmailAction}
            socialLoginAction={loginWithOAuthAction}
            resetAction={requestPasswordResetAction}
            showApple={showApple}
            error={error}
            info={info}
          />
        )}
      </div>
    </div>
  );
}
