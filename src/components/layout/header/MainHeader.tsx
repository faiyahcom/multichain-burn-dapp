import { useAppKitAccount } from "@reown/appkit/react";
import NetworkSelect from "./network-select";
import ProfileMenu from "./profile-menu";
import ConnectButton from "./connect-button";
import { Link } from "@tanstack/react-router";
import { HeaderNav, HeaderNavMobile } from "./glow/header-nav";

export function MainHeader() {
  const { isConnected } = useAppKitAccount();

  return (
    <header className="flex items-center justify-between gap-2 sm:gap-4 bg-transparent">
      <div className="flex items-center gap-2 sm:gap-4">
        <HeaderNavMobile />
        <Link to="/" className="flex items-center gap-3.75">
          <img
            src="/logo-with-text.png"
            alt="Logo"
            className="hidden object-contain md:block md:h-25.25 md:w-49.25"
          />
          <img
            src="/logo.png"
            alt="Logo"
            className="block h-25.25 w-16.5 object-contain md:hidden"
          />
          <h1 className="sr-only">FAIYAH.COM</h1>
        </Link>
      </div>

      <HeaderNav />

      {!isConnected ? (
        <ConnectButton />
      ) : (
        <div className="flex items-center gap-2 sm:gap-4 xl:gap-8">
          <NetworkSelect />
          <ProfileMenu />
        </div>
      )}
    </header>
  );
}
