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
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import type { Abi, Address, Hex } from "viem";

export const useDisableWhitelistUserEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const disableWhitelistUser = useCallback(
    async ({
      userAddress,
      whitelist,
    }: {
      userAddress: string;
      whitelist: boolean;
    }) => {
      try {
        if (!isConnected || !walletProvider) {
          throw new Error("Wallet not connected");
        }

        if (!/^0x[0-9a-fA-F]{40}$/.test(userAddress)) {
          throw new Error(`"${userAddress}" is not a valid EVM address`);
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

        const whitelistUserSwapData = whitelist
          ? swapFactoryContract.interface.encodeFunctionData("whitelistAddress", [
              userAddress,
            ])
          : swapFactoryContract.interface.encodeFunctionData(
              "removeWhitelistAddress",
              [userAddress],
            );

        const setBurnUserWhitelistData =
          burnFactoryContract.interface.encodeFunctionData("setUserWhitelist", [
            userAddress,
            whitelist,
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

        if (
          isSwapFactoryWhitelisted !== whitelist ||
          isBurnFactoryWhitelisted !== whitelist
        ) {
          throw new Error("Update whitelist user failed on one contract");
        }

        const txHash = callsStatus.receipts?.[0]?.transactionHash;

        toast.success(
          whitelist ? "User added to whitelist!" : "User removed from whitelist!",
          {
            description: txHash ? `Tx: ${txHash}` : `Batch: ${id}`,
          },
        );
        return true;
      } catch (error: unknown) {
        console.error("[toggleWhitelistUserEvm] error:", error);
        toast.error(
          whitelist ? "Failed to enable user" : "Failed to remove user from whitelist",
          {
            description: getErrorMessage({ error }),
          },
        );
        return false;
      }
    },
    [isConnected, walletProvider],
  );

  return { disableWhitelistUser };
};
