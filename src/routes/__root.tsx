import { Outlet, createRootRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import useWalletConnectionHandler from "@/hooks/useWalletConnectionHandler";
import { useAppKitEventHandler } from "@/hooks/useAppKitEventHandler";
import { useAutoSwitchXphere } from "@/hooks/useAutoSwitchXphere";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useWalletConnectionHandler();
  useAppKitEventHandler();
  useAutoSwitchXphere();

  return (
    <AppLayout>
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
      <Toaster richColors />
    </AppLayout>
  );
}
