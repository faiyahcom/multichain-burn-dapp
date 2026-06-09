import { useState } from "react";
import clsx from "clsx";
import { DownloadIcon } from "lucide-react";
import ActivitiesHistory from "./activities-history";
import TransactionHistoryTable from "./transaction-history";
import type { PoolDetailResponse } from "@/types/pool";
import { poolService } from "@/services/poolService";

type Tab = "transactions" | "activity";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const PoolHistory = ({ poolDetail }: Props) => {
    const [activeTab, setActiveTab] = useState<Tab>("transactions");
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingActivities, setIsExportingActivities] = useState(false);
    const excludeKinds = [2, 3, 5, 6, 10].join(",");

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

    const handleExportActivities = async () => {
        if (!poolDetail?.pool?.address || isExportingActivities) return;
        setIsExportingActivities(true);
        try {
            await poolService.exportPoolActivities(poolDetail.pool.address);
        } catch {
            // silent
        } finally {
            setIsExportingActivities(false);
        }
    };

    return (
        <div className="mt-3 w-full py-4 pr-7">
            <div className="flex items-center gap-2 pb-6">
                <div className="h-1.5 w-1.5 bg-black" />
                <span className="text-xl font-medium">Pool History</span>
            </div>

            {/* Tabs */}
            <div className="mb-4 flex items-end justify-between border-b border-progress-bg">
                <div className="flex gap-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab("transactions")}
                        className={clsx(
                            "pb-2 text-base font-medium transition-colors",
                            activeTab === "transactions"
                                ? "border-b-2 border-mb-btn-stake text-mb-btn-stake"
                                : "text-greyed hover:text-foreground",
                        )}
                    >
                        Transactions
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("activity")}
                        className={clsx(
                            "pb-2 text-base font-medium transition-colors",
                            activeTab === "activity"
                                ? "border-b-2 border-mb-btn-stake text-mb-btn-stake"
                                : "text-greyed hover:text-foreground",
                        )}
                    >
                        Pool Activity
                    </button>
                </div>
                {activeTab === "transactions" && (
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-1.5 text-sm disabled:opacity-50 border border-greyed/50 rounded px-2 py-1"
                    >
                        <DownloadIcon className="size-3.5" />
                        {isExporting ? "Exporting..." : "Export"}
                    </button>
                )}
                {activeTab === "activity" && (
                    <button
                        type="button"
                        onClick={handleExportActivities}
                        disabled={isExportingActivities}
                        className="flex items-center gap-1.5 text-sm disabled:opacity-50 border border-greyed/50 rounded px-2 py-1"
                    >
                        <DownloadIcon className="size-3.5" />
                        {isExportingActivities ? "Exporting..." : "Export"}
                    </button>
                )}
            </div>

            {activeTab === "transactions" ? (
                <TransactionHistoryTable poolDetail={poolDetail} />
            ) : (
                <ActivitiesHistory poolDetail={poolDetail} />
            )}
        </div>
    );
};

export default PoolHistory;
