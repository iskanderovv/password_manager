"use client";

import { useCallback, useState } from "react";

import { clearVaultUnlocked, isVaultUnlocked, markVaultUnlocked } from "@/lib/auth/vault-session";

export function useVaultSession() {
  const [unlocked, setUnlocked] = useState(() => isVaultUnlocked());

  const lock = useCallback(() => {
    clearVaultUnlocked();
    setUnlocked(false);
  }, []);

  const unlock = useCallback(() => {
    markVaultUnlocked();
    setUnlocked(true);
  }, []);

  return {
    unlocked,
    lock,
    unlock,
  };
}
