"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { LockVaultButton } from "@/features/auth/components/lock-vault-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAppPreferences } from "@/features/preferences/hooks/use-app-preferences";
import { getLastUnlockedAt } from "@/lib/auth/vault-session";

import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  const t = useTranslations();
  const { preferences } = useAppPreferences();
  const [lastUnlockedAt, setLastUnlockedAt] = useState<string | null>(null);

  useEffect(() => {
    setLastUnlockedAt(getLastUnlockedAt());
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/85 px-4 py-3 backdrop-blur lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-2 py-1.5">
          <Avatar name={t("common.placeholderUser")} />
          <div className="hidden pr-2 sm:block">
            <p className="text-sm font-medium">{t("common.placeholderUser")}</p>
          </div>
          <div className="hidden flex-col gap-0.5 pr-1 lg:flex">
            <span className="text-[11px] text-muted-foreground">
              {lastUnlockedAt
                ? t("topbar.lastUnlocked", { value: new Date(lastUnlockedAt).toLocaleTimeString() })
                : t("topbar.noUnlockYet")}
            </span>
          </div>
          <Badge variant="success">{t("topbar.vaultEncrypted")}</Badge>
          <Badge variant="secondary" className="hidden xl:inline-flex">
            {t("topbar.noPlainText")}
          </Badge>
          <Badge variant={preferences.autoLockMode === "manual" ? "secondary" : "warning"}>
            {preferences.autoLockMode === "manual"
              ? t("topbar.autoLockManual")
              : t("topbar.autoLockEnabled")}
          </Badge>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <LockVaultButton />
        </div>
      </div>
    </header>
  );
}
