import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./sidebar-nav";
import { Topbar } from "./topbar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen lg:flex">
      <SidebarNav />
      <div className="min-w-0 flex-1">
        <Topbar />
        <main className="px-4 py-5 lg:px-8 lg:py-8">
          <MobileNav />
          {children}
        </main>
      </div>
    </div>
  );
}
