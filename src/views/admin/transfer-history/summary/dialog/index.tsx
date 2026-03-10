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

        <div className="space-y-2.25 w-full">
            <div className="">

            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminTransferHistorySummaryDialog;
