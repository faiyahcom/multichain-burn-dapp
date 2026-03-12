import { useAuthStore } from "@/stores/authStore";
import { useSystemStore } from "@/stores/systemStore";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect, useRef } from "react";
import { useWalletAuth } from "./useWalletAuth";

const useWalletConnectionHandler = () => {
    const { user, logout } = useAuthStore();
    const { isConnected, caipAddress } = useAppKitAccount();
    const { selectedNetworkId, setSelectedNetworkId } = useSystemStore();
    const { authenticateEvm, authenticateSolana } = useWalletAuth();

    // Guard against concurrent authentication flows.
    // When the wallet changes, logout() synchronously sets user=null, which
    // re-fires this effect before the first authenticate() call finishes —
    // producing a second sign-message popup. The ref prevents that re-entry.
    const isAuthenticating = useRef(false);
    // Tracks the previous caipAddress chain key ("namespace:chainRef") to
    // distinguish an initial connect from a post-connect chain switch.
    const prevChainKey = useRef<string | null>(null);

    useEffect(() => {
        if (!isConnected || !caipAddress) {
            prevChainKey.current = null;
            if (user) logout();
            return;
        }

        const [namespace, chainRef, address] = caipAddress.split(":");
        const currentChainKey = `${namespace}:${chainRef}`;
        const prev = prevChainKey.current;
        prevChainKey.current = currentChainKey;

        const isInitialConnect = prev === null;
        const chainSwitched = !isInitialConnect && prev !== currentChainKey;

        if (namespace === "solana") {
            // Always sync to Solana when wallet is on Solana.
            setSelectedNetworkId("solanaDevnet");
        } else if (chainSwitched) {
            // User switched EVM chains in their wallet after being connected.
            const systemNetwork = mapChainToSystemNetwork(namespace, chainRef);
            if (systemNetwork) setSelectedNetworkId(systemNetwork);
        } else if (isInitialConnect && selectedNetworkId === "solanaDevnet") {
            // Reconnecting with EVM after previously being on Solana — pick up
            // the actual wallet chain rather than leaving Solana selected.
            const systemNetwork = mapChainToSystemNetwork(namespace, chainRef);
            if (systemNetwork) setSelectedNetworkId(systemNetwork);
        }
        // Otherwise (initial EVM connect, already on an EVM network): keep the
        // user's persisted selectedNetworkId — don't let AppKit's default chain
        // (first entry = sepolia) stomp over a persisted Xphere selection.

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
    }, [
        isConnected,
        caipAddress,
        user,
        selectedNetworkId,
        logout,
        setSelectedNetworkId,
        authenticateEvm,
        authenticateSolana,
    ]);
};

export default useWalletConnectionHandler;
