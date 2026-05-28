import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToggleThemeProps {
  className?: string;
  showLabel?: boolean;
}

export const ToggleTheme = ({ className, showLabel = true }: ToggleThemeProps) => {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      size="sm"
      variant="ghost"
      className={cn("w-full justify-start", className)}
    >
      <div className="flex items-center gap-2 dark:hidden">
        <Moon className="size-5" />
        {showLabel && <span className="block lg:hidden">Dark</span>}
      </div>

      <div className="dark:flex items-center gap-2 hidden">
        <Sun className="size-5" />
        {showLabel && <span className="block lg:hidden">Light</span>}
      </div>

      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

