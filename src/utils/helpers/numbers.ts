import BN from "bn.js";
import { formatUnits } from "ethers";
import Decimal from "decimal.js";
import numbro from "numbro";

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
    maximumFractionDigits: Math.min(decimals, 4),
  });
}

export function sciToFormatted(value: string, decimals: number): string {
  try {
    const expanded = new Decimal(value).toFixed(0);
    return formatUnits(expanded, decimals);
  } catch (error) {
    console.warn("sciToFormatted: failed to parse value", {
      value,
      decimals,
      error,
    });
    return "0";
  }
}

export const safeDecimalParse = <
  T extends string | null | undefined | number = null,
>({
  value,
  throwValue = null as T,
}: {
  value: string;
  throwValue?: T;
}): Decimal | T => {
  try {
    return new Decimal(value);
  } catch (error) {
    return throwValue as T;
  }
};

export const shortenNumber = ({
  number,
  customFormat,
}: {
  number: number;
  customFormat?: numbro.Format;
}) => {
  return (
    numbro(number)
      .format({
        average: true,
        mantissa: 6,
        trimMantissa: true,
        ...customFormat,
      })
      // This is a hack to fix numbro's formatting to match the design:
      // "." as thousands separator, "," as decimal separator
      .replace(/,/g, "#") // temp placeholder
      .replace(/\./g, ",") // . → ,
      .replace(/#/g, ".") // , → .
  );
};
