import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { FilterChips } from "@/components/shared/filter-chips";
import { InsightGrid } from "@/components/shared/insight-grid";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { vaultFilterBlueprints, vaultInsightBlueprints, vaultMetricBlueprints } from "@/features/vault/blueprints";

export default async function VaultPage() {
  const t = await getTranslations();

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title={t("vault.title")}
        subtitle={t("vault.subtitle")}
        action={
          <Button asChild>
            <Link href="/vault/new">{t("vault.addCredential")}</Link>
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {vaultMetricBlueprints.map((item) => (
          <MetricCard key={item.key} title={t(item.key)} value={item.value} delta={item.delta} />
        ))}
      </section>

      <section className="space-y-3">
        <FilterChips filters={vaultFilterBlueprints.map((item) => t(item.key))} />
        <Card className="premium-card">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>{t("vault.credentialsTitle")}</CardTitle>
            <Badge variant="secondary">{t("common.planned")}</Badge>
          </CardHeader>
          <CardContent>
            <EmptyState
              title={t("vault.credentialsEmptyTitle")}
              description={t("vault.credentialsEmptyDescription")}
              action={t("vault.addCredential")}
            />
          </CardContent>
        </Card>
      </section>

      <section>
        <InsightGrid
          title={t("vault.insights.title")}
          subtitle={t("vault.insights.subtitle")}
          items={vaultInsightBlueprints.map((item) => ({ ...item, label: t(item.key) }))}
        />
      </section>
    </div>
  );
}
