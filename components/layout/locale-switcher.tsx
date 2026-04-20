"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { localeCookieName, locales, type Locale } from "@/lib/i18n/config";

export function LocaleSwitcher() {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const applyLocale = (nextLocale: Locale) => {
    setOpen(false);
    if (nextLocale === locale) return;
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 text-sm transition hover:bg-card"
        aria-label={t("common.language")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Languages className="size-4 text-muted-foreground" />
        <span className="hidden sm:inline">{t(`locales.${locale}`)}</span>
        <ChevronDown className={`size-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={t("common.language")}
          className="animate-scale-in absolute right-0 top-12 z-50 w-44 rounded-xl border border-border/80 bg-card/95 p-1.5 shadow-lg backdrop-blur"
        >
          {locales.map((value) => {
            const selected = value === locale;

            return (
              <button
                key={value}
                type="button"
                onClick={() => applyLocale(value)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition ${
                  selected ? "bg-primary/15 text-primary" : "bg-card/80 hover:bg-muted/80"
                }`}
                aria-selected={selected}
              >
                <span>{t(`locales.${value}`)}</span>
                {selected ? <Check className="size-4" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
