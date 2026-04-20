"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { clearVaultOnRefreshOrClose, clearVaultUnlocked, isVaultUnlocked, lockIfPageReloaded } from "@/lib/auth/vault-session";
import { clearActiveVaultKey, getActiveVaultKey } from "@/lib/crypto/key-store";

type UnlockGuardProps = {
  children: React.ReactNode;
};

export function UnlockGuard({ children }: UnlockGuardProps) {
  const t = useTranslations();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    lockIfPageReloaded();

    const unlocked = isVaultUnlocked();
    const keyState = getActiveVaultKey();

    if (!unlocked || !keyState) {
      clearVaultUnlocked();
      clearActiveVaultKey();
      router.replace("/lock");
      return;
    }

    const cleanup = clearVaultOnRefreshOrClose();
    setReady(true);

    return cleanup;
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
