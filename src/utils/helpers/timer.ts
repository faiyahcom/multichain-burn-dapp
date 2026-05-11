import { shortenNumber } from "./numbers";

export function formatDuration(seconds: number | bigint | string | undefined | null, roundedMinute?: boolean): string {
    if (seconds === undefined || seconds === null || seconds === "") return "—";
    const s = typeof seconds === "bigint" ? Number(seconds) : Number(seconds);
    if (!isFinite(s) || s < 0) return "—";
    if (s === 0) return "0 day";
    // i64::MAX or very large value → "Infinite"
    if (s >= 9_007_199_254_740_991) return "Infinite";
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const parts: string[] = [];
    if (days) parts.push(`${shortenNumber({number: days})} ${days === 1 ? "day" : "days"}`);
    if (hours) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
    // if case minute and have odd seconds left, we round up
    if (roundedMinute) {
        if (minutes || s % 60) parts.push(`${minutes + (s % 60 ? 1 : 0)} ${minutes + (s % 60 ? 1 : 0) === 1 ? "minute" : "minutes"}`);
    } else {
        if (minutes) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
    }
    return parts.length ? parts.join(" ") : `${s} seconds`;
}
