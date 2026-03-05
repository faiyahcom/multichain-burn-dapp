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

export const useCreateWhitelistUserEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const createWhitelistUser = useCallback(
    async ({ userAddress }: { userAddress: string }) => {
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

        const whitelistUserSwapData =
          swapFactoryContract.interface.encodeFunctionData("whitelistAddress", [
            userAddress,
          ]);
        const setBurnUserWhitelistData =
          burnFactoryContract.interface.encodeFunctionData("setUserWhitelist", [
            userAddress,
            true,
          ]);

        const { id } = await sendCalls(wagmiAdapter.wagmiConfig, {
          account,
          chainId,
          forceAtomic: true,
          calls: [
            {
              to: MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_SWAP_ADDRESS as Address,
              data: whitelistUserSwapData as Hex,
            },
            {
              to: MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_BURN_ADDRESS as Address,
              data: setBurnUserWhitelistData as Hex,
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
                functionName: "isAddressWhitelisted",
                args: [userAddress as Address],
              },
              {
                address:
                  MULTICHAIN_BURN_PROGRAM_EVM_FACTORY_BURN_ADDRESS as Address,
                abi: MULTICHAIN_BURN_ABI_BURN_FACTORY as Abi,
                functionName: "isWhitelistedUser",
                args: [userAddress as Address],
              },
            ],
          });

        if (!isSwapFactoryWhitelisted || !isBurnFactoryWhitelisted) {
          throw new Error("Create whitelist user failed on one contract");
        }

        const txHash = callsStatus.receipts?.[0]?.transactionHash;

        toast.success("User whitelisted on EVM successfully!", {
          description: txHash ? `Tx: ${txHash}` : `Batch: ${id}`,
        });

        return true;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error("Failed to whitelist user on EVM", {
          description: errorMessage,
        });
        return false;
      }
    },
    [isConnected, walletProvider],
  );

  return { createWhitelistUser };
};
