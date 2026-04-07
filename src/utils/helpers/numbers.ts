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
  return String(shortenNumber({ number: amt / Math.pow(10, decimals) }));
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
  if (typeof number !== "number") return number;

  if (number < 10000)
    return number.toLocaleString("en-US", {
      maximumFractionDigits: 6,
      minimumFractionDigits: 0,
    });

  return numbro(number).format({
    average: true,
    mantissa: 2,
    trimMantissa: true,
    ...customFormat,
  });
};

function formatUsd(usd: number): string {
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toPrecision(2)}`;
  return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats a raw (big-integer) native amount as "{humanAmount} {symbol} ~ ${usd}".
 * If `price` is undefined the USD suffix is omitted.
 */
export function formatNativeWithUsd(
  rawAmount: string,
  decimals: number,
  symbol: string,
  price: number | undefined,
): string {
  const humanAmt = Number(rawAmount) / Math.pow(10, decimals);
  const nativePart = `${shortenNumber({ number: humanAmt })} ${symbol}`;
  if (price == null || isNaN(humanAmt)) return nativePart;
  return `${nativePart} ~ ${formatUsd(humanAmt * price)}`;
}

