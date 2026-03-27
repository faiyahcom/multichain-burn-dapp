
import Decimal from "decimal.js";
import { safeDecimalParse, shortenNumber } from "../helpers/numbers";
import type { TokenAmount } from "@/services/dashboardService";

export const sumTokenAmounts = (items: TokenAmount[]): string => {
    const total = items.reduce((acc, item) => {
        const parsed = safeDecimalParse({ value: item.amount, throwValue: null });
        if (!parsed) return acc;
        return acc.add(parsed.div(new Decimal(10).pow(item.decimals)));
    }, new Decimal(0));
    return shortenNumber({ number: total.toNumber() }) as string;
};