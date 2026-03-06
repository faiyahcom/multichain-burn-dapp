import { format, isValid } from "date-fns";

export const truncateString = ({
  str,
  left = 6,
  right = 4,
}: {
  str: string;
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
  timestamp: string; // timestamp seconds
  formatStr?: string;
  notFound?: string;
}) => {
  if (!timestamp) return notFound;
  if (timestamp === "0") return notFound;
  const date = new Date(Number(timestamp) * 1000);
  if (!isValid(date)) return notFound;
  return format(date, formatStr);
};
