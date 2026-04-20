"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Circle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PasswordStrength } from "@/lib/auth/password-policy";

type PasswordStrengthProps = {
  strength: PasswordStrength;
};

const levelStyles: Record<number, string> = {
  0: "bg-rose-500/30",
  1: "bg-rose-500",
  2: "bg-amber-500",
  3: "bg-emerald-500",
  4: "bg-emerald-500",
};

export function PasswordStrengthMeter({ strength }: PasswordStrengthProps) {
  const t = useTranslations();

  const rules = [
    { key: "length", met: strength.checks.length, label: t("lock.create.rules.length") },
    { key: "mixedCase", met: strength.checks.mixedCase, label: t("lock.create.rules.mixedCase") },
    { key: "number", met: strength.checks.number, label: t("lock.create.rules.number") },
    { key: "symbol", met: strength.checks.symbol, label: t("lock.create.rules.symbol") },
  ];

  return (
    <div className="space-y-3 rounded-xl border border-border/40 bg-muted/20 p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
          {t("lock.create.strengthLabel")}
        </p>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight",
          strength.score >= 3 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
        )}>
          {t(strength.labelKey)}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              "h-1.5 rounded-full bg-muted/50 transition-all duration-500",
              step <= strength.score && levelStyles[strength.score],
            )}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
        {rules.map((rule) => (
          <div key={rule.key} className="flex items-center gap-1.5">
            {rule.met ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            ) : (
              <Circle className="h-3 w-3 text-muted-foreground/40" />
            )}
            <span className={cn(
              "text-[11px] transition-colors duration-300",
              rule.met ? "font-medium text-foreground/80" : "text-muted-foreground/60"
            )}>
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
