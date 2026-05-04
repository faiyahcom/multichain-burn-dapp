import { endOfDay, isValid, startOfDay } from "date-fns";

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
