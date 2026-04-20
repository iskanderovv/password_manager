import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/components/ui/skeleton";

export default async function Loading() {
  const t = await getTranslations();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-4 px-4 py-10 lg:px-8">
      <p className="text-sm text-muted-foreground">{t("loading.lock")}</p>
      <Skeleton className="h-44 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
