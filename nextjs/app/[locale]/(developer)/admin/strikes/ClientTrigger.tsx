"use client";

import { Button } from "@/components/ui/button";
import { globalActionsRef } from "./StrikeActions";

interface ClientTriggerProps {
  action: "triage" | "revoke";
  id: string;
}

export function ClientTrigger({ action, id }: ClientTriggerProps) {
  const handleClick = () => {
    if (action === "triage") {
      globalActionsRef.current?.openTriage(id);
    } else {
      globalActionsRef.current?.openRevoke(id);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-6 text-[10px] px-2 font-medium cursor-pointer ${
        action === "triage"
          ? "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50"
          : "text-amber-600 hover:text-amber-700 hover:bg-amber-50/50"
      }`}
      onClick={handleClick}
    >
      {action === "triage" ? "Triage" : "Revoke"}
    </Button>
  );
}
