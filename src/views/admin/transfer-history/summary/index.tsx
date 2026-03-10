import { whitelistUserQueryKeys } from "@/services/queries/queryKey";
import { whitelistUserService } from "@/services/whitelistUserService";
import { sciToFormatted } from "@/utils/helpers/numbers";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { DialogData } from "./dialog";
import AdminTransferHistorySummaryDialog from "./dialog";
import StatCard from "./stat-card";

const AdminTransferHistorySummary = () => {
  const [dialogData, setDialogData] = useState<DialogData | null>(null);

  // The analysis data has an array of info for each token
  const { data: analysisData } = useQuery({
    queryKey: whitelistUserQueryKeys.analysis(),
    queryFn: () => whitelistUserService.getAnalysis(),
  });

  const groupedAnalysisData: {
    chainId: string;
    txnCount: number;
    totalAmount: number;
  }[] = useMemo(() => {
    const grouped =
      analysisData?.analysis?.reduce(
        (acc, item) => {
          const amount = Number(
            sciToFormatted(item.totalAmount, item.tokenDecimals),
          );

          if (!acc[item.chainId]) {
            acc[item.chainId] = {
              chainId: item.chainId,
              txnCount: 0,
              totalAmount: 0,
            };
          }

          acc[item.chainId].txnCount += item.txnCount;
          acc[item.chainId].totalAmount += amount;

          return acc;
        },
        {} as Record<
          string,
          { chainId: string; txnCount: number; totalAmount: number }
        >,
      ) ?? {};

    return Object.values(grouped);
  }, [analysisData]);

  return (
    <>
      <div className="mb-8.75 space-y-4.25 px-13.5 pt-12.75">
        <div className="space-y-1 pl-7.5">
          <h1 className="text-3xl font-semibold">Transfer History</h1>
          <p className="text-base text-secondary-text">
            View all completed token transfers and their details
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6.25 md:grid-cols-2 lg:grid-cols-4">
          {groupedAnalysisData?.map((item) => (
            <StatCard
              key={item.chainId}
              chainId={item.chainId}
              txnCount={item.txnCount}
              amount={item.totalAmount}
              onClick={() => {
                const filteredData = analysisData?.analysis?.filter(
                  (x) => x.chainId === item.chainId,
                );
                setDialogData({
                  chainId: item.chainId,
                  list: filteredData ?? [],
                });
              }}
            />
          ))}
        </div>
      </div>
      <AdminTransferHistorySummaryDialog
        data={dialogData}
        setData={setDialogData}
      />
    </>
  );
};

export default AdminTransferHistorySummary;
