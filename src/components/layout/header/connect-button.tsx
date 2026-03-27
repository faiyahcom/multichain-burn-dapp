import {
  getVariantBorderClassName,
  getVariantShadowClassName,
} from "@/components/common/glow/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppKit } from "@reown/appkit/react";

const ConnectButton = () => {
  const { open } = useAppKit();

  const handleConnect = async () => {
    await open();
  };

  return (
    <Button
      className={cn(
        "flex items-center",
        getVariantBorderClassName({ variant: "swap" }),
        getVariantShadowClassName({ variant: "swap" }),
        "rounded-24px bg-transparent px-6 py-5.75 hover:bg-transparent",
      )}
      onClick={handleConnect}
    >
      <span className="text-15px font-semibold">CONNECT WALLET</span>
    </Button>
  );
};

export default ConnectButton;
