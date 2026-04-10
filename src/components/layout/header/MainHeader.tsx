import { useAppKitAccount } from "@reown/appkit/react";
import NetworkSelect from "./network-select";
import ProfileMenu from "./profile-menu";
import ConnectButton from "./connect-button";
import { Link } from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";
import { useSidebarStateStore } from "@/stores/admin/sidebar/sidebar-store";
import { AdminNotificationBell } from "./admin-notification-bell";

export function MainHeader() {
  const { isConnected } = useAppKitAccount();
  const { setState } = useSidebarStateStore();

  return (
    <header className="flex items-center justify-between gap-4 bg-background p-4 xl:pt-6 xl:pr-14 xl:pb-9 xl:pl-9">
      <div className="flex items-center gap-4">
        {/* mobile sidebar button */}
        <button
          className="xl:hidden"
          aria-label="Open sidebar menu"
          onClick={() => {
            setState({ isOpen: true });
          }}
        >
          <MenuIcon />
        </button>
        <Link to="/" className="flex items-center gap-4 xl:gap-7.5">
          <img src="/logo.png" alt="Logo" className="h-11 w-8" />
          <h1 className="text-lg font-extrabold max-md:sr-only">FAIYAH.COM</h1>
        </Link>
      </div>

      {!isConnected ? (
        <ConnectButton />
      ) : (
        <div className="flex items-center gap-3 sm:gap-8">
          <AdminNotificationBell />
          <NetworkSelect />
          <ProfileMenu />
        </div>
      )}
    </header>
  );
}
