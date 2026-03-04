import AnimateIconButton from "@/components/common/animate-icon-button";
import type { PoolDetailResponse } from "@/types/pool";
import { formatAmount } from "@/utils/helpers/numbers";
import SwapDialog from "../swap-action/swap-dialog";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { poolQueryKeys } from "@/services/queries/queryKey";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const AmountAndActivity = ({ poolDetail }: Props) => {
    const queryClient = useQueryClient();
    const formattedBurned = poolDetail
        ? formatAmount(
            poolDetail.userAmount.deposited,
            poolDetail.pool.tokenInDecimals,
        )
        : "-";
    const formattedReward = poolDetail
        ? formatAmount(
            poolDetail.userAmount.claimed,
            poolDetail.pool.rewardTokenDecimals,
        )
        : "-";
    const [openSwapDialog, setOpenSwapDialog] = useState(false);
    const handleOpenSwapDialog = () => {
        setOpenSwapDialog(true);
    };
    const handleCloseSwapDialog = () => {
        setOpenSwapDialog(false);
    };
    const handleSuccessSwap = () => {
        queryClient.invalidateQueries({
            queryKey: [poolQueryKeys.txns(poolDetail?.pool.address || "")],
            exact: false,
        });
        queryClient.invalidateQueries({
            queryKey: [poolQueryKeys.activities(poolDetail?.pool.address || "")],
            exact: false,
        });
        queryClient.invalidateQueries({
            queryKey: poolQueryKeys.detail(poolDetail?.pool.address || ""),
            exact: false,
        });
    };
    return (
        <div className="mt-3 w-full space-y-3 px-6 py-4">
            <span className="flex items-center gap-2 text-xl font-medium">
                Amount & Activity
            </span>
            <div className="flex items-center justify-between text-active">
                <span className="text-sm font-medium">Claimed Reward</span>
                <span className="text-2xl font-bold">
                    {formattedReward} {poolDetail?.pool.rewardTokenSymbol}
                </span>
            </div>
            <div className="flex items-center justify-between text-greyed">
                <span className="text-sm">Your Burned Amount</span>
                <span className="text-sm">
                    {formattedBurned} {poolDetail?.pool.tokenInSymbol}
                </span>
            </div>
            <div className="mx-2">
                <AnimateIconButton
                    iconLetter="S"
                    text="Swap"
                    variant="letter-icon"
                    textVariant="text-container-center"
                    classNames={{
                        btn: "w-full text-center after:text-white after:text-sm after:font-semibold after:bg-active",
                        text: "text-sm font-medium",
                        icon: "size-6",
                    }}
                    color="#966EFF"
                    btnProps={{
                        onClick: handleOpenSwapDialog,
                    }}
                />
            </div>
            <SwapDialog
                open={openSwapDialog}
                onOpenChange={handleCloseSwapDialog}
                poolDetail={poolDetail}
                onSuccess={handleSuccessSwap}
            />
        </div>
    );
};

export default AmountAndActivity;
