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
    const { user, logout, _hasHydrated, setError } = useAuthStore();
    const { isConnected, caipAddress } = useAppKitAccount();
    const { selectedNetworkId, setSelectedNetworkId } = useSystemStore();
    const { authenticateEvm, authenticateSolana } = useWalletAuth();
    const { disconnect } = useDisconnect();

    // isAuthenticating: tracks whether a login() coroutine is currently in flight.
    // authGeneration: incremented whenever an in-flight auth is invalidated (wallet
    // disconnect, chain change, or timeout). Each login() captures its own generation
    // number and bails early if a newer one has started, ensuring stale auth results
    // never overwrite the current state or trigger spurious error toasts.
    const isAuthenticating = useRef(false);
    const authGeneration = useRef(0);

    // wasConnected: prevents a logout() call on the very first render where the
    // wallet is not yet connected (avoiding a logout on cold page load).
    const wasConnected = useRef(false);

    // prevChainKey: tracks the last seen "namespace:chainRef" so we can detect
    // chain switches (vs. the same wallet firing the effect without changing chains).
    const prevChainKey = useRef<string | null>(null);

    // Stable refs so the main effect never re-runs just because these callbacks
    // were recreated, which would trigger a redundant auth attempt mid-flow.
    const authenticateEvmRef = useRef(authenticateEvm);
    const authenticateSolanaRef = useRef(authenticateSolana);
    const disconnectRef = useRef(disconnect);
    const setErrorRef = useRef(setError);
    useEffect(() => {
        authenticateEvmRef.current = authenticateEvm;
    }, [authenticateEvm]);
    useEffect(() => {
        authenticateSolanaRef.current = authenticateSolana;
    }, [authenticateSolana]);
    useEffect(() => {
        disconnectRef.current = disconnect;
    }, [disconnect]);
    useEffect(() => {
        setErrorRef.current = setError;
    }, [setError]);

    const queryClient = useQueryClient();

    useEffect(() => {
        if (!_hasHydrated) return;

        if (!isConnected || !caipAddress) {
            prevChainKey.current = null;

            if (isAuthenticating.current) {
                // Wallet dropped while a login() coroutine is in flight (e.g. the user
                // dismissed the WC modal or the relay timed out). Incrementing the
                // generation invalidates the pending coroutine so the next reconnect
                // isn't permanently blocked by a stale isAuthenticating flag.
                authGeneration.current++;
                isAuthenticating.current = false;
            }

            if (wasConnected.current && user) {
                logout();
            }
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

        // Keep the UI network selector in sync with whatever chain the wallet reports.
        if (namespace === "solana") {
            setSelectedNetworkId("solana");
        } else if (isInitialConnect || chainSwitched) {
            const systemNetwork = mapChainToSystemNetwork(namespace, chainRef);
            if (systemNetwork) setSelectedNetworkId(systemNetwork);
        }

        // Unsupported EVM chain (e.g. mainnet) — disconnect to avoid half-connected
        // limbo. Guard: WalletConnect briefly emits the wallet's previously-used chain
        // (often chain 1) during session handshake before settling on the correct one.
        // If auth is already in flight we must not tear down the WC session mid-request.
        if (namespace === "eip155" && !networkId) {
            if (isAuthenticating.current) {
                // Transient unsupported-chain flicker during WC handshake — ignore.
                return;
            }
            disconnectRef.current();
            return;
        }

        // Detect whether the connected wallet differs from the one we last authed with
        // (different address or different chain). This covers both manual account
        // switches and chain switches while the user is already logged in.
        const walletChanged =
            user?.address &&
            (user.address !== address || user.chainId !== backendChainId);

        if (walletChanged) {
            if (isAuthenticating.current) {
                // An auth for the previous wallet/chain is still in flight.
                // Invalidate it so the new chain's auth isn't blocked.
                authGeneration.current++;
                isAuthenticating.current = false;
            }
            logout();
        }

        if (!user || walletChanged) {
            if (isAuthenticating.current) return;

            const login = async () => {
                const myGeneration = ++authGeneration.current;
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

                    if (myGeneration !== authGeneration.current) {
                        // A newer auth generation has started (wallet changed mid-flight).
                        // Discard this result entirely and clear any error it may have set.
                        setErrorRef.current(null);
                        return;
                    }

                    if (result && !result.success) {
                        // Auth failed for the current wallet — show error and disconnect.
                        setErrorRef.current(result.error ?? 'Authentication failed. Please try again.');
                        disconnectRef.current();
                    }
                } catch (err: any) {
                    if (myGeneration !== authGeneration.current) {
                        // Stale generation threw — silently discard and clear any error.
                        setErrorRef.current(null);
                        return;
                    }
                    // Unexpected throw: useWalletAuth should have caught and returned
                    // { success: false } for all user-facing errors.
                    disconnectRef.current();
                } finally {
                    if (myGeneration === authGeneration.current) {
                        isAuthenticating.current = false;
                    }
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
        // authenticateEvm / authenticateSolana / disconnect / setError intentionally
        // omitted — accessed via stable refs above to prevent the effect re-running
        // (and triggering a second auth attempt) when hook callbacks are recreated.
    ]);
};

export default useWalletConnectionHandler;
