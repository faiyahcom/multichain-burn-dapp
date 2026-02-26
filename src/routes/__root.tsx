import { Outlet, createRootRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import useWalletConnectionHandler from "@/hooks/useWalletConnectionHandler";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useWalletConnectionHandler();

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
