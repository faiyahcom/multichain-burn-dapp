import { format, isValid, formatDistanceToNowStrict } from "date-fns";
import type { PoolKind } from "@/types/pool";

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
  if (str.length <= left + right) {
    return str;
  }
  return `${str.slice(0, left)}...${str.slice(-right)}`;
};

export const formatTimestampSecondsToDate = ({
  timestamp,
  formatStr = "dd/MM/yyyy",
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

export const formatRelativeTime = (isoTimestamp: string): string => {
  const date = new Date(isoTimestamp);
  if (!isValid(date)) return "";
  return formatDistanceToNowStrict(date, { addSuffix: true });
};

export const getAdminPoolHref = ({
  address,
  kind,
}: {
  address: string;
  kind: 0 | 1;
}): string => {
  switch (kind) {
    case 0:
      return `/admin/burn/detail/${address}`;
    case 1:
      return `/admin/swap/detail/${address}`;
    default:
      return "#";
  }
};
