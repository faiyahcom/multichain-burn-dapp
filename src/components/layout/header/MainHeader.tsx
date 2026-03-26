import { useAppKitAccount } from "@reown/appkit/react";
import NetworkSelect from "./network-select";
import ProfileMenu from "./profile-menu";
import ConnectButton from "./connect-button";
import { Link } from "@tanstack/react-router";
import { HeaderNav, HeaderNavMobile } from "./glow/header-nav";
import { IconBell } from "@/assets/react";

export function MainHeader() {
  const { isConnected } = useAppKitAccount();

  return (
    <header className="flex items-end justify-between gap-2 bg-transparent sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-4">
        <HeaderNavMobile />
        <Link to="/" className="flex items-center gap-3.75" title="Faiyah.com">
          <img
            src="/logo-with-text.png"
            alt="Logo"
            className="hidden h-25.25 w-49.25 object-contain xl:block"
          />
          <img
            src="/logo.png"
            alt="Logo"
            className="block h-25.25 w-16.5 object-contain xl:hidden"
          />
          <h1 className="sr-only">FAIYAH.COM</h1>
        </Link>
      </div>

      <HeaderNav />

      {!isConnected ? (
        <ConnectButton />
      ) : (
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button className="rounded-full bg-mb-dark-profile-btn p-2 sm:p-5">
            <IconBell className="size-6 sm:size-7.25" />
          </button>
          <NetworkSelect />
          <ProfileMenu />
        </div>
      )}
    </header>
  );
}
