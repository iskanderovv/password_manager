"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { clearVaultUnlocked, isVaultUnlocked } from "@/lib/auth/vault-session";
import { clearActiveVaultKey, getActiveVaultKey, restoreActiveVaultKey } from "@/lib/crypto/key-store";

type UnlockGuardProps = {
  children: React.ReactNode;
};

export function UnlockGuard({ children }: UnlockGuardProps) {
  const t = useTranslations();
  const router = useRouter();
  const [ready, setReady] = useState(() => isVaultUnlocked() && Boolean(getActiveVaultKey()));

  useEffect(() => {
    const unlocked = isVaultUnlocked();
    const keyState = getActiveVaultKey();

    if (!unlocked) {
      clearVaultUnlocked();
      clearActiveVaultKey();
      router.replace("/lock");
      return;
    }

    if (keyState) {
      return;
    }

    let cancelled = false;
    void restoreActiveVaultKey().then((restored) => {
      if (cancelled) return;
      if (restored) {
        setReady(true);
        return;
      }
      clearVaultUnlocked();
      clearActiveVaultKey();
      router.replace("/lock");
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card/85 p-4 text-sm text-muted-foreground">
        {t("lock.unlock.checkingSession")}
      </div>
    );
  }

  return <>{children}</>;
}
