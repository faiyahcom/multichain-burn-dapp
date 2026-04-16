import {
  IconBurnCategory,
  IconPairCategory,
  IconSwapCategory,
} from "@/assets/react";
import Dot from "@/components/common/glow/dot";
import NoData from "@/components/common/no-data";
import TokenDisplay from "@/components/common/token-display";
import { FEED_PAGE_SIZE, TXN_PAGE_SIZE } from "@/hooks/useScrollingFeed";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/services/dashboardService";
import { POOL_KIND } from "@/types/pool";
import { getExplorerUrl } from "@/utils/helpers/networks";
import { formatAmount } from "@/utils/helpers/numbers";
import {
  formatRelativeTime,
  formatTimestampSecondsToDate,
  truncateString,
} from "@/utils/helpers/string";
import { Link } from "@tanstack/react-router";
import SwapActivityImage from "/images/dashboard/swap-activity.png";

// ── Grid Constants (Responsive & Synced) ──────────────────────────────────────

// Mobile: text-xs (12px) | Tablet: text-base (16px) | 2xl: 18px
const ROW_BURN_GRID =
  "grid grid-cols-[minmax(0,1.5fr)_42px_minmax(0,1fr)] md:grid-cols-[minmax(0,1.55fr)_60px_minmax(0,1fr)] items-center gap-2 md:gap-4 font-inter text-xs md:text-base 2xl:text-[18px] font-medium";

const ROW_SWAP_GRID =
  "grid grid-cols-[minmax(0,1fr)_90px_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_110px_minmax(0,1fr)] items-center gap-2 md:gap-4 font-inter text-xs md:text-base 2xl:text-[18px] font-medium";

// ── Row components ────────────────────────────────────────────────────────────

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
    <Link
      className={cn(ROW_BURN_GRID, "text-tiny lg:text-sm 2xl:text-md")}
      to="/burn/detail/$address"
      params={{ address: item.poolAddress }}
      search={{
        depositReward: undefined,
      }}
    >
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        <Dot className="size-2.5 shrink-0 bg-mb-burn-dot md:size-3.25" />
        <span className="truncate text-mb-gray-b8">
          Burn by <span className="text-foreground">{label}</span>
        </span>
        <span className="truncate text-mb-gray-b8/60">{taker}</span>
      </div>

      <div className="flex items-center justify-center gap-1 md:gap-2">
        <IconBurnCategory className="size-7 shrink-0 md:size-10 2xl:size-10.75" />
        <span className="text-mb-gray-b8/60 tabular-nums">{time}</span>
      </div>

      <div className="flex items-center justify-end gap-1.5 tabular-nums md:gap-3">
        <span className="text-right text-mb-burn-activity-amount">
          {amount} {item.tokenInCustomSymbol ?? item.tokenInSymbol}
        </span>
        <TokenDisplay
          symbol={item.tokenInSymbol}
          customSymbol={item.tokenInCustomSymbol ?? undefined}
          imageUri={item.tokenInImage ?? undefined}
          classNames={{ img: "size-5 md:size-7 2xl:size-8.5" }}
          hasSymbol={false}
        />
      </div>
    </Link>
  );
};

const SwapRow = ({ item }: { item: ActivityItem }) => {
  const taker = truncateString({ str: item.executor, left: 4, right: 4 }) ?? "";
  const poolName = item.pool?.name ? `${item.pool.name}` : "";
  const amountIn = formatAmount(item.amountIn, item.tokenInDecimals, 3);
  const amountOut = formatAmount(item.amountOut, item.tokenOutDecimals, 3);

  return (
    <Link
      className={cn(ROW_SWAP_GRID, "py-1 text-tiny lg:text-sm 2xl:text-md")}
      to="/swap/detail/$address"
      params={{ address: item.poolAddress }}
      search={{
        depositReward: undefined,
      }}
    >
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        <Dot className="size-2.5 shrink-0 bg-mb-swap-dot md:size-3.25" />
        <span className="truncate text-foreground">{poolName}</span>
        <span className="truncate text-mb-gray-b8/60">{taker}</span>
      </div>

      <div className="grid w-full grid-cols-[1fr_20px_1fr] items-center gap-1 md:grid-cols-[1fr_34px_1fr] md:gap-2">
        <TokenDisplay
          symbol={item.tokenInSymbol}
          customSymbol={item.tokenInCustomSymbol ?? undefined}
          imageUri={item.tokenInImage ?? undefined}
          classNames={{
            img: "size-5 md:size-7 2xl:size-8.5",
            container: "flex-row-reverse gap-1 md:gap-2",
          }}
        />
        <img
          src={SwapActivityImage}
          className="size-5 shrink-0 md:size-7 2xl:size-8.5"
        />
        <TokenDisplay
          symbol={item.tokenOutSymbol}
          customSymbol={item.tokenOutCustomSymbol ?? undefined}
          imageUri={item.tokenOutImage ?? undefined}
          classNames={{
            img: "size-5 md:size-7 2xl:size-8.5",
            container: "gap-1 md:gap-2",
          }}
        />
      </div>

      <div className="truncate text-right text-mb-swap-activity-amount tabular-nums">
        {amountIn} → {amountOut}
      </div>
    </Link>
  );
};

const TransactionRow = ({ item }: { item: ActivityItem }) => {
  const hash = truncateString({ str: item.hash, left: 8, right: 8 });
  const wallet = truncateString({ str: item.executor, left: 6, right: 6 });
  const time = formatRelativeTime(item.timestamp);
  const type = POOL_KIND[item.poolKind] === "burn_pool" ? "Burn" : "Swap";
  const fee = formatAmount(item.fee || "0", item.tokenOutDecimals);
  const amountIn = formatAmount(item.amountIn, item.tokenInDecimals);
  const scanUrl = getExplorerUrl(item.chainId, item.hash, "tx");

  const handleRowClick = () => {
    if (scanUrl) {
      window.open(scanUrl, "_blank");
    }
  };

  return (
    <div
      className="txn-grid cursor-pointer py-1 transition-opacity hover:opacity-70 md:py-0"
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleRowClick();
        }
      }}
    >
      <Dot className="size-2.5 bg-mb-btn-swap md:size-3.25" />
      <span className="truncate">{hash}</span>
      <span className="hidden truncate text-center md:block">{time}</span>
      <span className="hidden truncate text-center md:block">{wallet}</span>
      <span className="truncate text-center">{type}</span>
      <div className="flex items-center justify-center gap-1 md:gap-1.5">
        <TokenDisplay
          symbol={item.tokenInSymbol}
          customSymbol={item.tokenInCustomSymbol ?? undefined}
          imageUri={item.tokenInImage ?? undefined}
          classNames={{ img: "size-3.5 md:size-4" }}
          hasSymbol={false}
        />
        <span className="truncate font-bold tracking-normal">{amountIn}</span>
        <span className="hidden sm:inline">
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
  animKey: number;
  renderRow: (item: ActivityItem) => React.ReactNode;
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

  const isEmpty = items.length === 0;

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          {icon}
          <p className="text-base font-medium tracking-wide uppercase md:text-xl 2xl:text-2xl">
            {title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dot className="size-2.5 bg-mb-live-green md:size-3.25" pulse />
          <span className="font-inter text-base font-semibold text-mb-live-green md:text-xl 2xl:text-2xl">
            Live
          </span>
        </div>
      </div>

      {isEmpty ? (
        <NoData
          classNames={{
            container: "sm:py-12.5",
          }}
          text="No data"
        />
      ) : (
        <div
          key={animKey}
          className="grid animate-feed-jump-in grid-cols-1 gap-y-0 lg:grid-cols-2 lg:gap-x-24 2xl:gap-x-40 2xl:gap-y-4"
        >
          {slots.map((item, i) =>
            item ? (
              <div key={item.id} className="py-0 2xl:py-1">
                {renderRow(item)}
              </div>
            ) : (
              <div
                key={`ghost-${i}`}
                className={cn(
                  "pointer-events-none invisible py-1.5 2xl:py-[11.5px]",
                  ghostRowClassName,
                )}
              >
                &nbsp;
              </div>
            ),
          )}
        </div>
      )}
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
  const slots = Array.from(
    { length: TXN_PAGE_SIZE },
    (_, i) => visibleItems[i] ?? null,
  );

  return (
    <div className="flex flex-col gap-4 overflow-x-auto overflow-y-hidden px-3 py-4.5 text-primary-foreground md:px-5">
      <div className="flex items-center gap-2 md:gap-3">
        <IconPairCategory className="size-7 md:size-10 2xl:size-10.75" />
        <p className="text-base font-medium md:text-xl 2xl:text-2xl">
          TRANSACTIONS
        </p>
      </div>

      <div className="txn-grid font-inter text-xs font-bold tracking-[0.24px] opacity-60 md:text-base 2xl:text-lg">
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
        className="animate-feed-jump-in space-y-3 font-inter text-xs tracking-[0.24px] md:space-y-5 md:text-base 2xl:text-lg"
      >
        {slots.map((item, i) =>
          item ? (
            <TransactionRow key={item.id} item={item} />
          ) : (
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
    title="Burn Activity"
    icon={<IconBurnCategory className="size-7 md:size-10 2xl:size-10.75" />}
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
    title="Swap Activity"
    icon={<IconSwapCategory className="size-7 md:size-10 2xl:size-10.75" />}
    items={visibleItems}
    animKey={animKey}
    renderRow={(item) => <SwapRow item={item} />}
    ghostRowClassName={ROW_SWAP_GRID}
  />
);
