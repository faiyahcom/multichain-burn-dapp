import { useMemo } from "react";
import Decimal from "decimal.js";
import NetworkDisplay from "@/components/common/network-display";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAmount } from "@/utils/helpers/numbers";
import type { GetFeeStatsResponse } from "@/services/feeService";
import type { FeeRow } from "./fee-table";

export type TabType = "creation" | "settlement";

const STAT_DIALOG_META: Record<
  TabType,
  { title: string; description: string }
> = {
  creation: {
    title: "Creation Fee",
    description: "Breakdown of creation fees collected across all networks",
  },
  settlement: {
    title: "Settlement Fee",
    description: "Detailed breakdown of all tokens transferred for this user",
  },
};

export interface StatBoxDialogProps {
  type: TabType | null;
  statsData: GetFeeStatsResponse | undefined;
  listRows: FeeRow[];
  chainId: string;
  onClose: () => void;
}

const StatBoxDialog = ({
  type,
  statsData,
  listRows,
  chainId,
  onClose,
}: StatBoxDialogProps) => {
  const meta = type ? STAT_DIALOG_META[type] : null;

  const creationBreakdown = useMemo(() => {
    if (type !== "creation") return [];
    const groups: Record<
      string,
      { chainId: string; txnCount: number; fees: string[] }
    > = {};
    for (const row of listRows) {
      if (!groups[row.chainId]) {
        groups[row.chainId] = { chainId: row.chainId, txnCount: 0, fees: [] };
      }
      groups[row.chainId].txnCount++;
      groups[row.chainId].fees.push(row.feeAmount);
    }
    return Object.values(groups);
  }, [type, listRows]);

  const settlementBreakdown = statsData?.settlement_fees ?? [];

  const settlementTotal = useMemo(() => {
    return settlementBreakdown.reduce((sum, item) => {
      const converted = new Decimal(item.amount).div(
        new Decimal(10).pow(item.decimals),
      );
      return sum.plus(converted);
    }, new Decimal(0));
  }, [settlementBreakdown]);

  return (
    <Dialog open={!!type} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-4.25 px-4 py-10 sm:max-w-148.25">
        <DialogHeader className="gap-1">
          <DialogTitle>{meta?.title}</DialogTitle>
          <DialogDescription>{meta?.description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2.5">
          <p className="text-15px font-normal text-secondary-text">
            All token balances on
          </p>
          <NetworkDisplay
            chainId={chainId}
            classNames={{ img: "size-3.75", label: "font-bold text-15px" }}
          />
        </div>

        {type === "creation" ? (
          <div className="w-full space-y-2.25">
            <div className="grid grid-cols-3 rounded-5px bg-inactive py-1.75 *:text-center *:text-base *:font-bold">
              <div>Network</div>
              <div>Transactions</div>
              <div>Total Fee</div>
            </div>
            <div
              className="max-h-[44dvh] space-y-2.25 overflow-y-auto"
              style={{ scrollbarGutter: "stable both-edges" }}
            >
              {creationBreakdown.length === 0 ? (
                <p className="py-6 text-center text-sm text-secondary-text">
                  No data available
                </p>
              ) : (
                creationBreakdown.map((item) => (
                  <div
                    key={item.chainId}
                    className="grid grid-cols-3 rounded-5px bg-inactive/50 py-1.75 *:text-center *:text-15px *:font-normal"
                  >
                    <div>
                      <NetworkDisplay chainId={item.chainId} />
                    </div>
                    <div>{item.txnCount}</div>
                    <div className="flex flex-col gap-0.5">
                      {item.fees.map((fee, i) => (
                        <span key={i}>{fee}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="w-full space-y-2.25">
            {settlementBreakdown.length > 0 && (
              <div className="grid grid-cols-2 rounded-5px bg-inactive py-1.75 *:text-center *:text-base *:font-bold">
                <div>Token</div>
                <div>Amount</div>
              </div>
            )}
            <div
              className="max-h-[44dvh] space-y-2.25 overflow-y-auto"
              style={{ scrollbarGutter: "stable both-edges" }}
            >
              {settlementBreakdown.length === 0 ? (
                <p className="py-6 text-center text-sm text-secondary-text">
                  No data available
                </p>
              ) : (
                settlementBreakdown.map((item) => (
                  <div
                    key={item.token_address}
                    className="grid grid-cols-2 rounded-5px bg-inactive/50 py-1.75 *:text-center *:text-15px"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {item.image_uri && (
                        <img
                          src={item.image_uri}
                          alt={item.symbol}
                          className="size-5 rounded-full object-cover"
                        />
                      )}
                      <span>{item.custom_symbol ?? item.symbol}</span>
                    </div>
                    <div>{formatAmount(item.amount, item.decimals)}</div>
                  </div>
                ))
              )}
            </div>
            {settlementBreakdown.length > 0 && (
              <div
                // This is meant to make the total box wdith the same as the item boxes, not scrollable
                className="mt-5 overflow-y-auto"
                style={{ scrollbarGutter: "stable both-edges" }}
              >
                <div className="grid grid-cols-2 rounded-5px bg-inactive/50 py-1.75 *:text-center *:text-base">
                  <div>Total</div>
                  <div className="font-bold">
                    {settlementTotal.toDecimalPlaces(6).toString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StatBoxDialog;
