import type { ReactNode } from "react";
import { chainIdToNetworkConfig } from "@/config/networks";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { useSystemStore } from "@/stores/systemStore";
import { useAuthStore } from "@/stores/authStore";
import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import AnimateIconButton from "@/components/common/animate-icon-button";
import { cn } from "@/lib/utils";

type Props = {
  /** Backend chainId of the pool (e.g. "11155111"). */
  chainId?: string;
  children: ReactNode;
  classNames?: React.ComponentProps<typeof AnimateIconButton>["classNames"];
};

/**
 * Wraps on-chain action buttons for a specific pool.
 *
 * - Wallet not connected  → renders "Connect Wallet" button.
 * - Wrong network          → renders "Switch Network" button that opens the
 *                            global SwitchNetworkModal via openSwitchNetworkModal.
 * - Correct network        → renders children as-is.
 */
export function PoolChainGuard({ chainId, children, classNames }: Props) {
  const { user } = useAuthStore();
  const { open } = useAppKit();
  const { caipAddress } = useAppKitAccount();
  const { openSwitchNetworkModal } = useSystemStore();

  const poolNetwork = chainId ? chainIdToNetworkConfig(chainId) : undefined;
  const poolNetworkId = poolNetwork?.id;

  // Wallet not connected.
  if (!user) {
    return (
      <AnimateIconButton
        iconLetter="W"
        text="Connect Wallet"
        variant="letter-icon"
        textVariant="text-container-center"
        hasGroupHover
        classNames={{
          btn: cn(
            "w-full text-center after:text-sm after:font-medium",
            classNames?.btn,
          ),
          text: cn("text-sm font-medium", classNames?.text),
          icon: cn("size-6", classNames?.icon),
        }}
        color="#966EFF"
        btnProps={{
          onClick: (e) => {
            e.stopPropagation();
            open();
          },
        }}
      />
    );
  }

  // Derive the wallet's currently connected network from caipAddress.
  const [namespace, chainRef] = caipAddress?.split(":") ?? [];
  const currentNetworkId =
    namespace && chainRef ? mapChainToSystemNetwork(namespace, chainRef) : null;

  // Wrong network — show button that opens the global switch modal.
  if (currentNetworkId !== poolNetworkId) {
    return (
      <AnimateIconButton
        iconLetter="S"
        text="Switch Network"
        variant="letter-icon"
        textVariant="text-self-center"
        hasGroupHover
        classNames={{
          btn: cn(
            "w-full text-center after:text-sm after:font-medium",
            classNames?.btn,
          ),
          text: cn("text-sm font-medium", classNames?.text),
          icon: cn("size-6", classNames?.icon),
        }}
        color="#FF8E97"
        btnProps={{
          onClick: (e) => {
            e.stopPropagation();
            openSwitchNetworkModal(currentNetworkId, poolNetworkId!);
          },
        }}
      />
    );
  }

  return <>{children}</>;
}
