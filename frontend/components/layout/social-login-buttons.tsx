import { Apple } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/ui/icon";

type SocialLoginButtonsProps = {
  action: (formData: FormData) => Promise<void>;
  showApple?: boolean;
};

const providers = [
  {
    id: "google",
    label: "Google",
    icon: (
      <span className="flex size-4 items-center justify-center rounded-full border text-xs font-semibold">
        G
      </span>
    ),
  },
  {
    id: "github",
    label: "GitHub",
    icon: <GithubIcon data-icon="inline-start" />,
  },
];

export function SocialLoginButtons({
  action,
  showApple = false,
}: SocialLoginButtonsProps) {
  const visibleProviders = showApple
    ? [
        ...providers,
        {
          id: "apple",
          label: "Apple",
          icon: <Apple data-icon="inline-start" />,
        },
      ]
    : providers;

  return (
    <div
      className={
        showApple ? "grid w-full grid-cols-3 gap-2" : "grid w-full grid-cols-2 gap-2"
      }
    >
      {visibleProviders.map((provider) => (
        <form action={action} key={provider.id}>
          <input type="hidden" name="provider" value={provider.id} />
          <Button className="w-full" type="submit" variant="outline">
            {provider.icon}
            {provider.label}
          </Button>
        </form>
      ))}
    </div>
  );
}

