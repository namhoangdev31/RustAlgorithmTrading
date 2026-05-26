"use client";

import * as React from "react";

type SidebarVariant = "inset" | "floating" | "sidebar";
type SidebarCollapsible = "icon" | "offcanvas";
type Direction = "ltr" | "rtl";

type LayoutPreferencesContextValue = {
  variant: SidebarVariant;
  setVariant: (variant: SidebarVariant) => void;
  collapsible: SidebarCollapsible;
  setCollapsible: (collapsible: SidebarCollapsible) => void;
  direction: Direction;
  setDirection: (direction: Direction) => void;
  resetLayout: () => void;
};

const LayoutPreferencesContext =
  React.createContext<LayoutPreferencesContextValue | null>(null);

export function LayoutPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [variant, setVariant] = React.useState<SidebarVariant>("sidebar");
  const [collapsible, setCollapsible] =
    React.useState<SidebarCollapsible>("icon");
  const [direction, setDirectionState] = React.useState<Direction>("ltr");

  const setDirection = React.useCallback((nextDirection: Direction) => {
    setDirectionState(nextDirection);
    document.documentElement.dir = nextDirection;
  }, []);

  const resetLayout = React.useCallback(() => {
    setVariant("sidebar");
    setCollapsible("icon");
    setDirection("ltr");
  }, [setDirection]);

  const value = React.useMemo(
    () => ({
      variant,
      setVariant,
      collapsible,
      setCollapsible,
      direction,
      setDirection,
      resetLayout,
    }),
    [collapsible, direction, resetLayout, setDirection, variant]
  );

  return (
    <LayoutPreferencesContext.Provider value={value}>
      {children}
    </LayoutPreferencesContext.Provider>
  );
}

export function useLayoutPreferences() {
  const context = React.useContext(LayoutPreferencesContext);

  if (!context) {
    throw new Error(
      "useLayoutPreferences must be used within LayoutPreferencesProvider."
    );
  }

  return context;
}
