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
    const human = new Decimal(amount)
      .div(new Decimal(10).pow(decimals))
      .toNumber();
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

/**
 * Safely convert any numeric value — including scientific notation like
 * "2.499999999745038091672e+23" that BigInt() cannot parse natively — to a
 * bigint integer.  Fractional parts are truncated (floor toward zero, no rounding).
 * Returns `fallback` (default `0n`) for null / undefined / empty / non-numeric input.
 */
export function safeBigInt(
  value: string | number | bigint | null | undefined,
  fallback: bigint = 0n,
): bigint {
  if (value == null || value === "") return fallback;
  if (typeof value === "bigint") return value;
  try {
    return BigInt(new Decimal(String(value)).toFixed(0, Decimal.ROUND_DOWN));
  } catch {
    return fallback;
  }
}

/**
 * Safely parse any value — including scientific notation like "2.499e+23"
 * and decimals like "1.5" — into a Decimal for lossless arithmetic.
 * Returns `fallback` (default Decimal(0)) for null / undefined / empty / non-numeric input.
 *
 * Use this for calculations that must not round at any intermediate step.
 * Convert to a display string only at the final step via formatAmount / shortenNumber.
 *
 * @example
 *   const remaining = safeDecimal(stakingLimit).sub(safeDecimal(totalStaked));
 *   const display = formatAmount(Decimal.max(0, remaining).toFixed(0, Decimal.ROUND_DOWN), decimals);
 */
export function safeDecimal(
  value: string | number | bigint | null | undefined,
  fallback: Decimal = new Decimal(0),
): Decimal {
  if (value == null || value === "") return fallback;
  try {
    return new Decimal(
      typeof value === "bigint" ? value.toString() : String(value),
    );
  } catch {
    return fallback;
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

  return numbro(number)
    .format({
      average: true,
      mantissa: 2,
      trimMantissa: true,
      ...customFormat,
    })
    .toUpperCase();
};

const formatDecimalDisplay = (val: Decimal, decimalPlaces: number): string => {
  let places = decimalPlaces;
  let truncated = val.toDecimalPlaces(places, Decimal.ROUND_DOWN);

  // If truncation zeroes out a non-zero value, extend precision to the first
  // significant digit so we never display "0" for something like 0.00001.
  if (truncated.isZero() && !val.isZero()) {
    const afterDot = val.abs().toFixed(20).split(".")[1] ?? "";
    const firstSigIdx = afterDot.search(/[1-9]/);
    if (firstSigIdx >= 0) {
      places = firstSigIdx + 1;
      truncated = val.toDecimalPlaces(places, Decimal.ROUND_DOWN);
    }
  }

  const [intPart, fracPart = ""] = truncated.toFixed(places).split(".");
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
}): string => {
  if (typeof number !== "number" || !Number.isFinite(number))
    return String(number);

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
