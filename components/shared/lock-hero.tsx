"use client";

import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { lockTrustCueKeys } from "@/features/lock/trust-cues";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function LockHero() {
  const t = useTranslations();

  return (
    <Card className="premium-card relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-success/10" />
      <CardContent className="relative space-y-4 py-8">
        <div className="flex items-center gap-2">
          <Badge>{t("lock.eyebrow")}</Badge>
          <Badge variant="secondary">{t("common.appTagline")}</Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">{t("lock.title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">{t("lock.subtitle")}</p>

        <div className="grid gap-2 pt-1 sm:grid-cols-3">
          {lockTrustCueKeys.map((key, index) => (
            <div key={key} className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 py-2">
              {index === 0 ? (
                <ShieldCheck className="size-4 text-primary" />
              ) : index === 1 ? (
                <LockKeyhole className="size-4 text-primary" />
              ) : (
                <Sparkles className="size-4 text-primary" />
              )}
              <span className="text-xs text-muted-foreground">{t(key)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
