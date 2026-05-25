"use client";

import React from "react";
import { ReCaptchaProvider } from "next-recaptcha-v3";

export function RecaptchaProvider({ children }: { children: React.ReactNode }) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  return (
    <ReCaptchaProvider reCaptchaKey={siteKey}>
      {children}
    </ReCaptchaProvider>
  );
}
