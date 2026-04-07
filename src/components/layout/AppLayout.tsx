import type { ReactNode } from "react";
import { MainHeader } from "./header/MainHeader";
import { AdminMobileSidebar, AdminSidebar } from "./sidebar/admin-sidebar";
import { SwitchNetworkModal } from "./SwitchNetworkModal";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <MainHeader />
        <SwitchNetworkModal />

        <div className="flex w-full flex-1 overflow-x-hidden">
          <AdminSidebar />

          <main className="min-h-[calc(100%-var(--spacing)*24)] w-full rounded-tl-xl bg-white pt-6.75 pr-0.75 pl-5.25 xl:w-[calc(100%-var(--spacing)*70)]">
            <div className="h-full w-full rounded-t-xl bg-mb-gray">
              {children}
            </div>
          </main>
        </div>
      </div>

      <AdminMobileSidebar />
    </>
  );
}
