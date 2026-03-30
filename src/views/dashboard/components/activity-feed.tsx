import {
    IconBurnCategory,
    IconSwapCategory,
    IconPairCategory,
} from "@/assets/react";
import Dot from "@/components/common/glow/dot";
import TokenDisplay from "@/components/common/token-display";
import { formatAmount, shortenNumber } from "@/utils/helpers/numbers";
import {
    truncateString,
    formatTimestampSecondsToDate,
    formatRelativeTime,
} from "@/utils/helpers/string";
import { FEED_PAGE_SIZE, TXN_PAGE_SIZE } from "@/hooks/useScrollingFeed";
import type { ActivityItem } from "@/services/dashboardService";
import SwapActivityImage from "/images/dashboard/swap-activity.png";
import { POOL_KIND } from "@/types/pool";
import { cn } from "@/lib/utils";

// ── Row components ────────────────────────────────────────────────────────────

const ROW_BURN_GRID =
    "grid grid-cols-[minmax(0,1.9fr)_60px_minmax(0,1fr)] items-center gap-4 font-inter text-[18px] font-medium";
const ROW_SWAP_GRID =
    "grid grid-cols-[minmax(0,1fr)_160px_minmax(0,1fr)] items-center gap-4 font-inter text-[18px] font-medium";

const BurnRow = ({ item }: { item: ActivityItem }) => {
    const taker = truncateString({ str: item.executor, left: 4, right: 4 });
    const label = truncateString({
        str: item.executorName ?? taker,
        left: 4,
        right: 4,
    });
    const time = formatTimestampSecondsToDate({
        timestamp: item.timestamp,
        formatStr: "HH:mm:ss",
    });
    const amount = formatAmount(item.amountIn, item.tokenInDecimals, 3);

    return (
        <div className={ROW_BURN_GRID}>
            {/* LEFT */}
            <div className="flex min-w-0 items-center gap-3">
                <Dot className="shrink-0 bg-mb-burn-dot" size={13} />
                <span className="truncate text-mb-gray-b8">
                    Burn by <span className="text-foreground">{label}</span>
                </span>
                <span className="truncate text-mb-gray-b8/60">{taker}</span>
            </div>

            {/* MIDDLE (ICON COLUMN - ALIGNED) */}
            <div className="flex items-center justify-center gap-2">
                <IconBurnCategory className="size-10.75 shrink-0" />
                <span className="text-mb-gray-b8/60 tabular-nums">{time}</span>
            </div>

            {/* RIGHT */}
            <div className="flex items-center justify-end gap-3 tabular-nums">
                <span className="text-right text-mb-burn-activity-amount">
                    {amount} {item.tokenInCustomSymbol ?? item.tokenInSymbol}
                </span>
                <TokenDisplay
                    symbol={item.tokenInSymbol}
                    customSymbol={item.tokenInCustomSymbol ?? undefined}
                    imageUri={item.tokenInImage ?? undefined}
                    classNames={{
                        img: "size-8.5",
                    }}
                    hasSymbol={false}
                />
            </div>
        </div>
    );
};

const SwapRow = ({ item }: { item: ActivityItem }) => {
    const taker = truncateString({ str: item.executor, left: 4, right: 4 }) ?? "";
    const poolName = item.pool?.name ? `${item.pool.name}` : "";
    const amountIn = formatAmount(item.amountIn, item.tokenInDecimals, 3);
    const amountOut = formatAmount(item.amountOut, item.tokenOutDecimals, 3);

    return (
        <div className={cn(ROW_SWAP_GRID, "pb-2")}>
            {/* LEFT */}
            <div className="flex min-w-0 items-center gap-3">
                <Dot className="shrink-0 bg-mb-swap-dot" size={13} />
                <span className="truncate text-foreground">{poolName}</span>
                <span className="truncate text-mb-gray-b8/60">{taker}</span>
            </div>

            {/* MIDDLE (ICON COLUMN - ALIGNED) */}
            <div className="grid w-full grid-cols-[1fr_34px_1fr] items-center gap-2">
                <TokenDisplay
                    symbol={item.tokenInSymbol}
                    customSymbol={item.tokenInCustomSymbol ?? undefined}
                    imageUri={item.tokenInImage ?? undefined}
                    classNames={{
                        img: "size-8.5",
                        container: "flex-row-reverse gap-2",
                    }}
                />
                <img src={SwapActivityImage} className="size-8.5 shrink-0" />
                <TokenDisplay
                    symbol={item.tokenOutSymbol}
                    customSymbol={item.tokenOutCustomSymbol ?? undefined}
                    imageUri={item.tokenOutImage ?? undefined}
                    classNames={{
                        img: "size-8.5",
                        container: "gap-2",
                    }}
                />
            </div>

            {/* RIGHT */}
            <div className="truncate text-right text-mb-swap-activity-amount tabular-nums">
                {amountIn} → {amountOut}
            </div>
        </div>
    );
};

const TransactionRow = ({ item }: { item: ActivityItem }) => {
    const hash = truncateString({ str: item.hash, left: 6, right: 6 });
    const wallet = truncateString({ str: item.executor, left: 6, right: 6 });
    const time = formatRelativeTime(item.timestamp);
    const type = POOL_KIND[item.poolKind] === "burn_pool" ? "Burn" : "Swap";
    const fee = shortenNumber({ number: Number(item.fee) }) ?? "0";
    const amountIn = formatAmount(item.amountIn, item.tokenInDecimals);

    return (
        <div className="txn-grid">
            <Dot className="bg-mb-btn-swap" size={13} />
            <span className="truncate">{hash}</span>
            <span className="hidden truncate text-center md:block">{time}</span>
            <span className="hidden truncate text-center md:block">{wallet}</span>
            <span className="truncate text-center">{type}</span>
            <div className="flex items-center justify-center gap-1.5">
                <TokenDisplay
                    symbol={item.tokenInSymbol}
                    customSymbol={item.tokenInCustomSymbol ?? undefined}
                    imageUri={item.tokenInImage ?? undefined}
                    classNames={{ img: "size-4" }}
                    hasSymbol={false}
                />
                <span className="truncate font-bold tracking-normal">{amountIn}</span>
                <span className="">
                    {item.tokenInCustomSymbol ?? item.tokenInSymbol}
                </span>
            </div>
            <div className="hidden items-center justify-center gap-1.5 md:flex">
                <span className="truncate font-bold tracking-normal">{fee}</span>
            </div>
        </div>
    );
};

// ── Activity feed (burn / swap, 2 items per visual row) ───────────────────────

interface ActivityFeedProps {
    title: string;
    icon: React.ReactNode;
    items: ActivityItem[];
    /**
     * Incremented on every page jump. Used as the React `key` on the items
     * container so it re-mounts with a CSS enter-animation on each tick.
     */
    animKey: number;
    renderRow: (item: ActivityItem) => React.ReactNode;
    /** Applied to ghost placeholder rows so they match the real row height. */
    ghostRowClassName?: string;
}

export const ActivityFeed = ({
    title,
    icon,
    items,
    animKey,
    renderRow,
    ghostRowClassName,
}: ActivityFeedProps) => {
    const slots = Array.from(
        { length: FEED_PAGE_SIZE },
        (_, i) => items[i] ?? null,
    );

    return (
        <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {icon}
                    <p className="text-2xl font-medium">{title}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Dot className="bg-mb-live-green" size={13} pulse />
                    <span className="font-inter text-2xl font-semibold text-mb-live-green">
                        Live
                    </span>
                </div>
            </div>
            {/* Re-key on every tick to trigger the slide-up enter animation */}
            <div
                key={animKey}
                className="grid animate-feed-jump-in grid-cols-1 gap-x-12 sm:grid-cols-2"
            >
                {slots.map((item, i) =>
                    item ? (
                        <div key={item.id}>{renderRow(item)}</div>
                    ) : (
                        <div
                            key={`ghost-${i}`}
                            className={cn("pointer-events-none invisible", ghostRowClassName)}
                        >
                            &nbsp;
                        </div>
                    ),
                )}
            </div>
        </div>
    );
};

// ── Transaction feed (full-width table) ───────────────────────────────────────

export const TransactionFeed = ({
    visibleItems,
    animKey,
}: {
    visibleItems: ActivityItem[];
    animKey: number;
}) => {
    // Always render exactly TXN_SLOTS rows — ghost rows keep the layout height
    // stable and prevent content from jumping when item count changes.
    const slots = Array.from(
        { length: TXN_PAGE_SIZE },
        (_, i) => visibleItems[i] ?? null,
    );

    return (
        <div className="flex flex-col gap-2 space-y-5 px-5 py-4.5 text-primary-foreground">
            {/* Header */}
            <div className="flex items-center gap-3">
                <IconPairCategory className="size-10.75" />
                <p className="text-2xl font-medium">TRANSACTIONS</p>
            </div>
            {/* Table header */}
            <div className="txn-grid font-inter text-lg font-bold tracking-[0.24px]">
                <span />
                <span>Tx hash</span>
                <span className="hidden text-center md:block">Time</span>
                <span className="hidden text-center md:block">Wallet address</span>
                <span className="text-center">Type</span>
                <span className="text-center">Amount</span>
                <span className="hidden text-center md:block">Fee</span>
            </div>
            <div
                key={animKey}
                className="animate-feed-jump-in space-y-5 font-inter text-lg tracking-[0.24px]"
            >
                {slots.map((item, i) =>
                    item ? (
                        <TransactionRow key={item.id} item={item} />
                    ) : (
                        // Invisible placeholder preserves the row height
                        <div key={`ghost-${i}`} className="invisible txn-grid">
                            <span />
                            <span>&nbsp;</span>
                            <span className="hidden md:block" />
                            <span className="hidden md:block" />
                            <span />
                            <span />
                            <span className="hidden md:block" />
                        </div>
                    ),
                )}
            </div>
        </div>
    );
};

// ── Convenience exports ───────────────────────────────────────────────────────

interface ScrollingFeedProps {
    visibleItems: ActivityItem[];
    animKey: number;
}

export const BurnActivityFeed = ({
    visibleItems,
    animKey,
}: ScrollingFeedProps) => (
    <ActivityFeed
        title="BURN ACTIVITY"
        icon={<IconBurnCategory className="size-10.75" />}
        items={visibleItems}
        animKey={animKey}
        renderRow={(item) => <BurnRow item={item} />}
        ghostRowClassName={ROW_BURN_GRID}
    />
);

export const SwapActivityFeed = ({
    visibleItems,
    animKey,
}: ScrollingFeedProps) => (
    <ActivityFeed
        title="SWAP ACTIVITY"
        icon={<IconSwapCategory className="size-10.75" />}
        items={visibleItems}
        animKey={animKey}
        renderRow={(item) => <SwapRow item={item} />}
        ghostRowClassName={cn(ROW_SWAP_GRID, "pb-6")}
    />
);
