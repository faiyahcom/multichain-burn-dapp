import type { PoolItemType } from "@/types/admin/master-pool-management";
import { PoolKindCodeEnum } from "@/types/pool";
import { format, isValid } from "date-fns";

export const truncateString = ({
  str,
  left = 6,
  right = 4,
}: {
  str?: string;
  left?: number;
  right?: number;
}) => {
  if (typeof str !== "string") {
    return str;
  }
  if (right === 0) {
    return str.length > left ? `${str.slice(0, left)}...` : str;
  }
  if (str.length <= left + right + 1) {
    // 1 for the ... in the middle
    return str;
  }
  return `${str.slice(0, left)}...${str.slice(-right)}`;
};

export const formatTimestampSecondsToDate = ({
  timestamp,
  formatStr = "yyyy/MM/dd",
  notFound = "N/A",
}: {
  timestamp?: string; // timestamp seconds
  formatStr?: string;
  notFound?: string;
}) => {
  if (!timestamp) return notFound;
  if (timestamp === "0") return notFound;
  const date = new Date(Number(timestamp) * 1000);
  if (!isValid(date)) return notFound;
  return format(date, formatStr);
};

/** Converts a unix-seconds timestamp string to a human-readable "time ago" string. */
export const formatRelativeTime = (timestamp: string): string => {
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

/** Formats a number of seconds into HH:MM:SS countdown string. */
export const formatCountdown = (totalSeconds: number): string => {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export const getPoolHref = (
  pool: Pick<PoolItemType, "address" | "kind">,
): string => {
  const { address, kind } = pool;
  switch (kind) {
    case PoolKindCodeEnum.Burn:
      return `/burn/detail/${address}`;

    case PoolKindCodeEnum.Swap:
      return `/swap/detail/${address}`;

    case PoolKindCodeEnum.Stake:
      return `/staking/detail/${address}`;

    case PoolKindCodeEnum.Launchpad:
      return `/launchpad/detail/${address}`;

    default:
      void (kind satisfies never); // exhaustive check
      return "";
  }
};
