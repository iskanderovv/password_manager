import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CredentialForm } from "@/features/vault/components/credential-form";
import { getAvailableTags, getCredentialById } from "@/features/vault/lib/server-vault";

type CredentialDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CredentialDetailPage({ params }: CredentialDetailPageProps) {
  const t = await getTranslations();
  const { id } = await params;
  const credential = await getCredentialById(id);
  const availableTags = credential ? await getAvailableTags(credential.vaultId) : [];

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title={t("vault.detailTitle")}
        subtitle={t("vault.detailSubtitle")}
      />
      {credential ? (
        <CredentialForm mode="edit" vaultId={credential.vaultId} availableTags={availableTags} credential={credential} />
      ) : (
        <Card className="premium-card">
          <CardContent className="py-8 text-sm text-muted-foreground">{t("vault.form.errors.notFound")}</CardContent>
        </Card>
      )}
    </div>
  );
}
