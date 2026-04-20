import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default async function NewCredentialPage() {
  const t = await getTranslations();

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title={t("vaultNew.title")}
        subtitle={t("vaultNew.subtitle")}
        action={
          <div className="flex gap-2">
            <Button variant="secondary">{t("common.cancel")}</Button>
            <Button>{t("common.saveDraft")}</Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle>{t("vaultNew.sections.identity")}</CardTitle>
            <CardDescription>{t("vaultNew.helper")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="space-y-2 text-sm">
              <span>{t("vaultNew.fields.serviceName")}</span>
              <Input placeholder={t("vaultNew.fields.serviceName")} />
            </label>

            <label className="space-y-2 text-sm">
              <span>{t("vaultNew.fields.url")}</span>
              <Input placeholder={t("vaultNew.fields.url")} />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span>{t("vaultNew.fields.username")}</span>
                <Input placeholder={t("vaultNew.fields.username")} />
              </label>

              <label className="space-y-2 text-sm">
                <span>{t("vaultNew.fields.password")}</span>
                <Input type="password" placeholder={t("vaultNew.fields.password")} />
              </label>
            </div>

            <label className="space-y-2 text-sm">
              <span>{t("vaultNew.fields.tags")}</span>
              <Input placeholder={t("vaultNew.fields.tags")} />
            </label>

            <label className="space-y-2 text-sm">
              <span>{t("vaultNew.fields.notes")}</span>
              <Textarea placeholder={t("vaultNew.fields.notes")} />
            </label>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle>{t("vaultNew.securityPanelTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <Badge variant="success">{t("vaultNew.securityPanelItems.noPlainText")}</Badge>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <Badge variant="warning">{t("vaultNew.securityPanelItems.rotationReady")}</Badge>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <Badge variant="secondary">{t("vaultNew.securityPanelItems.reuseReady")}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
