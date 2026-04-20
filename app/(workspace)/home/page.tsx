import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { HomeOverview } from "@/features/home/components/home-overview";
import { getActiveVaultMeta, getVaultOverviewPayload } from "@/features/vault/lib/server-vault";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default async function HomePage() {
  const t = await getTranslations();
  const [payload, vaultMeta] = await Promise.all([getVaultOverviewPayload(), getActiveVaultMeta()]);

  const now = new Date();
  const totalCredentials = payload.credentials.length;
  const totalTags = payload.availableTags.length;
  const weakCredentials = payload.credentials.filter((item) => (item.passwordStrengthScore ?? 3) <= 2).length;
  const missingUrl = payload.credentials.filter((item) => !item.serviceUrl).length;
  const updatedToday = payload.credentials.filter((item) => isSameDay(new Date(item.updatedAt), now)).length;

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title={t("home.title")} subtitle={t("home.subtitle")} />
      <HomeOverview
        metrics={{ totalCredentials, totalTags, weakCredentials, missingUrl, updatedToday }}
        vaultName={vaultMeta?.name ?? null}
      />
    </div>
  );
}
