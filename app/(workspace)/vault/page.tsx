import { VaultOverview } from "@/features/vault/components/vault-overview";
import type { VaultFilterState } from "@/features/vault/lib/client-vault";
import { getVaultOverviewPayload } from "@/features/vault/lib/server-vault";

type VaultPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseInitialFilters(params: Record<string, string | string[] | undefined>): Partial<VaultFilterState> {
  const issue = pickFirst(params.issue);
  const query = pickFirst(params.query);
  const strength = pickFirst(params.strength);

  return {
    query: query ?? "",
    issue:
      issue === "reused" ||
      issue === "weak" ||
      issue === "stale" ||
      issue === "missing-url" ||
      issue === "missing-notes"
        ? issue
        : "all",
    strength: strength === "weak" || strength === "fair" || strength === "strong" ? strength : "all",
    reusedOnly: issue === "reused",
  };
}

export default async function VaultPage({ searchParams }: VaultPageProps) {
  const payload = await getVaultOverviewPayload();
  const params = (await searchParams) ?? {};
  const initialFilters = parseInitialFilters(params);

  return <VaultOverview payload={payload} initialFilters={initialFilters} />;
}
