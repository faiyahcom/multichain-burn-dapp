import BN from "bn.js";

export function toBaseUnits(amount: string, decimals: number): BN {
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return new BN(whole + paddedFraction);
}

export function formatAmount(amount: string, decimals: number): string {
  if (!amount) return "0";
  const amt = Number(amount);
  if (isNaN(amt)) return amount;
  return (amt / Math.pow(10, decimals)).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}
