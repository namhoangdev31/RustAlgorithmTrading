"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Signup from "@/components/layout/signup";
import { ToggleTheme } from "@/components/layout/toogle-theme";

export default function RegisterPage() {
  const router = useRouter();

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
        <Signup onBack={() => router.push("/login")} />
      </div>
    </div>
  );
}