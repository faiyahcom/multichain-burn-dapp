import { useState } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { cn } from "@/lib/utils";
import ActivitiesHistory from "./activities-history";
import TransactionHistoryTable from "./transaction-history";

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
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-orbitron text-base font-semibold md:text-xl lg:text-2xl 2xl:text-28px">
                    Pool History
                </p>

                {/* Tab switcher */}
                <div className="flex rounded-xl border-2 border-launchpad-border/85 bg-mb-dark-popover-item p-0.5 md:rounded-3xl md:border-4 md:p-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "rounded-lg px-2 py-1 font-inter text-xs font-semibold text-foreground transition-colors md:rounded-18px md:px-3 md:py-2 md:text-sm",
                                activeTab === tab.id
                                    ? "border border-mb-btn-launchpad/85 bg-mb-btn-launchpad/85"
                                    : "",
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {activeTab === "transactions" && (
                <TransactionHistoryTable poolDetail={poolDetail} />
            )}
            {activeTab === "activity" && (
                <ActivitiesHistory poolDetail={poolDetail} />
            )}
        </div>
    );
};

export default PoolHistory;
