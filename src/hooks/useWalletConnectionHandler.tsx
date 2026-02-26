import { useAuthStore } from "@/stores/authStore";
import { useSystemStore } from "@/stores/systemStore";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect } from "react";
import { useWalletAuth } from "./useWalletAuth";

const useWalletConnectionHandler = () => {
    const { user } = useAuthStore();
    const { isConnected, caipAddress } = useAppKitAccount();
    const { setSelectedNetworkId } = useSystemStore();
    const { authenticateEvm, authenticateSolana } = useWalletAuth();

    useEffect(() => {
        if (!isConnected || !caipAddress || user) return;

        const [namespace, chainRef, address] = caipAddress.split(":");

        const systemNetwork = mapChainToSystemNetwork(namespace, chainRef);

        if (systemNetwork) {
            setSelectedNetworkId(systemNetwork);
        }

        const login = async () => {
            if (namespace === "eip155") {
                await authenticateEvm(address);
            } else if (namespace === "solana") {
                await authenticateSolana(address);
            }
        };

        login();
    }, [isConnected, caipAddress, user]);
}

export default useWalletConnectionHandler