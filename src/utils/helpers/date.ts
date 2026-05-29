import { endOfDay, isValid, startOfDay } from "date-fns";
import { shortenNumber } from "./numbers";

export const dateToUnixSeconds = ({
  date,
  mod,
}: {
  date?: Date;
  mod?: "startOfDay" | "endOfDay";
}): number | undefined => {
  if (!date || !(date instanceof Date) || !isValid(date)) return undefined;
  if (mod === "startOfDay")
    return Math.floor(startOfDay(date).getTime() / 1000);
  if (mod === "endOfDay") return Math.floor(endOfDay(date).getTime() / 1000);
  return Math.floor(date.getTime() / 1000);
};

/** Formats a duration in seconds into a human-readable string. */
export function formatDuration(seconds: number | bigint | undefined | null): string {
  if (seconds === undefined || seconds === null) return "0 day";
  const s = typeof seconds === "bigint" ? Number(seconds) : seconds;
  if (!isFinite(s) || s <= 0) return "0 day";
  // i64::MAX or very large value → "Infinite"
  if (s >= 9_007_199_254_740_991) return "Infinite";
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const parts: string[] = [];
  if (days) parts.push(`${shortenNumber({ number: days, decimalPlaces: 2 })} ${days === 1 ? "day" : "days"}`);
  if (hours) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  if (minutes) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  return parts.length ? parts.join(" ") : `${s} seconds`;
}