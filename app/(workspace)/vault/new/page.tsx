import { PageHeader } from "@/components/shared/page-header";
import { CredentialForm } from "@/features/vault/components/credential-form";
import { getActiveVaultId, getAvailableTags } from "@/features/vault/lib/server-vault";
import { getTranslations } from "next-intl/server";

export default async function NewCredentialPage() {
  const t = await getTranslations();
  const vaultId = await getActiveVaultId();
  const availableTags = vaultId ? await getAvailableTags(vaultId) : [];

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title={t("vault.newTitle")} subtitle={t("vault.newSubtitle")} />
      <CredentialForm mode="create" vaultId={vaultId} availableTags={availableTags} />
    </div>
  );
}
