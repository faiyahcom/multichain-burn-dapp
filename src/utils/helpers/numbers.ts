import BN from "bn.js";
import { formatUnits } from "ethers";
import Decimal from "decimal.js";
import numbro from "numbro";

export function toBaseUnits(amount: string, decimals: number): BN {
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return new BN(whole + paddedFraction);
}

/**
 * Safely parse any numeric value — including scientific notation like "2e+21"
 * that BN.js cannot handle natively — into a BN integer.
 * Returns BN(0) for null / undefined / empty / non-numeric input.
 */
export function parseToBN(value: string | number | null | undefined): BN {
  if (value == null || value === "") return new BN(0);
  try {
    return new BN(new Decimal(value).toFixed(0));
  } catch {
    return new BN(0);
  }
}

export function formatAmountOld(
  amount: string,
  decimals: number,
  digitDisplayed?: number,
): string {
  if (!amount) return "0";
  const amt = Number(amount);
  if (isNaN(amt)) return amount;
  return String(
    shortenNumberOld({
      number: amt / Math.pow(10, decimals),
      decimalPlaces: digitDisplayed ?? undefined,
    }).toUpperCase(),
  );
}

export function formatAmount(
  amount: string,
  decimals: number,
  digitDisplayed?: number,
): string {
  if (!amount) return "0";
  try {
    const human = new Decimal(amount).div(new Decimal(10).pow(decimals)).toNumber();
    return String(
      shortenNumber({
        number: human,
        decimalPlaces: digitDisplayed ?? undefined,
      }),
    ).toUpperCase();
  } catch {
    return "0";
  }
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

const NUMBER_SUFFIXES = [
  { value: 1e18, symbol: "Qi" },
  { value: 1e15, symbol: "Q" },
  { value: 1e12, symbol: "T" },
  { value: 1e9, symbol: "B" },
  { value: 1e6, symbol: "M" },
  { value: 1e3, symbol: "K" },
] as const;

export const shortenNumberOld = ({
  number,
  customFormat,
  decimalPlaces = 6,
}: {
  number: number;
  customFormat?: numbro.Format;
  decimalPlaces?: number;
}) => {
  if (typeof number !== "number") return number;

  if (number < 10000)
    return number.toLocaleString("en-US", {
      maximumFractionDigits: decimalPlaces,
      minimumFractionDigits: 0,
    });

  return numbro(number).format({
    average: true,
    mantissa: 2,
    trimMantissa: true,
    ...customFormat,
  }).toUpperCase();
};

const formatDecimalDisplay = (val: Decimal, decimalPlaces: number): string => {
  const truncated = val.toDecimalPlaces(decimalPlaces, Decimal.ROUND_DOWN);
  const [intPart, fracPart = ""] = truncated.toFixed(decimalPlaces).split(".");
  const intFormatted = BigInt(intPart).toLocaleString("en-US");
  const trimmedFrac = fracPart.replace(/0+$/, "");
  return trimmedFrac ? `${intFormatted}.${trimmedFrac}` : intFormatted;
};

export const shortenNumber = ({
  number,
  decimalPlaces = 6,
}: {
  number: number;
  decimalPlaces?: number;
}) => {
  if (typeof number !== "number" || !Number.isFinite(number)) return number;

  const d = new Decimal(number);
  const abs = d.abs();
  const sign = number < 0 ? "-" : "";

  if (abs.lt(10000)) {
    return `${sign}${formatDecimalDisplay(abs, decimalPlaces)}`;
  }

  for (const { value, symbol } of NUMBER_SUFFIXES) {
    if (abs.gte(value)) {
      return `${sign}${formatDecimalDisplay(abs.div(value), 2)}${symbol}`;
    }
  }

  return `${sign}${formatDecimalDisplay(abs, decimalPlaces)}`;
};
