"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, PlusCircle, Settings, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const links = [
  { href: "/vault", key: "nav.vault", icon: ShieldCheck },
  { href: "/vault/new", key: "nav.newCredential", icon: PlusCircle },
  { href: "/settings", key: "nav.settings", icon: Settings },
  { href: "/lock", key: "nav.lock", icon: Lock },
] as const;

export function SidebarNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      <div className="border-b border-sidebar-border px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-sidebar-foreground/70">{t("common.workspace")}</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{t("common.appName")}</h1>
        <p className="mt-1 text-sm text-sidebar-foreground/70">{t("common.appTagline")}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || (link.href !== "/vault" && pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4" />
              <span>{t(link.key)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-xl border border-sidebar-border bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-wider text-sidebar-foreground/60">{t("common.security")}</p>
          <p className="mt-1 text-sm text-sidebar-foreground/85">{t("vault.insights.title")}</p>
          <div className="mt-3">
            <Badge variant="warning">{t("common.statusNeedsAttention")}</Badge>
          </div>
        </div>
      </div>
    </aside>
  );
}
