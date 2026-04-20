import { getTranslations } from "next-intl/server";

import { LockHero } from "@/components/shared/lock-hero";
import { LockForm } from "@/features/lock/components/lock-form";

export default async function LockPage() {
  const t = await getTranslations();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-6 px-4 py-10 lg:px-8">
      <LockHero />
      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <div className="rounded-2xl border border-border/70 bg-card/85 p-6">
          <p className="text-sm text-muted-foreground">{t("lock.scaffoldNote")}</p>
        </div>
        <LockForm />
      </div>
    </div>
  );
}
