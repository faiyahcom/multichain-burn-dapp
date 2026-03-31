import BlueSwitch from "@/components/common/blue-switch";
import { useAppKitAccount } from "@reown/appkit/react";
import { useState } from "react";
import { useDisableWhitelistTokenSolanaFn } from "../useDisableWhitelistTokenSolanaFn";
import { useDisableWhitelistTokenEvmFn } from "../useDisableWhitelistTokenEvmFn";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  whitelistService,
  type ForceUpdateWhitelistTokenStatusRequest,
} from "@/services/whitelistService";
import { whitelistQueryKeys } from "@/services/queries/queryKey";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { toast } from "@/components/common/custom-toast";
import { useCreateWhitelistTokenSolanaFn } from "../../dialog/create/useCreateWhitelistTokenSolanaFn";
import { useCreateWhitelistTokenEvmFn } from "../../dialog/create/useCreateWhitelistTokenEvmFn";
import { chainIdToNetworkConfig } from "@/config/networks";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { useSystemStore } from "@/stores/systemStore";

interface Props {
  switchProps?: React.ComponentProps<typeof BlueSwitch>;
  chainId?: string;
  address?: string;
}

const StatusSwitch: React.FC<Props> = ({ switchProps, chainId, address }) => {
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

  const {
    mutate: updateStatusWhitelistTokenStatusMutation,
    isPending: isForceUpdateWhitelistTokenStatusPending,
  } = useMutation({
    mutationFn: async (request: ForceUpdateWhitelistTokenStatusRequest) => {
      return await whitelistService.updateStatusWhitelistTokenStatus(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: whitelistQueryKeys.listTokensRoot(),
      });
    },
    onError: (error) => {
      const message = getErrorMessage({ error });
      toast.error(message);
    },
  });

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

    let result = false;

    if (isSolana) {
      if (isActive) {
        result = await disableWhitelistTokenSolana({ tokenAddress: address });
      } else {
        result = await enableWhitelistTokenSolana({ tokenAddress: address });
      }
    }

    if (isEvm) {
      if (isActive) {
        result = await disableWhitelistTokenEvm({ tokenAddress: address });
      } else {
        result = await enableWhitelistTokenEvm({ tokenAddress: address });
      }
    }

    if (result) {
      updateStatusWhitelistTokenStatusMutation({
        chainId,
        address,
        active: !isActive,
      });
    }

    setIsCallingSc(false);
  };

  const isLoading = isForceUpdateWhitelistTokenStatusPending || isCallingSc;

  return (
    <BlueSwitch
      {...switchProps}
      isLoading={isLoading}
      onClick={handleToggleSwitch}
    />
  );
};

export default StatusSwitch;
