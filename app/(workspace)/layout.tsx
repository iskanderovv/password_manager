import { AppShell } from "@/components/layout/app-shell";
import { AutoLockManager } from "@/features/auth/components/auto-lock-manager";
import { UnlockGuard } from "@/features/auth/components/unlock-guard";

type WorkspaceLayoutProps = {
  children: React.ReactNode;
};

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <AppShell>
      <UnlockGuard>
        <AutoLockManager />
        {children}
      </UnlockGuard>
    </AppShell>
  );
}
