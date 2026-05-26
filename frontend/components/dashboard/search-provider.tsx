"use client";

import * as React from "react";

type SearchContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SearchContext = React.createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <SearchContext.Provider value={{ open, setOpen }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = React.useContext(SearchContext);

  if (!context) {
    throw new Error("useSearch must be used within SearchProvider.");
  }

  return context;
}

