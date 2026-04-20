"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LockForm() {
  const t = useTranslations();

  return (
    <Card className="premium-card">
      <CardHeader>
        <Badge variant="secondary">{t("common.security")}</Badge>
        <CardTitle>{t("lock.unlockButton")}</CardTitle>
        <CardDescription>{t("lock.helper")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="space-y-2 text-sm">
          <span className="text-muted-foreground">{t("lock.masterPasswordLabel")}</span>
          <Input type="password" placeholder={t("lock.masterPasswordPlaceholder")} />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button>{t("lock.unlockButton")}</Button>
          <Button variant="secondary">{t("common.lockNow")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
