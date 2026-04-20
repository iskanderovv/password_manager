import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { SettingsDashboard } from "@/features/settings/components/settings-dashboard";
import { getVaultOverviewPayload, getActiveVaultMeta } from "@/features/vault/lib/server-vault";

export default async function SettingsPage() {
  const t = await getTranslations();
  const [payload, vaultMeta] = await Promise.all([getVaultOverviewPayload(), getActiveVaultMeta()]);

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <SettingsDashboard payload={payload} vaultMeta={vaultMeta} />
    </div>
  );
}
