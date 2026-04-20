import type { FilterBlueprint, InsightBlueprint, MetricBlueprint } from "@/types/domain";

export const vaultMetricBlueprints: MetricBlueprint[] = [
  { key: "vault.metrics.totalCredentials", value: "0", delta: "0%" },
  { key: "vault.metrics.activeShares", value: "0", delta: "0%" },
  { key: "vault.metrics.updatedThisMonth", value: "0", delta: "0%" },
  { key: "vault.metrics.pendingRotation", value: "0", delta: "0%" },
];

export const vaultFilterBlueprints: FilterBlueprint[] = [
  { key: "vault.filters.all" },
  { key: "vault.filters.operations" },
  { key: "vault.filters.finance" },
  { key: "vault.filters.marketing" },
  { key: "vault.filters.clientPortals" },
];

export const vaultInsightBlueprints: InsightBlueprint[] = [
  { key: "vault.insights.reused", severity: "warning", value: "0" },
  { key: "vault.insights.weak", severity: "warning", value: "0" },
  { key: "vault.insights.missingUrl", severity: "critical", value: "0" },
  { key: "vault.insights.stale", severity: "good", value: "0" },
];
