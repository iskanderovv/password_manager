"use client";

import { LockVaultButton } from "@/features/auth/components/lock-vault-button";

import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/85 px-4 py-3 backdrop-blur lg:px-8">
      <div className="flex flex-wrap items-center justify-end gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <LockVaultButton />
      </div>
    </header>
  );
}
