import type { ReactNode } from "react";
import { MainHeader } from "./header/MainHeader";
import { SwitchNetworkModal } from "./SwitchNetworkModal";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col text-foreground">
      <MainHeader />
      <SwitchNetworkModal />
      <main className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
