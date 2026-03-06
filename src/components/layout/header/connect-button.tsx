import { IconUpload } from "@/assets/react";
import { Button } from "@/components/ui/button";
import { useAppKit } from "@reown/appkit/react";

const ConnectButton = () => {
  const { open } = useAppKit();

  const handleConnect = async () => {
    await open();
  };

  return (
    <Button className="flex items-center" onClick={handleConnect}>
      <IconUpload />
      <span className="text-sm font-semibold">Connect wallet</span>
    </Button>
  );
};

export default ConnectButton;
