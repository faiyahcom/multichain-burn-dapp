import { useAppKitAccount } from "@reown/appkit/react";
import NetworkSelect from "./network-select";
import ProfileMenu from "./profile-menu";
import ConnectButton from "./connect-button";
import { Link } from "@tanstack/react-router";
import { AdminNotificationBell } from "./admin-notification-bell";

export function MainHeader() {
  const { isConnected } = useAppKitAccount();

  return (
    <header className="flex items-center justify-between gap-4 bg-background p-4 xl:pt-6 xl:pr-14 xl:pb-9 xl:pl-9">
      <Link to="/" className="flex items-center gap-7.5">
        <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
        <h1 className="text-lg font-extrabold">FAIYAH.COM</h1>
      </Link>

      {!isConnected ? (
        <ConnectButton />
      ) : (
        <div className="flex items-center gap-8">
          <AdminNotificationBell />
          <NetworkSelect />
          <ProfileMenu />
        </div>
      )}
    </header>
  );
}
