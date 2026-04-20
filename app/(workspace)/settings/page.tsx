import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { SettingsCard } from "@/components/shared/settings-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { preferenceSettingKeys, securitySettingKeys, workspaceSettingKeys } from "@/features/settings/blueprints";

export default async function SettingsPage() {
  const t = await getTranslations();

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className="grid gap-6 xl:grid-cols-3">
        <SettingsCard
          title={t("settings.sections.workspace")}
          items={workspaceSettingKeys.map((key) => t(key))}
          badgeLabel={t("common.planned")}
        />
        <SettingsCard
          title={t("settings.sections.security")}
          items={securitySettingKeys.map((key) => t(key))}
          badgeLabel={t("common.planned")}
        />
        <SettingsCard
          title={t("settings.sections.preferences")}
          items={preferenceSettingKeys.map((key) => t(key))}
          badgeLabel={t("common.planned")}
        />
      </div>

      <Card className="premium-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
          <p className="text-sm text-muted-foreground">{t("common.uiScaffold")}</p>
          <Badge variant="secondary">{t("common.planned")}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
