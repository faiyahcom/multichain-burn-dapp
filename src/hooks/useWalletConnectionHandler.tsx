import { useAuthStore } from "@/stores/authStore";
import { useSystemStore } from "@/stores/systemStore";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect, useRef } from "react";
import { useWalletAuth } from "./useWalletAuth";
import { appKit } from "@/config/appkit";

const useWalletConnectionHandler = () => {
    const { user, logout, _hasHydrated } = useAuthStore();
    const { isConnected, caipAddress } = useAppKitAccount();
    const { setSelectedNetworkId } = useSystemStore();
    const { authenticateEvm, authenticateSolana } = useWalletAuth();

    const isAuthenticating = useRef(false);
    const wasConnected = useRef(false);
    const prevChainKey = useRef<string | null>(null);

    useEffect(() => {
        if (!_hasHydrated) return;

        if (!isConnected || !caipAddress) {
            prevChainKey.current = null;
            if (wasConnected.current && user) logout();
            return;
        }

        wasConnected.current = true;

        const [namespace, chainRef, address] = caipAddress.split(":");
        const currentChainKey = `${namespace}:${chainRef}`;
        const prev = prevChainKey.current;
        prevChainKey.current = currentChainKey;

        const isInitialConnect = prev === null;
        const chainSwitched = !isInitialConnect && prev !== currentChainKey;

        // Always sync selectedNetworkId to whatever chain the wallet reports.
        if (namespace === "solana") {
            setSelectedNetworkId("solanaDevnet");
        } else if (isInitialConnect || chainSwitched) {
            const systemNetwork = mapChainToSystemNetwork(namespace, chainRef);
            if (systemNetwork) setSelectedNetworkId(systemNetwork);
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
                    let result;
                    if (namespace === "eip155") {
                        result = await authenticateEvm(address);
                    } else if (namespace === "solana") {
                        result = await authenticateSolana(address);
                    }
                    if (result && !result.success) {
                        // User rejected signature or auth failed — disconnect
                        // so the wallet doesn't stay in a connected+unauthenticated limbo.
                        appKit.disconnect();
                    }
                } finally {
                    isAuthenticating.current = false;
                }
            };
            login();
        }
    }, [
        _hasHydrated,
        isConnected,
        caipAddress,
        user,
        logout,
        setSelectedNetworkId,
        authenticateEvm,
        authenticateSolana,
    ]);
};

export default useWalletConnectionHandler;
