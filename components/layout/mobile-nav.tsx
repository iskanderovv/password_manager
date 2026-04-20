"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const links = [
  { href: "/vault", key: "nav.vault" },
  { href: "/vault/new", key: "nav.newCredential" },
  { href: "/settings", key: "nav.settings" },
  { href: "/lock", key: "nav.lock" }
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <nav className="mb-4 flex gap-2 overflow-auto rounded-xl border border-border/70 bg-card/70 p-1 lg:hidden">
      {links.map((link) => {
        const active = pathname === link.href || (link.href !== "/vault" && pathname.startsWith(link.href));

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition",
              active && "bg-primary text-primary-foreground",
            )}
          >
            {t(link.key)}
          </Link>
        );
      })}
    </nav>
  );
}
