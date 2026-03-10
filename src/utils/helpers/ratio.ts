const DECIMAL_RATIO_PATTERN = /^\d+(?:\.\d+)?$/;

const gcd = (a: bigint, b: bigint): bigint => {
  let x = a;
  let y = b;

  while (y !== 0n) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }

  return x;
};

const toRatioString = (value: string | number): string => {
  return typeof value === "string" ? value.trim() : value.toString();
};

export const normalizeRatioToIntegers = (
  burnRatio: string | number,
  rewardRatio: string | number,
) => {
  const burnStr = toRatioString(burnRatio);
  const rewardStr = toRatioString(rewardRatio);

  if (
    !DECIMAL_RATIO_PATTERN.test(burnStr) ||
    !DECIMAL_RATIO_PATTERN.test(rewardStr)
  ) {
    throw new Error("Invalid ratio format. Please use positive numbers.");
  }

  const [, burnFraction = ""] = burnStr.split(".");
  const [, rewardFraction = ""] = rewardStr.split(".");
  const scale = Math.max(burnFraction.length, rewardFraction.length);

  const toScaledInteger = (value: string) => {
    const [whole, fraction = ""] = value.split(".");
    const paddedFraction = fraction.padEnd(scale, "0");
    return BigInt(`${whole}${paddedFraction}`);
  };

  const burnUnits = toScaledInteger(burnStr);
  const rewardUnits = toScaledInteger(rewardStr);

  if (burnUnits === 0n || rewardUnits === 0n) {
    throw new Error("Invalid ratio format. Ratio must be greater than 0.");
  }

  const divisor = gcd(burnUnits, rewardUnits);

  return {
    burnUnits: burnUnits / divisor,
    rewardUnits: rewardUnits / divisor,
  };
};
