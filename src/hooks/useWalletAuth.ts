import { useState, useCallback } from "react";
import { useSignMessage } from "wagmi";
import { useAppKitAccount } from "@reown/appkit/react";
import bs58 from "bs58";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

type WalletType = "evm" | "solana";

// Helper function to sign message with Solana wallet
async function signSolanaMessage(message: string): Promise<string> {
  // Check if Solana wallet is available (Phantom, etc.)
  const solanaWallet = window.solana;

  if (!solanaWallet) {
    throw new Error("Solana wallet not found. Please install Phantom wallet.");
  }

  // Ensure wallet is connected
  if (!solanaWallet.isConnected) {
    await solanaWallet.connect();
  }

  // Convert message to Uint8Array
  const messageBytes = new TextEncoder().encode(message);

  // Sign message - Phantom and other Solana wallets use signMessage method
  const signedMessage = await solanaWallet.signMessage(messageBytes, "utf8");

  // Convert signature to base58 string (Solana standard)
  // The signature is already a Uint8Array from signMessage
  const signature = bs58.encode(signedMessage.signature);

  return signature;
}

export function useWalletAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { login, setLoading, setError } = useAuthStore();

  // EVM wallet hooks - use useAppKitAccount instead of deprecated useAccount
  const { address: evmAddress } = useAppKitAccount({
    namespace: "eip155",
  });
  // signMessageAsync đã deprecated, dùng mutateAsync thay thế
  const { mutateAsync: signEvmMessage } = useSignMessage();

  // Solana wallet account
  const { address: solanaAddress } = useAppKitAccount({
    namespace: "solana",
  });

  const authenticate = useCallback(
    async (walletType: WalletType, address: string) => {
      try {
        console.log("Starting authentication for:", walletType, address);
        setIsAuthenticating(true);
        setLoading(true);
        setError(null);

        // Step 1: Request signing message from server
        console.log("Requesting signing message for address:", address);
        const response = await authService.requestSigningMessage({
          address,
        });

        // Extract message from response
        // Response format: { "message": "1767860919362, Welcome" }
        const message = response.message;
        if (!message) {
          throw new Error("Invalid response: message is missing");
        }

        console.log("Received signing message:", message);

        // Step 2: Sign message with wallet
        let signature: string;

        if (walletType === "evm") {
          // Sign with EVM wallet using wagmi
          if (!signEvmMessage) {
            throw new Error("EVM wallet not connected");
          }
          console.log("Signing message with EVM wallet:", message);
          signature = await signEvmMessage({ message });
          console.log("EVM signature received");
        } else {
          // Sign with Solana wallet
          console.log("Signing message with Solana wallet:", message);
          signature = await signSolanaMessage(message);
          console.log("Solana signature received");
        }

        // Step 3: Send signature to server for authentication
        console.log("Sending signature to server for authentication");
        const signInMethod =
          walletType === "evm"
            ? authService.signInEvm
            : authService.signInSolana;

        const { token } = await signInMethod({
          address,
          message,
          signature,
        });
        console.log("Authentication successful, token received");

        // Step 4: Set token temporarily to fetch user info
        // Axios interceptor will automatically add token to Authorization header
        const tempToken = token;
        login({
          user: { id: "", address }, // Temporary, will be updated below
          accessToken: tempToken,
        });

        // Step 5: Get user info from server (token is now in Authorization header)
        console.log("Fetching user info from server");
        const userInfo = await authService.getCurrentUser();
        console.log("User info received:", userInfo);

        // Step 6: Update auth state with complete user info
        login({
          user: { id: userInfo.id, address: userInfo.address || address },
          accessToken: tempToken,
        });

        return { success: true };
      } catch (error: any) {
        const errorMessage =
          error?.message || "Authentication failed. Please try again.";
        setError(errorMessage);
        console.error("Authentication error:", error);
        return { success: false, error: errorMessage };
      } finally {
        setIsAuthenticating(false);
        setLoading(false);
      }
    },
    [signEvmMessage, login, setLoading, setError],
  );

  const authenticateEvm = useCallback(
    async (address?: string) => {
      const targetAddress = address || evmAddress;
      if (!targetAddress) {
        throw new Error("EVM wallet not connected");
      }
      return authenticate("evm", targetAddress);
    },
    [evmAddress, authenticate],
  );

  const authenticateSolana = useCallback(
    async (address?: string) => {
      const targetAddress = address || solanaAddress;
      if (!targetAddress) {
        throw new Error("Solana wallet not connected");
      }
      return authenticate("solana", targetAddress);
    },
    [solanaAddress, authenticate],
  );

  return {
    authenticateEvm,
    authenticateSolana,
    isAuthenticating,
    evmAddress,
    solanaAddress,
  };
}
