"use client";

import { useTransition } from "react";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useVaultSession } from "@/hooks/use-vault-session";
import { clearActiveVaultKey } from "@/lib/crypto/key-store";

export function LockVaultButton() {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { lock } = useVaultSession();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(() => {
          lock();
          clearActiveVaultKey();
          router.replace("/lock");
          router.refresh();
        });
      }}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 text-sm text-muted-foreground transition hover:text-foreground"
      aria-label={t("lock.unlock.lockVault")}
      disabled={isPending}
    >
      <Lock className="size-4" />
      <span className="hidden sm:inline">
        {isPending ? t("lock.unlock.locking") : t("lock.unlock.lockVault")}
      </span>
    </button>
  );
}
