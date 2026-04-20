import { VaultOverview } from "@/features/vault/components/vault-overview";
import { getVaultOverviewPayload } from "@/features/vault/lib/server-vault";

export default async function VaultPage() {
  const payload = await getVaultOverviewPayload();

  return <VaultOverview payload={payload} />;
}
