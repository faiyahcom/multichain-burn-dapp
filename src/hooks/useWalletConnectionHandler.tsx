import { useAuthStore } from "@/stores/authStore";
import { useSystemStore } from "@/stores/systemStore";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect } from "react";
import { useWalletAuth } from "./useWalletAuth";

const useWalletConnectionHandler = () => {
  const { user, logout } = useAuthStore();
  const { isConnected, caipAddress } = useAppKitAccount();
  const { setSelectedNetworkId } = useSystemStore();
  const { authenticateEvm, authenticateSolana } = useWalletAuth();

  useEffect(() => {
    if (!isConnected || !caipAddress) return;

    const [namespace, chainRef, address] = caipAddress.split(":");

    const systemNetwork = mapChainToSystemNetwork(namespace, chainRef);
    if (systemNetwork) {
      setSelectedNetworkId(systemNetwork);
    }

    const walletChanged = user?.address && user.address !== address;

    if (walletChanged) {
      logout();
    }

    if (!user || walletChanged) {
      const login = async () => {
        if (namespace === "eip155") {
          await authenticateEvm(address);
        } else if (namespace === "solana") {
          await authenticateSolana(address);
        }
      };
      login();
    }
  }, [isConnected, caipAddress, user]);
};

export default useWalletConnectionHandler;
