"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { localeCookieName, locales, type Locale } from "@/lib/i18n/config";

export function LocaleSwitcher() {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations();

  return (
    <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 text-sm">
      <Languages className="size-4 text-muted-foreground" />
      <span className="sr-only">{t("common.language")}</span>
      <select
        value={locale}
        className="bg-transparent text-sm outline-none"
        onChange={(event) => {
          const nextLocale = event.target.value as Locale;
          document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }}
        aria-label={t("common.language")}
      >
        {locales.map((value) => (
          <option value={value} key={value}>
            {t(`locales.${value}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
