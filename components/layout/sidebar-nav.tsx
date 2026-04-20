"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fingerprint, House, PlusCircle, Settings, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const links = [
  { href: "/home", key: "nav.home", icon: House },
  { href: "/vault", key: "nav.vault", icon: ShieldCheck },
  { href: "/vault/new", key: "nav.newCredential", icon: PlusCircle },
  { href: "/settings", key: "nav.settings", icon: Settings },
] as const;

export function SidebarNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <aside className="hidden border-r border-sidebar-border bg-sidebar/70 backdrop-blur-xl text-sidebar-foreground lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:overflow-y-auto">
      <div className="border-b border-sidebar-border px-6 py-8">
        <Link href="/home" className="flex items-center gap-4 px-1" aria-label="CREDXVAULT">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
            <div className="absolute inset-0 rounded-2xl border border-primary/20" />
            <ShieldCheck className="h-6 w-6 text-primary drop-shadow-sm" />
            <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-[2.5px] border-background bg-emerald-500 text-white shadow-sm">
              <Fingerprint className="h-2.5 w-2.5" />
            </div>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xl font-bold tracking-tight text-foreground">
              CREDX<span className="text-primary">VAULT</span>
            </span>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 leading-tight truncate">
              TEAM PASS MANAGER
            </p>
          </div>
        </Link>
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
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-sidebar-foreground/70 hover:bg-muted/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon className={cn("size-4", active ? "text-primary-foreground" : "text-primary")} />
              <span className={cn(active && "font-medium")}>{t(link.key)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-xl border border-sidebar-border bg-muted/30 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50">{t("common.security")}</p>
          <p className="mt-1 text-xs font-medium text-sidebar-foreground/80">{t("vault.insights.title")}</p>
          <div className="mt-3">
            <Badge variant="warning">{t("common.statusNeedsAttention")}</Badge>
          </div>
        </div>
      </div>
    </aside>
  );
}
