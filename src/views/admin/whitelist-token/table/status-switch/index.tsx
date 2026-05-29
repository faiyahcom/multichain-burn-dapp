import BlueSwitch from "@/components/common/blue-switch";
import { useAppKitAccount } from "@reown/appkit/react";
import { useState } from "react";
import { useDisableWhitelistTokenSolanaFn } from "../useDisableWhitelistTokenSolanaFn";
import { useDisableWhitelistTokenEvmFn } from "../useDisableWhitelistTokenEvmFn";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/common/custom-toast";
import { useCreateWhitelistTokenSolanaFn } from "../../dialog/create/useCreateWhitelistTokenSolanaFn";
import { useCreateWhitelistTokenEvmFn } from "../../dialog/create/useCreateWhitelistTokenEvmFn";
import { chainIdToNetworkConfig } from "@/config/networks";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { useSystemStore } from "@/stores/systemStore";
import { poolTypes as allPoolTypes, type PoolType } from "@/types/admin/master-pool-management";
import { whitelistQueryKeys } from "@/services/queries/queryKey";
import { whitelistService } from "@/services/whitelistService";
import { getErrorMessage } from "@/utils/helpers/error-message";

interface Props {
  switchProps?: React.ComponentProps<typeof BlueSwitch>;
  chainId?: string;
  address?: string;
  poolTypes?: PoolType[];
  availablePoolTypes?: PoolType[];
}

const StatusSwitch: React.FC<Props> = ({
  switchProps,
  chainId,
  address,
  poolTypes,
  availablePoolTypes,
}) => {
  const [isCallingSc, setIsCallingSc] = useState<boolean>(false);

  const { caipAddress } = useAppKitAccount();
  const { openSwitchNetworkModal } = useSystemStore();
  const [namespace, chainRef] = caipAddress?.split(":") ?? [];
  const isSolana = namespace === "solana";
  const isEvm = namespace === "eip155";
  const currentNetworkId =
    namespace && chainRef ? mapChainToSystemNetwork(namespace, chainRef) : null;

  const { disableWhitelistToken: disableWhitelistTokenSolana } =
    useDisableWhitelistTokenSolanaFn();
  const { disableWhitelistToken: disableWhitelistTokenEvm } =
    useDisableWhitelistTokenEvmFn();

  const { createWhitelistToken: enableWhitelistTokenSolana } =
    useCreateWhitelistTokenSolanaFn();
  const { createWhitelistToken: enableWhitelistTokenEvm } =
    useCreateWhitelistTokenEvmFn();

  const queryClient = useQueryClient();

  const syncBackendStatus = async (
    nextStatus: boolean,
    targetPoolTypes: PoolType[],
  ) => {
    await Promise.all(
      targetPoolTypes.map((poolType) =>
        whitelistService.updateStatusWhitelistTokenStatus({
          chainId: chainId!,
          address: address!,
          active: nextStatus,
          kind: poolType,
        }),
      ),
    );
  };

  const handleToggleSwitch = async () => {
    const isActive = switchProps?.active;
    if (!address) {
      toast.error("Token address is required");
      return;
    }
    if (!chainId) {
      toast.error("Chain id is required");
      return;
    }

    const tokenNetworkId = chainIdToNetworkConfig(chainId)?.id;

    if (tokenNetworkId && currentNetworkId !== tokenNetworkId) {
      openSwitchNetworkModal(currentNetworkId, tokenNetworkId);
      return;
    }

    setIsCallingSc(true);

    const targetPoolTypes = isActive
      ? poolTypes ?? []
      : availablePoolTypes?.length
        ? availablePoolTypes
        : [...allPoolTypes];

    let result = false;

    if (isSolana) {
      if (isActive) {
        result = await disableWhitelistTokenSolana({
          tokenAddress: address,
          poolTypes: targetPoolTypes,
        });
      } else {
        result = await enableWhitelistTokenSolana({
          tokenAddress: address,
          poolTypes: targetPoolTypes,
          isCreate: false,
        });
      }
    }

    if (isEvm) {
      if (isActive) {
        result = await disableWhitelistTokenEvm({
          tokenAddress: address,
          poolTypes: targetPoolTypes,
        });
      } else {
        result = await enableWhitelistTokenEvm({
          tokenAddress: address,
          poolTypes: targetPoolTypes,
        });
      }
    }

    if (result) {
      try {
        await syncBackendStatus(!isActive, targetPoolTypes);
      } catch (error) {
        toast.error("On-chain update succeeded but backend sync failed", {
          description: getErrorMessage({ error }),
        });
      } finally {
        await queryClient.invalidateQueries({
          queryKey: whitelistQueryKeys.listTokens().filter(Boolean),
        });
      }
    }

    setIsCallingSc(false);
  };

  return (
    <BlueSwitch
      {...switchProps}
      isLoading={isCallingSc}
      onClick={handleToggleSwitch}
    />
  );
};

export default StatusSwitch;
