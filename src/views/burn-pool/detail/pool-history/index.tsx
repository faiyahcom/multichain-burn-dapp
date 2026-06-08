import { useState } from "react";
import { DownloadIcon } from "lucide-react";
import ActivitiesHistory from "./activities-history";
import TransactionHistoryTable from "./transaction-history";
import type { PoolDetailResponse } from "@/types/pool";
import clsx from "clsx";
import { poolService } from "@/services/poolService";

type Props = {
    poolDetail?: PoolDetailResponse;
};

type TabType = "transactions" | "activity";

const PoolHistory = ({ poolDetail }: Props) => {
    const [activeTab, setActiveTab] = useState<TabType>("transactions");
    const [isExporting, setIsExporting] = useState(false);
    // Keep in sync with excludeKinds in transaction-history.tsx
    const excludeKinds = [2].join(",");

    const handleExport = async () => {
        if (!poolDetail?.pool?.address || isExporting) return;
        setIsExporting(true);
        try {
            await poolService.exportPoolTxns(poolDetail.pool.address, excludeKinds);
        } catch {
            // silent
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="mt-3 w-full py-4">
            {/* Header */}
            <div className="flex items-center gap-2 pb-6">
                <div className="h-1.5 w-1.5 bg-black" />
                <span className="text-xl font-medium">Pool History</span>
            </div>

            {/* Tabs */}
            <div className="flex items-end justify-between border-b border-gray-200">
                <div className="flex items-end gap-10">
                {/* Transactions Tab */}
                <button
                    onClick={() => setActiveTab("transactions")}
                    className="relative pb-1 text-lg font-medium transition-colors"
                >
                    <span
                        className={clsx(
                            "transition-colors",
                            activeTab === "transactions"
                                ? "text-black"
                                : "text-greyed/50 hover:text-greyed"
                        )}
                    >
                        Transactions
                    </span>

                    {activeTab === "transactions" && (
                        <div className="absolute left-0 bottom-0 h-1 w-full rounded-full bg-purple-600" />
                    )}
                </button>

                {/* Pool Activity Tab */}
                <button
                    onClick={() => setActiveTab("activity")}
                    className="relative pb-1 text-lg font-medium transition-colors"
                >
                    <span
                        className={clsx(
                            "transition-colors",
                            activeTab === "activity"
                                ? "text-black"
                                : "text-greyed/50 hover:text-greyed"
                        )}
                    >
                        Pool Activity
                    </span>

                    {activeTab === "activity" && (
                        <div className="absolute left-0 bottom-0 h-1 w-full rounded-full bg-active" />
                    )}
                </button>
                </div>
                {activeTab === "transactions" && (
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="mb-1 flex items-center gap-1.5 text-sm text-greyed disabled:opacity-50"
                    >
                        <DownloadIcon className="size-3.5" />
                        {isExporting ? "Exporting..." : "Export"}
                    </button>
                )}
            </div>
            <>
                {activeTab === "transactions" && (
                    <TransactionHistoryTable poolDetail={poolDetail} />
                )}

                {activeTab === "activity" && (
                    <ActivitiesHistory poolDetail={poolDetail} />
                )}
            </>
        </div>
    );
};

export default PoolHistory;