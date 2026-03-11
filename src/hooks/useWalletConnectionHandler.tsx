import { useAuthStore } from "@/stores/authStore";
import { useSystemStore } from "@/stores/systemStore";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect, useRef } from "react";
import { useWalletAuth } from "./useWalletAuth";

const useWalletConnectionHandler = () => {
    const { user, logout } = useAuthStore();
    const { isConnected, caipAddress } = useAppKitAccount();
    const { setSelectedNetworkId } = useSystemStore();
    const { authenticateEvm, authenticateSolana } = useWalletAuth();

    // Guard against concurrent authentication flows.
    // When the wallet changes, logout() synchronously sets user=null, which
    // re-fires this effect before the first authenticate() call finishes —
    // producing a second sign-message popup. The ref prevents that re-entry.
    const isAuthenticating = useRef(false);

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
            // Bail out if an authenticate() call is already in flight.
            if (isAuthenticating.current) return;

            const login = async () => {
                isAuthenticating.current = true;
                try {
                    if (namespace === "eip155") {
                        await authenticateEvm(address);
                    } else if (namespace === "solana") {
                        await authenticateSolana(address);
                    }
                } finally {
                    isAuthenticating.current = false;
                }
            };
            login();
        }
    }, [isConnected, caipAddress, user]);
}

export default useWalletConnectionHandler