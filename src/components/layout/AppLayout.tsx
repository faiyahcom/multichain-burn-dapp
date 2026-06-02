import type { ReactNode } from "react";
import { MainHeader } from "./header/MainHeader";
import { SwitchNetworkModal } from "./SwitchNetworkModal";
import { InAppBrowserPrompt } from "@/components/common/in-app-browser-prompt";
import { useInAppBrowserPrompt } from "@/hooks/useInAppBrowserPrompt";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const { open: promptOpen, dismiss: dismissPrompt } = useInAppBrowserPrompt();

  return (
    <div className="mx-auto min-h-dvh max-w-395.25 space-y-5.5 p-5 pt-3 text-foreground lg:space-y-11 lg:p-15 lg:pt-6">
      <MainHeader />
      <SwitchNetworkModal />
      <InAppBrowserPrompt open={promptOpen} onDismiss={dismissPrompt} />
      <main className="">{children}</main>
    </div>
  );
}
