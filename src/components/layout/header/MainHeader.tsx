import { useAppKitAccount } from "@reown/appkit/react";
import NetworkSelect from "./network-select";
import ProfileMenu from "./profile-menu";
import ConnectButton from "./connect-button";
import { Link } from "@tanstack/react-router";

export function MainHeader() {
  const { isConnected } = useAppKitAccount();

  return (
    <header className="flex items-center justify-between gap-4 bg-background pt-6 pr-14 pb-9 pl-9">
      <Link to="/" className="flex items-center gap-7.5">
        <img src="/logo.png" alt="Logo" className="h-11 w-8 object-contain" />
        <h1 className="text-lg font-extrabold">FAIYAH.COM</h1>
      </Link>

      {!isConnected ? (
        <ConnectButton />
      ) : (
        <div className="flex items-center gap-8">
          <NetworkSelect />
          <ProfileMenu />
        </div>
      )}
    </header>
  );
}
