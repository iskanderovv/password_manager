"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { PasswordStrength } from "@/lib/auth/password-policy";

type PasswordStrengthProps = {
  strength: PasswordStrength;
};

const levelStyles: Record<number, string> = {
  0: "bg-rose-500/40",
  1: "bg-rose-500",
  2: "bg-amber-500",
  3: "bg-emerald-500",
  4: "bg-emerald-500",
};

export function PasswordStrengthMeter({ strength }: PasswordStrengthProps) {
  const t = useTranslations();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{t("lock.create.strengthLabel")}</p>
        <p className="text-xs font-medium">{t(strength.labelKey)}</p>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              "h-1.5 rounded-full bg-muted transition-all duration-300",
              step <= strength.score && levelStyles[strength.score],
            )}
          />
        ))}
      </div>

      <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        <p className={cn(strength.checks.length && "text-emerald-600 dark:text-emerald-300")}>
          {t("lock.create.rules.length")}
        </p>
        <p className={cn(strength.checks.mixedCase && "text-emerald-600 dark:text-emerald-300")}>
          {t("lock.create.rules.mixedCase")}
        </p>
        <p className={cn(strength.checks.number && "text-emerald-600 dark:text-emerald-300")}>
          {t("lock.create.rules.number")}
        </p>
        <p className={cn(strength.checks.symbol && "text-emerald-600 dark:text-emerald-300")}>
          {t("lock.create.rules.symbol")}
        </p>
      </div>
    </div>
  );
}
