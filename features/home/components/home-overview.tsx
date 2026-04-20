"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppPreferences } from "@/features/preferences/hooks/use-app-preferences";
import { getLastUnlockedAt } from "@/lib/auth/vault-session";

type HomeOverviewMetrics = {
  totalCredentials: number;
  totalTags: number;
  weakCredentials: number;
  missingUrl: number;
  updatedToday: number;
};

type HomeOverviewProps = {
  metrics: HomeOverviewMetrics;
};

export function HomeOverview({ metrics }: HomeOverviewProps) {
  const t = useTranslations();
  const { preferences } = useAppPreferences();
  const [lastUnlockedAt, setLastUnlockedAt] = useState<string | null>(null);

  useEffect(() => {
    setLastUnlockedAt(getLastUnlockedAt());
  }, []);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="premium-card">
          <CardContent className="space-y-1 py-4">
            <p className="text-xs text-muted-foreground">{t("home.metrics.totalCredentials")}</p>
            <p className="text-2xl font-semibold">{metrics.totalCredentials}</p>
          </CardContent>
        </Card>
        <Card className="premium-card">
          <CardContent className="space-y-1 py-4">
            <p className="text-xs text-muted-foreground">{t("home.metrics.totalTags")}</p>
            <p className="text-2xl font-semibold">{metrics.totalTags}</p>
          </CardContent>
        </Card>
        <Card className="premium-card">
          <CardContent className="space-y-1 py-4">
            <p className="text-xs text-muted-foreground">{t("home.metrics.weakCredentials")}</p>
            <p className="text-2xl font-semibold">{metrics.weakCredentials}</p>
          </CardContent>
        </Card>
        <Card className="premium-card">
          <CardContent className="space-y-1 py-4">
            <p className="text-xs text-muted-foreground">{t("home.metrics.missingUrl")}</p>
            <p className="text-2xl font-semibold">{metrics.missingUrl}</p>
          </CardContent>
        </Card>
        <Card className="premium-card">
          <CardContent className="space-y-1 py-4">
            <p className="text-xs text-muted-foreground">{t("home.metrics.updatedToday")}</p>
            <p className="text-2xl font-semibold">{metrics.updatedToday}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-base">{t("home.session.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/70 px-3 py-2">
              <Avatar name={t("common.placeholderUser")} />
              <div>
                <p className="text-sm font-medium">{t("common.placeholderUser")}</p>
                <p className="text-xs text-muted-foreground">{t("common.placeholderTeam")}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-sm text-muted-foreground">
              {lastUnlockedAt
                ? t("topbar.lastUnlocked", { value: new Date(lastUnlockedAt).toLocaleTimeString() })
                : t("topbar.noUnlockYet")}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="success">{t("topbar.vaultEncrypted")}</Badge>
              <Badge variant="secondary">{t("topbar.noPlainText")}</Badge>
              <Badge variant={preferences.autoLockMode === "manual" ? "secondary" : "warning"}>
                {preferences.autoLockMode === "manual" ? t("topbar.autoLockManual") : t("topbar.autoLockEnabled")}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
