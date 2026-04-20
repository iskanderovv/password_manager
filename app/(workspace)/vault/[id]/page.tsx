import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CredentialDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CredentialDetailPage({ params }: CredentialDetailPageProps) {
  const t = await getTranslations();
  const { id } = await params;

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title={t("vaultDetail.title")}
        subtitle={t("vaultDetail.subtitle")}
        action={<Button>{t("common.saveDraft")}</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle>{t("vaultDetail.snapshotTitle")}</CardTitle>
            <CardDescription>
              {t("common.recordId")}: {id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input readOnly value={t("vaultNew.fields.serviceName")} />
            <Input readOnly value={t("vaultNew.fields.url")} />
            <Input readOnly value={t("vaultNew.fields.username")} />
            <Textarea readOnly value={t("common.uiScaffold")} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>{t("vaultDetail.securityTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="secondary">{t("vaultDetail.securityEmpty")}</Badge>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader>
              <CardTitle>{t("vaultDetail.activityTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("vaultDetail.activityEmpty")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
