import { useState } from "react";
import clsx from "clsx";
import ActivitiesHistory from "./activities-history";
import TransactionHistoryTable from "./transaction-history";
import type { PoolDetailResponse } from "@/types/pool";

type Tab = "transactions" | "activity";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const PoolHistory = ({ poolDetail }: Props) => {
    const [activeTab, setActiveTab] = useState<Tab>("transactions");

    return (
        <div className="mt-3 w-full py-4 pr-7">
            <div className="flex items-center gap-2 pb-6">
                <div className="h-1.5 w-1.5 bg-black" />
                <span className="text-xl font-medium">Pool History</span>
            </div>

            {/* Tabs */}
            <div className="mb-4 flex gap-6 border-b border-progress-bg">
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

            {activeTab === "transactions" ? (
                <TransactionHistoryTable poolDetail={poolDetail} />
            ) : (
                <ActivitiesHistory poolDetail={poolDetail} />
            )}
        </div>
    );
};

export default PoolHistory;
