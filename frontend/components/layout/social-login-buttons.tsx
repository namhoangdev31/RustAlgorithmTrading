
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, githubProvider, appleProvider } from "@/firebase/firebase";
import { loginWithFirebaseIdTokenAction } from "@/app/actions/auth";

type SocialLoginButtonsProps = {
  action?: (formData: FormData) => Promise<void>;
  showApple?: boolean;
};

const providers = [
  {
    id: "google",
    label: "Google",
    icon: <i className="fi fi-brands-google text-sm"></i>,
  },
  {
    id: "github",
    label: "GitHub",
    icon: <i className="fi fi-brands-github text-sm"></i>,
  },
];

export function SocialLoginButtons({
  showApple = false,
}: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const visibleProviders = showApple
    ? [
      ...providers,
      {
        id: "apple",
        label: "Apple",
        icon: <i className="fi fi-brands-apple text-sm"></i>,
      },
    ]
    : providers;

  const handleSocialLogin = async (providerId: string) => {
    setLoadingProvider(providerId);
    try {
      let provider;
      if (providerId === "google") {
        provider = googleProvider;
      } else if (providerId === "github") {
        provider = githubProvider;
      } else if (providerId === "apple") {
        provider = appleProvider;
      } else {
        throw new Error("Unsupported provider");
      }

      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      await loginWithFirebaseIdTokenAction(idToken);
    } catch (err: any) {
      if (err.message === "NEXT_REDIRECT" || err.message?.includes("NEXT_REDIRECT") || err.digest === "NEXT_REDIRECT") {
        throw err;
      }
      console.error(`${providerId} login error:`, err);
      const msg = err.message || "Social login failed.";
      window.location.href = `/login?error=${encodeURIComponent(msg)}`;
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div
      className={
        showApple ? "grid w-full grid-cols-3 gap-2" : "grid w-full grid-cols-2 gap-2"
      }
    >
      {visibleProviders.map((provider) => (
        <Button
          key={provider.id}
          className="w-full flex items-center justify-center gap-2"
          variant="outline"
          disabled={loadingProvider !== null}
          onClick={() => handleSocialLogin(provider.id)}
        >
          {loadingProvider === provider.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            provider.icon
          )}
          {provider.label}
        </Button>
      ))}
    </div>
  );
}

