"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface FeatureFlags {
  [key: string]: boolean;
}

interface FeatureFlagContextType {
  flags: FeatureFlags;
  isEnabled: (flagName: string) => boolean;
  setFlag: (flagName: string, value: boolean) => void;
  loading: boolean;
  refreshFlags: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export function FeatureFlagProvider({
  children,
  initialFlags = {},
  projectId,
}: {
  children: ReactNode;
  initialFlags?: FeatureFlags;
  projectId?: string;
}) {
  const [flags, setFlags] = useState<FeatureFlags>(initialFlags);
  const [loading, setLoading] = useState<boolean>(!projectId);

  const refreshFlags = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/projects/${projectId}/feature-flags`);
      if (res.ok) {
        const data = await res.json();
        if (data.flags) {
          setFlags(data.flags);
        }
      }
    } catch (e) {
      console.error("Failed to fetch feature flags:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      refreshFlags();

      // Set up a Server-Sent Events (SSE) connection to sync real-time database changes.
      const eventSource = new EventSource(`/api/v1/projects/${projectId}/feature-flags/stream`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.flags) {
            setFlags(data.flags);
          }
        } catch (e) {
          console.error("Error parsing feature flag stream message:", e);
        }
      };

      eventSource.onerror = (err) => {
        console.warn("Feature flag SSE stream error, falling back to polling/static.", err);
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    }
  }, [projectId]);

  const isEnabled = (flagName: string) => {
    return !!flags[flagName];
  };

  const setFlag = (flagName: string, value: boolean) => {
    setFlags((prev) => ({
      ...prev,
      [flagName]: value,
    }));
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, isEnabled, setFlag, loading, refreshFlags }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlag(flagName: string, fallback = false): boolean {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    return fallback;
  }
  return context.isEnabled(flagName);
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error("useFeatureFlags must be used within a FeatureFlagProvider");
  }
  return context;
}
