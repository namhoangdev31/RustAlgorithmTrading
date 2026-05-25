"use client";

import { useEffect, useState, useTransition } from "react";
import { Apple } from "lucide-react";
import { signInWithPopup, type AuthProvider } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/ui/icon";
import { appleProvider, auth, githubProvider, googleProvider } from "@/firebase/firebase";

type SocialProvider = "google" | "github" | "apple";

type SocialLoginButtonsProps = {
  action: (idToken: string) => Promise<void>;
};

const providers: Record<SocialProvider, AuthProvider> = {
  google: googleProvider,
  github: githubProvider,
  apple: appleProvider,
};

function isMacOSDevice() {
  const platform = navigator.platform || "";
  const userAgent = navigator.userAgent || "";

  return /Mac/.test(platform) || /Mac OS X/.test(userAgent);
}

export function SocialLoginButtons({ action }: SocialLoginButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showApple, setShowApple] = useState(false);

  useEffect(() => {
    setShowApple(isMacOSDevice());
  }, []);

  function login(provider: SocialProvider) {
    setError("");

    startTransition(async () => {
      try {
        const credential = await signInWithPopup(auth, providers[provider]);
        const idToken = await credential.user.getIdToken();
        await action(idToken);
      } catch (err) {
        setError((err as Error)?.message || "Social login failed.");
      }
    });
  }

  return (
    <div className="grid w-full gap-2">
      <div className={showApple ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-2"}>
        <Button
          type="button"
          variant="outline"
          className="bg-white text-slate-900 border-gray-300"
          onClick={() => login("google")}
          disabled={isPending}
        >
          <span className="flex size-4 items-center justify-center rounded-full border text-xs font-semibold">
            G
          </span>
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="bg-white text-slate-900 border-gray-300"
          onClick={() => login("github")}
          disabled={isPending}
        >
          <GithubIcon className="size-4" />
          GitHub
        </Button>
        {showApple ? (
          <Button
            type="button"
            variant="outline"
            className="bg-white text-slate-900 border-gray-300"
            onClick={() => login("apple")}
            disabled={isPending}
          >
            <Apple className="size-4" />
            Apple
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
