import { useAppKitAccount } from "@reown/appkit/react";
import NetworkSelect from "./network-select";
import ProfileMenu from "./profile-menu";
import ConnectButton from "./connect-button";
import { Link } from "@tanstack/react-router";
import { HeaderNav, HeaderNavMobile } from "./glow/header-nav";

export function MainHeader() {
  const { isConnected } = useAppKitAccount();

  return (
    <header className="flex items-center justify-between gap-4 bg-transparent">
      <div className="flex items-center gap-4">
        <HeaderNavMobile />
        <Link to="/" className="flex items-center gap-3.75">
          <img src="/logo.svg" alt="Logo" className="size-8 md:size-9.25" />
          <h1 className="text-xl font-extrabold max-2xl:sr-only">FAIYAH.COM</h1>
        </Link>
      </div>

      <HeaderNav />

      {!isConnected ? (
        <ConnectButton />
      ) : (
        <div className="flex items-center gap-4 md:gap-8">
          <NetworkSelect />
          <ProfileMenu />
        </div>
      )}
    </header>
  );
}
