import { wagmiAdapter } from "@/config/appkit";
import {
  MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_BURN_ADDRESS,
  MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_SWAP_ADDRESS,
} from "@/web3";
import MULTICHAIN_BURN_ABI_BURN_FACTORY from "@/web3/contracts/abi_evm_burn_factory.json";
import MULTICHAIN_BURN_ABI_SWAP_FACTORY from "@/web3/contracts/abi_evm_swap_factory.json";
import {
  getContractBurnFactory,
  getContractSwapFactory,
} from "@/web3/contracts/multichainBurnContractEVM";
import { multicall, sendCalls, waitForCallsStatus } from "@wagmi/core";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { useCallback } from "react";
import { toast } from "sonner";
import type { Abi, Address, Hex } from "viem";

export const useCreateWhitelistTokenEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  // Calling this function also enables the token if it is already whitelisted
  const createWhitelistToken = useCallback(
    async ({ tokenAddress }: { tokenAddress: string }) => {
      try {
        if (!isConnected || !walletProvider) {
          throw new Error("Wallet not connected");
        }

        const provider = walletProvider
          ? new ethers.BrowserProvider(walletProvider as Eip1193Provider)
          : null;
        if (!provider) {
          throw new Error("Provider not found");
        }

        const signer = await provider.getSigner();

        const swapFactoryContract = getContractSwapFactory(signer);
        const burnFactoryContract = getContractBurnFactory(signer);
        const account = (await signer.getAddress()) as Address;
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);

        const whitelistTokenSwapPool =
          swapFactoryContract.interface.encodeFunctionData("whitelistToken", [
            tokenAddress,
          ]);

        const setBurnTokenWhitelistData =
          burnFactoryContract.interface.encodeFunctionData(
            "setTokenWhitelist",
            [tokenAddress, true],
          );

        const { id } = await sendCalls(wagmiAdapter.wagmiConfig, {
          account,
          chainId,
          forceAtomic: true,
          calls: [
            {
              to: MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_SWAP_ADDRESS as Address,
              data: whitelistTokenSwapPool as Hex,
            },
            {
              to: MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_BURN_ADDRESS as Address,
              data: setBurnTokenWhitelistData as Hex,
            },
          ],
        });

        const callsStatus = await waitForCallsStatus(wagmiAdapter.wagmiConfig, {
          id,
          throwOnFailure: true,
        });

        const [isSwapFactoryWhitelisted, isBurnFactoryWhitelisted] =
          await multicall(wagmiAdapter.wagmiConfig, {
            allowFailure: false,
            chainId,
            contracts: [
              {
                address:
                  MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_SWAP_ADDRESS as Address,
                abi: MULTICHAIN_BURN_ABI_SWAP_FACTORY as Abi,
                functionName: "isTokenWhitelisted",
                args: [tokenAddress as Address],
              },
              {
                address:
                  MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_BURN_ADDRESS as Address,
                abi: MULTICHAIN_BURN_ABI_BURN_FACTORY as Abi,
                functionName: "isWhitelistedToken",
                args: [tokenAddress as Address],
              },
            ],
          });

        if (!isSwapFactoryWhitelisted || !isBurnFactoryWhitelisted) {
          throw new Error("Create whitelist token failed on one contract");
        }

        const txHash = callsStatus.receipts?.[0]?.transactionHash;

        toast.success("Token whitelisted successfully!", {
          description: txHash ? `Tx: ${txHash}` : `Batch: ${id}`,
        });

        return true;
      } catch (error: any) {
        toast.error("Failed to create whitelist token", {
          description: error?.message || String(error),
        });
        console.log("error", error);
        return false;
      }
    },
    [isConnected, walletProvider],
  );

  return { createWhitelistToken };
};
