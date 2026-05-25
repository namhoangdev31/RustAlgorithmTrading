"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CardLogin } from "@/components/layout/login";
import ResetPassword from "@/components/layout/reset-password";
import { ToggleTheme } from "@/components/layout/toogle-theme";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode") || "";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4 relative">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ToggleTheme />
      </div>

      {/* Dynamic ambient backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-primary/15 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex justify-center">
        {oobCode ? (
          <ResetPassword onDone={() => router.push("/login")} />
        ) : (
          <CardLogin
            onShowSignup={() => router.push("/register")}
            onLoginSuccess={() => router.push("/dashboard")}
          />
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
