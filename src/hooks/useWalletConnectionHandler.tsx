import { useAuthStore } from "@/stores/authStore";
import { useSystemStore } from "@/stores/systemStore";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { networkIdToChainId } from "@/config/networks";
import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect, useRef } from "react";
import { useWalletAuth } from "./useWalletAuth";
import { useDisconnect } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

const useWalletConnectionHandler = () => {
    const { user, logout, _hasHydrated } = useAuthStore();
    const { isConnected, caipAddress } = useAppKitAccount();
    const { selectedNetworkId, setSelectedNetworkId } = useSystemStore();
    const { authenticateEvm, authenticateSolana } = useWalletAuth();
    const { disconnect } = useDisconnect();

    const isAuthenticating = useRef(false);
    const wasConnected = useRef(false);
    const prevChainKey = useRef<string | null>(null);

    // Stable refs so the effect never re-runs just because callbacks were recreated.
    const authenticateEvmRef = useRef(authenticateEvm);
    const authenticateSolanaRef = useRef(authenticateSolana);
    const disconnectRef = useRef(disconnect);
    useEffect(() => {
        authenticateEvmRef.current = authenticateEvm;
    }, [authenticateEvm]);
    useEffect(() => {
        authenticateSolanaRef.current = authenticateSolana;
    }, [authenticateSolana]);
    useEffect(() => {
        disconnectRef.current = disconnect;
    }, [disconnect]);

    const queryClient = useQueryClient();

    console.log("selectedNetworkId", selectedNetworkId);

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

        const networkId = mapChainToSystemNetwork(namespace, chainRef);
        const backendChainId = networkId
            ? networkIdToChainId(networkId)
            : undefined;

        const isInitialConnect = prev === null;
        const chainSwitched = !isInitialConnect && prev !== currentChainKey;

        // Always sync selectedNetworkId to whatever chain the wallet reports.
        if (namespace === "solana") {
            setSelectedNetworkId("solanaDevnet");
        } else if (isInitialConnect || chainSwitched) {
            const systemNetwork = mapChainToSystemNetwork(namespace, chainRef);
            if (systemNetwork) setSelectedNetworkId(systemNetwork);
        }

        // Unsupported EVM chain (e.g. mainnet) — disconnect immediately so the
        // connector doesn't stay in a half-connected limbo.
        if (namespace === "eip155" && !networkId) {
            disconnectRef.current();
            return;
        }

        const walletChanged =
            user?.address &&
            (user.address !== address || user.chainId !== backendChainId);

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
                        result = await authenticateEvmRef.current(address, backendChainId);
                    } else if (namespace === "solana") {
                        result = await authenticateSolanaRef.current(
                            address,
                            backendChainId,
                        );
                    }
                    if (result && !result.success) {
                        // User rejected signature or auth failed — disconnect
                        // so the wallet doesn't stay in a connected+unauthenticated limbo.
                        disconnectRef.current();
                    }
                } finally {
                    isAuthenticating.current = false;
                    queryClient.invalidateQueries();
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
        // authenticateEvm / authenticateSolana / disconnect intentionally omitted —
        // they're accessed via stable refs above to prevent the effect re-running
        // (and triggering a second auth attempt) when hook callbacks are recreated.
    ]);
};

export default useWalletConnectionHandler;
