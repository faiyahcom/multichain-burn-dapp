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
            <div className="flex items-end gap-10 border-b border-gray-200">
                <button
                    type="button"
                    onClick={() => setActiveTab("transactions")}
                    className="relative pb-1 text-lg font-medium transition-colors"
                >
                    <span
                        className={clsx(
                            "transition-colors",
                            activeTab === "transactions"
                                ? "text-black"
                                : "text-greyed/50 hover:text-greyed",
                        )}
                    >
                        Transactions
                    </span>
                    {activeTab === "transactions" && (
                        <div className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-active" />
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("activity")}
                    className="relative pb-1 text-lg font-medium transition-colors"
                >
                    <span
                        className={clsx(
                            "transition-colors",
                            activeTab === "activity"
                                ? "text-black"
                                : "text-greyed/50 hover:text-greyed",
                        )}
                    >
                        Pool Activity
                    </span>
                    {activeTab === "activity" && (
                        <div className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-active" />
                    )}
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

