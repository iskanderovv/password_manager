"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useVaultSession } from "@/hooks/use-vault-session";
import { useAppPreferences } from "@/features/preferences/hooks/use-app-preferences";
import { getAutoLockDelayMs } from "@/features/preferences/lib/preferences-store";
import { useToast } from "@/components/ui/toast-provider";
import { clearVaultUnlocked, isVaultUnlocked } from "@/lib/auth/vault-session";
import { clearActiveVaultKey, getActiveVaultKey } from "@/lib/crypto/key-store";

function useStableLock() {
  const router = useRouter();
  const { lock } = useVaultSession();
  const { notify } = useToast();
  const t = useTranslations();

  return useCallback(() => {
    if (!isVaultUnlocked()) return;

    lock();
    clearVaultUnlocked();
    clearActiveVaultKey();
    notify({
      message: t("settings.security.autoLock.lockedToast"),
      variant: "info",
    });
    router.replace("/lock");
  }, [lock, notify, router, t]);
}

export function AutoLockManager() {
  const { preferences } = useAppPreferences();
  const lockVaultNow = useStableLock();
  const timeoutRef = useRef<number | null>(null);
  const mode = preferences.autoLockMode;

  useEffect(() => {
    if (!isVaultUnlocked() || !getActiveVaultKey()) {
      return;
    }

    const clearTimer = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const delay = getAutoLockDelayMs(mode);
    const resetTimer = () => {
      clearTimer();

      if (!delay) return;
      timeoutRef.current = window.setTimeout(() => {
        lockVaultNow();
      }, delay);
    };

    const onActivity = () => resetTimer();
    const onBeforeUnload = () => {
      if (mode === "on-close") {
        clearVaultUnlocked();
        clearActiveVaultKey();
      }
    };

    if (mode === "5m" || mode === "15m" || mode === "30m") {
      resetTimer();
      window.addEventListener("mousemove", onActivity);
      window.addEventListener("keydown", onActivity);
      window.addEventListener("click", onActivity);
      window.addEventListener("scroll", onActivity);
      window.addEventListener("touchstart", onActivity);
      window.addEventListener("visibilitychange", onActivity);
    }

    if (mode === "on-close") {
      window.addEventListener("beforeunload", onBeforeUnload);
    }

    return () => {
      clearTimer();
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("click", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("visibilitychange", onActivity);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [lockVaultNow, mode]);

  return null;
}
