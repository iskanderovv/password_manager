import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/components/ui/skeleton";

export default async function Loading() {
  const t = await getTranslations();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("loading.vaultNew")}</p>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <Skeleton className="h-[460px] w-full rounded-2xl" />
        <Skeleton className="h-[280px] w-full rounded-2xl" />
      </div>
    </div>
  );
}
