import { chainIdToNetworkConfig } from "@/config/networks";
import { shortenNumber } from "@/utils/helpers/numbers";

interface Props {
  chainId: string;
  txnCount: number;
  amount: number;
  onClick?: () => void;
}

const StatCard: React.FC<Props> = ({
  chainId,
  txnCount,
  amount,
  onClick,
}) => {
  const networkConfig = chainIdToNetworkConfig(chainId);

  return (
    <div
      className="cursor-pointer rounded-md-plus border-2 border-inactive p-4.75"
      onClick={onClick}
    >
      <p className="text-15px font-normal">{networkConfig?.label}</p>
      <p className="text-xs font-normal text-secondary-text">
        {shortenNumber({ number: txnCount })} transfer{txnCount > 1 ? "s" : ""} · {shortenNumber({ number: amount })} token
        {amount > 1 ? "s" : ""}
      </p>
    </div>
  );
};

export default StatCard;
