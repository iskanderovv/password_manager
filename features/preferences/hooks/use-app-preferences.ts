"use client";

import { useCallback, useEffect, useState } from "react";

import {
  defaultAppPreferences,
  readAppPreferences,
  writeAppPreferences,
  type AppPreferences,
} from "@/features/preferences/lib/preferences-store";

export function useAppPreferences() {
  const [preferences, setPreferencesState] = useState<AppPreferences>(defaultAppPreferences);

  useEffect(() => {
    setPreferencesState(readAppPreferences());
  }, []);

  const setPreferences = useCallback(
    (updater: AppPreferences | ((current: AppPreferences) => AppPreferences)) => {
      setPreferencesState((current) => {
        const next = typeof updater === "function" ? updater(current) : updater;
        writeAppPreferences(next);
        return next;
      });
    },
    [],
  );

  return {
    preferences,
    setPreferences,
  };
}
