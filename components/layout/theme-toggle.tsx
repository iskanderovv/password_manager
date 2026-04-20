"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

const themeItems = [
  { value: "light", icon: Sun, key: "common.light" },
  { value: "dark", icon: Moon, key: "common.dark" },
  { value: "system", icon: Monitor, key: "common.system" },
] as const;

export function ThemeToggle() {
  const mounted = useMounted();
  const { setTheme, theme } = useTheme();
  const t = useTranslations();

  if (!mounted) {
    return <div className="h-10 w-32 rounded-xl border border-border/70 bg-card/80" />;
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-card/80 p-1">
      {themeItems.map((item) => {
        const Icon = item.icon;
        const selected = item.value === (theme ?? "system");

        return (
          <button
            type="button"
            key={item.value}
            onClick={() => setTheme(item.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground transition",
              selected && "bg-primary text-primary-foreground shadow-sm",
            )}
            aria-label={t(item.key)}
            title={t(item.key)}
          >
            <Icon className="size-3.5" />
            <span className="hidden sm:block">{t(item.key)}</span>
          </button>
        );
      })}
    </div>
  );
}
