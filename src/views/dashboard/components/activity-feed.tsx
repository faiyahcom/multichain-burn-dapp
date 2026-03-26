import {
    IconBurnCategory,
    IconSwapCategory,
    IconPairCategory,
} from "@/assets/react";
import Dot from "@/components/common/glow/dot";
import TokenDisplay from "@/components/common/token-display";
import { formatAmount } from "@/utils/helpers/numbers";
import {
    truncateString,
    formatTimestampSecondsToDate,
} from "@/utils/helpers/string";
import type { ActivityItem } from "@/services/dashboardService";
import SwapActivityImage from "/images/dashboard/swap-activity.png";
import TokenImage from "@/components/common/token-image";
import { txnKind } from "@/types/pool";

// ── Constants ─────────────────────────────────────────────────────────────────

const TXN_SLOTS = 6;

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatRelativeTime = (timestamp: string): string => {
    const secondsAgo = Math.floor(Date.now() / 1000) - Number(timestamp);
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const m = Math.floor(secondsAgo / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    if (h < 24) return `${h}h ${rm}m ago`;
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return `${d}d ${rh}h ${rm}m ago`;
};

// dot | hash | time | wallet | type | tokenOut amount | tokenIn fee
const TXN_COLS =
    "8px minmax(0,0.75fr) minmax(0,0.5fr) minmax(0,1fr) 120px minmax(0,1fr) minmax(0,1fr)";

// ── Row components ────────────────────────────────────────────────────────────

const BurnRow = ({ item }: { item: ActivityItem }) => {
    const label =
        item.executorName ??
        truncateString({ str: item.executor, left: 4, right: 4 });
    const pool = truncateString({ str: item.poolAddress, left: 4, right: 4 });
    const time = formatTimestampSecondsToDate({
        timestamp: item.timestamp,
        formatStr: "HH:mm:ss",
    });
    const amount = formatAmount(item.amountIn, item.tokenInDecimals);

    return (
        <div className="flex items-center justify-between font-inter text-[18px] font-medium">
            <div className="flex flex-nowrap items-center gap-3">
                <Dot className="bg-[#FCD298]" size={13} />
                <span className="truncate text-mb-gray-b8">
                    Burn by <span className="text-foreground">{label}</span>
                </span>
                <span className="truncate text-mb-gray-b8/60">{pool}</span>
                <IconBurnCategory className="size-13 shrink-0" />
                <span className="text-mb-gray-b8/60 tabular-nums">{time}</span>
            </div>
            <div className="flex items-center justify-end gap-3">
                <span className="font-medium">{`${amount} ${item.tokenInSymbol}`}</span>
                <TokenImage
                    src={item.tokenInImage ?? undefined}
                    alt={item.tokenInSymbol}
                    classNames={{
                        img: "size-10.5",
                    }}
                />
            </div>
        </div>
    );
};

const SwapRow = ({ item }: { item: ActivityItem }) => {
    const pool =
        truncateString({ str: item.poolAddress, left: 4, right: 4 }) ?? "";
    const poolName = item.pool?.name ? `${item.pool.name}` : "";
    const amountIn = formatAmount(item.amountIn, item.tokenInDecimals);
    const amountOut = formatAmount(item.amountOut, item.tokenOutDecimals);

    return (
        <div className="flex items-center justify-between font-inter text-[18px] font-medium">
            <div className="space-x-3">
                <Dot className="bg-[#638EDC]" size={13} />
                <span className="text-foreground">{poolName}</span>
                <span className="truncate text-mb-gray-b8/60">{pool}</span>
            </div>
            <div className="flex items-center justify-end gap-3">
                <TokenDisplay
                    symbol={item.tokenInSymbol}
                    customSymbol={item.tokenInCustomSymbol ?? item.tokenInSymbol}
                    imageUri={item.tokenInImage ?? undefined}
                    classNames={{ img: "size-10.5", container: "space-x-3" }}
                />
                <img src={SwapActivityImage} className="size-10.5 shrink-0" />
                <TokenDisplay
                    symbol={item.tokenOutSymbol}
                    customSymbol={item.tokenOutCustomSymbol ?? item.tokenOutSymbol}
                    imageUri={item.tokenOutImage ?? undefined}
                    classNames={{ img: "size-10.5", container: "space-x-3" }}
                />
                <span className="truncate text-right text-mb-gray-b8">
                    {amountIn} <span className="text-mb-gray-b8/60">→</span> {amountOut}
                </span>
            </div>
        </div>
    );
};

const TransactionRow = ({ item }: { item: ActivityItem }) => {
    const hash = truncateString({ str: item.hash, left: 6, right: 6 });
    const wallet = truncateString({ str: item.executor, left: 6, right: 6 });
    const time = formatRelativeTime(item.timestamp);
    const type = (txnKind as Record<number, string | undefined>)[item.kind] ?? `Kind ${item.kind}`;
    const amountOut = formatAmount(item.amountOut, item.tokenOutDecimals);
    const amountIn = formatAmount(item.amountIn, item.tokenInDecimals);

    return (
        <div
            className="grid items-center gap-x-3"
            style={{ gridTemplateColumns: TXN_COLS }}
        >
            <Dot className="bg-mb-btn-swap" size={13} />
            <span className="truncate">{hash}</span>
            <span className="truncate text-center">{time}</span>
            <span className="truncate text-center">{wallet}</span>
            <span className="truncate text-center">{type}</span>
            <div className="flex items-center justify-center gap-1.5">
                <span className="truncate font-bold tracking-normal">{amountOut}</span>
                <TokenDisplay
                    symbol={item.tokenOutSymbol}
                    customSymbol={item.tokenOutCustomSymbol ?? undefined}
                    imageUri={item.tokenOutImage ?? undefined}
                    classNames={{ img: "size-4" }}
                />
            </div>
            <div className="flex items-center justify-center gap-1.5">
                <span className="truncate font-bold tracking-normal">{amountIn}</span>
                <TokenDisplay
                    symbol={item.tokenInSymbol}
                    customSymbol={item.tokenInCustomSymbol ?? undefined}
                    imageUri={item.tokenInImage ?? undefined}
                    classNames={{ img: "size-4" }}
                />
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
}

export const ActivityFeed = ({
    title,
    icon,
    items,
    animKey,
    renderRow,
}: ActivityFeedProps) => (
    <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                {icon}
                <p className="text-2xl font-medium">{title}</p>
            </div>
            <div className="flex items-center gap-2">
                <Dot className="bg-[#4ADD55]" size={13} pulse />
                <span className="text-2xl font-semibold text-[#4ADD55]">Live</span>
            </div>
        </div>
        {/* Re-key on every tick to trigger the slide-up enter animation */}
        <div
            key={animKey}
            className="animate-feed-jump-in grid gap-x-12"
            style={{ gridTemplateColumns: "1fr 1fr" }}
        >
            {items.map((item) => (
                <div key={item.id}>{renderRow(item)}</div>
            ))}
        </div>
    </div>
);

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
    const slots = Array.from({ length: TXN_SLOTS }, (_, i) => visibleItems[i] ?? null);

    return (
        <div className="flex flex-col gap-2 space-y-5 px-5 py-4.5 text-primary-foreground">
            {/* Header */}
            <div className="flex items-center gap-3">
                <IconPairCategory className="size-10.75" />
                <p className="text-2xl font-medium">TRANSACTIONS</p>
            </div>
            {/* Table header */}
            <div
                className="grid gap-x-3 font-inter text-lg font-bold tracking-[0.24px]"
                style={{ gridTemplateColumns: TXN_COLS }}
            >
                <span />
                <span>Tx hash</span>
                <span className="text-center">Time</span>
                <span className="text-center">Wallet address</span>
                <span className="text-center">Type</span>
                <span className="text-center">Amount</span>
                <span className="text-center">Fee</span>
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
                        <div
                            key={`ghost-${i}`}
                            className="grid items-center gap-x-3 invisible"
                            style={{ gridTemplateColumns: TXN_COLS }}
                        >
                            <span /><span>&nbsp;</span><span /><span /><span /><span /><span />
                        </div>
                    )
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

export const BurnActivityFeed = ({ visibleItems, animKey }: ScrollingFeedProps) => (
    <ActivityFeed
        title="BURN ACTIVITY"
        icon={<IconBurnCategory className="size-10.75" />}
        items={visibleItems}
        animKey={animKey}
        renderRow={(item) => <BurnRow item={item} />}
    />
);

export const SwapActivityFeed = ({ visibleItems, animKey }: ScrollingFeedProps) => (
    <ActivityFeed
        title="SWAP ACTIVITY"
        icon={<IconSwapCategory className="size-10.75" />}
        items={visibleItems}
        animKey={animKey}
        renderRow={(item) => <SwapRow item={item} />}
    />
);
