import { useAppKitAccount } from "@reown/appkit/react";
import NetworkSelect from "./network-select";
import ProfileMenu from "./profile-menu";
import ConnectButton from "./connect-button";

export function MainHeader() {
  const { isConnected } = useAppKitAccount();


  return (
    <header className="flex items-center justify-between gap-4 bg-background pt-6 pr-14 pb-9 pl-9">
      <div className="flex items-center gap-[30px]">
        <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
        <h1 className="text-lg font-extrabold">XFAIYAH</h1>
      </div>

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
