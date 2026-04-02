import { useState } from "react";
import ActivitiesHistory from "./activities-history";
import TransactionHistoryTable from "./transaction-history";
import type { PoolDetailResponse } from "@/types/pool";
import { cn } from "@/lib/utils";

type Props = {
    poolDetail?: PoolDetailResponse;
};

type TabType = "transactions" | "activity";

const TABS: { id: TabType; label: string }[] = [
    { id: "transactions", label: "Transactions" },
    { id: "activity", label: "Pool Activity" },
];

const PoolHistory = ({ poolDetail }: Props) => {
    const [activeTab, setActiveTab] = useState<TabType>("transactions");

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="font-orbitron text-28px font-semibold">Pool History</p>

                {/* Tab switcher */}
                <div className="flex rounded-3xl border-4 border-swap-border/85 bg-mb-dark-popover-item p-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "rounded-18px px-3 py-2 font-inter text-sm font-semibold text-foreground transition-colors",
                                activeTab === tab.id
                                    ? "border border-swap-border/85 bg-swap-border/85"
                                    : "",
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {activeTab === "transactions" ? (
                <TransactionHistoryTable poolDetail={poolDetail} />
            ) : (
                <ActivitiesHistory poolDetail={poolDetail} />
            )}
        </div>
    );
};

export default PoolHistory;
