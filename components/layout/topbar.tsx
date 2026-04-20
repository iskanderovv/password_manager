"use client";

import { useEffect, useState } from "react";
import { Command, Search } from "lucide-react";
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-55 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            readOnly
            className="h-10 w-full rounded-xl border border-border/70 bg-card/70 pl-10 pr-28 text-sm text-muted-foreground outline-none"
            value={t("common.searchPlaceholder")}
            aria-label={t("topbar.quickSearch")}
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-border/80 px-2 py-0.5 text-xs text-muted-foreground">
            {t("topbar.commandHint")}
          </span>
        </div>

        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 text-sm text-muted-foreground"
        >
          <Command className="size-4" />
          <span className="hidden sm:inline">{t("common.comingSoon")}</span>
        </button>

        <LocaleSwitcher />
        <ThemeToggle />
        <LockVaultButton />

        <div className="ml-auto flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-2 py-1.5 sm:ml-0">
          <Avatar name={t("common.placeholderUser")} />
          <div className="hidden pr-2 sm:block">
            <p className="text-sm font-medium">{t("common.placeholderUser")}</p>
            <p className="text-xs text-muted-foreground">{t("common.placeholderTeam")}</p>
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
      </div>
    </header>
  );
}
