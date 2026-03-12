import type { ReactNode } from "react";
import { Sidebar } from "./sidebar/Sidebar";
import { MainHeader } from "./header/MainHeader";
import { SwitchNetworkModal } from "./SwitchNetworkModal";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <MainHeader />
      <SwitchNetworkModal />

      <div className="flex flex-1">
        <Sidebar />

        <main className="min-h-[calc(100dvh-var(--spacing)*24)] flex-1 rounded-tl-xl bg-white pt-6.75 pr-0.75 pl-5.25">
          <div className="h-full w-full rounded-t-xl bg-mb-gray">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
