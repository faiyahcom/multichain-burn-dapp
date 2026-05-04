export const dateToUnixSeconds = (date?: Date): number | undefined => {
  if (!date) return undefined;
  return Math.floor(date.getTime() / 1000);
};
