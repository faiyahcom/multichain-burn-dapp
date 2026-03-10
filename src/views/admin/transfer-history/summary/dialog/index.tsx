import NetworkDisplay from "@/components/common/network-display";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { chainIdToNetworkConfig } from "@/config/networks";
import type { WhitelistTransferHistoryAnalysisItem } from "@/services/whitelistUserService";
import { sciToFormatted } from "@/utils/helpers/numbers";

export interface DialogData {
  chainId: string;
  list: WhitelistTransferHistoryAnalysisItem[];
}

interface Props {
  data: DialogData | null;
  setData: (data: DialogData | null) => void;
}

const AdminTransferHistorySummaryDialog: React.FC<Props> = ({
  data,
  setData,
}) => {
  const networkConfig = data?.chainId
    ? chainIdToNetworkConfig(data?.chainId)
    : undefined;

  const tokenCount = data?.list?.length ?? 0;
  const totalTransfers =
    data?.list?.reduce((sum, item) => {
      return sum + item.txnCount;
    }, 0) ?? 0;

  if (!networkConfig || !data?.chainId) {
    return null;
  }

  return (
    <Dialog open={!!data} onOpenChange={(open) => setData(open ? data : null)}>
      <DialogContent className="gap-4.25 sm:max-w-154.75">
        <DialogHeader className="gap-1">
          <DialogTitle>{networkConfig?.label} Token Breakdown</DialogTitle>
          <DialogDescription>
            Detailed breakdown of all tokens transferred on the{" "}
            {networkConfig?.label} network
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2.5">
          <p className="text-15px font-normal text-secondary-text">
            All token balances on
          </p>
          <NetworkDisplay
            chainId={data?.chainId}
            classNames={{
              img: "size-3.75",
              label: "font-bold text-15px",
            }}
          />
        </div>

        <div className="w-full space-y-2.25">
          <div className="grid grid-cols-3 rounded-5px bg-inactive py-1.75 *:text-center *:text-base *:font-bold">
            <div>Token</div>
            <div>Transfers</div>
            <div>Amount</div>
          </div>

          <div
            className="max-h-[44dvh] space-y-2.25 overflow-y-auto"
            style={{
              scrollbarGutter: "stable both-edges",
            }}
          >
            {data?.list?.map((item) => (
              <div
                className="grid grid-cols-3 rounded-5px bg-inactive/50 py-1.75 *:text-center *:text-15px *:font-normal"
                key={item.tokenAddress}
              >
                <div>{item.tokenSymbol}</div>
                <div>{item.txnCount}</div>
                <div>
                  {sciToFormatted(item.totalAmount, item.tokenDecimals)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-15px font-normal text-secondary-text">
          {totalTransfers} total transfers across {tokenCount} tokens
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AdminTransferHistorySummaryDialog;
