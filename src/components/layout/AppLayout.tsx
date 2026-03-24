import type { ReactNode } from "react";
import { MainHeader } from "./header/MainHeader";
import { SwitchNetworkModal } from "./SwitchNetworkModal";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="mx-auto min-h-dvh max-w-360 text-foreground p-5 lg:p-10 space-y-7.5 lg:space-y-15">
      <MainHeader />
      <SwitchNetworkModal />
      <main className="">{children}</main>
    </div>
  );
}
