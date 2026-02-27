import BN from "bn.js";

export function toBaseUnits(amount: string, decimals: number): BN {
    const [whole, fraction = ""] = amount.split(".");
    const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
    return new BN(whole + paddedFraction);
}