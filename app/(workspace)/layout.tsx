import { AppShell } from "@/components/layout/app-shell";
import { UnlockGuard } from "@/features/auth/components/unlock-guard";

type WorkspaceLayoutProps = {
  children: React.ReactNode;
};

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <AppShell>
      <UnlockGuard>{children}</UnlockGuard>
    </AppShell>
  );
}
