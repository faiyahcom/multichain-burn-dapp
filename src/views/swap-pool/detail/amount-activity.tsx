import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import type { PoolDetailResponse } from "@/types/pool";
import { formatAmount } from "@/utils/helpers/numbers";
import SwapDialog from "../swap-action/swap-dialog";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useAuthStore } from "@/stores/authStore";
import { IconExclaimation, IconTick } from "@/assets/react";
import { useCancelPoolSolanaFn } from "./cancel-pool/useCancelSwapPoolSolana";
import { useCancelSwapPoolEvmFn } from "./cancel-pool/useCancelSwapPoolEvmFn";
import { useAppKitAccount } from "@reown/appkit/react";
import { Skeleton } from "@/components/ui/skeleton";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import GlowContainer from "@/components/common/glow/container";
import TokenDisplay from "@/components/common/token-display";
import { Button } from "@/components/common/glow/button";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const AmountAndActivity = ({ poolDetail }: Props) => {
    const { user } = useAuthStore();
    const isPoolOwner = user?.address === poolDetail?.pool.owner;
    const { caipAddress } = useAppKitAccount();
    const namespace = caipAddress?.split(":")[0];
    const isSolana = namespace === "solana";
    const { cancelPool: cancelPoolSol } = useCancelPoolSolanaFn();
    const { cancelPool: cancelPoolEvm } = useCancelSwapPoolEvmFn();
    const queryClient = useQueryClient();
    const formattedBurned = poolDetail
        ? formatAmount(
            poolDetail?.userAmount?.deposited || "0",
            poolDetail.pool.tokenInDecimals,
        )
        : "-";
    const formattedReward = poolDetail
        ? formatAmount(
            poolDetail?.userAmount?.claimed || "0",
            poolDetail.pool.rewardTokenDecimals,
        )
        : "-";
    const formattedReturning = poolDetail?.returningAmountOnCanceling
        ? formatAmount(
            poolDetail.returningAmountOnCanceling.amount,
            poolDetail.pool.rewardTokenDecimals,
        )
        : "-";

    const network = poolDetail?.pool.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;
    const burnTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });
    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });
    const [openSwapDialog, setOpenSwapDialog] = useState(false);
    const [isCancelLoading, setIsCancelLoading] = useState(false);
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

    const handleCancelPool = async () => {
        if (!poolDetail) return;
        setIsCancelLoading(true);
        try {
            if (isSolana) {
                await cancelPoolSol({
                    poolAddress: poolDetail.pool.address,
                    poolDetail,
                });
            } else {
                await cancelPoolEvm({
                    poolAddress: poolDetail.pool.address,
                });
            }
            queryClient.invalidateQueries({
                queryKey: poolQueryKeys.detail(poolDetail.pool.address),
                exact: false,
            });
        } finally {
            setIsCancelLoading(false);
        }
    };

    return (
        <GlowContainer
            variant="swap"
            className="w-full px-3 py-4 font-inter md:px-5 md:py-6"
        >
            <p className="mb-4 font-orbitron text-base font-semibold md:mb-8 md:text-xl lg:text-2xl 2xl:text-28px">
                Amount & Activity
            </p>
            <div className="mb-3 flex items-center justify-between">
                <span className="text-base text-mb-gray-b8 md:text-lg lg:text-xl 2xl:text-2xl">
                    Claimed Reward
                </span>
                <span className="text-base font-bold md:text-lg lg:text-xl 2xl:text-2xl">
                    {poolDetail ? (
                        <div className="inline-flex items-center gap-2.5">
                            {formattedReward}
                            <TokenDisplay
                                symbol={poolDetail.tokenOut?.symbol}
                                customSymbol={poolDetail.tokenOut?.customSymbol}
                                imageUri={rewardTokenDisplay.imageUri ?? undefined}
                                classNames={{
                                    img: "size-4.5 md:size-5 2xl:size-5.75",
                                    container: "inline-flex items-center gap-2.5",
                                }}
                            />
                        </div>
                    ) : (
                        <Skeleton className="h-7 w-32" />
                    )}
                </span>
            </div>
            <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-mb-gray-b8 md:text-base lg:text-md 2xl:text-xl">
                    Your Swapped Amount
                </span>
                <span className="text-sm font-bold md:text-base lg:text-md 2xl:text-xl">
                    {poolDetail ? (
                        <div className="inline-flex items-center gap-1.5">
                            {formattedBurned}
                            <TokenDisplay
                                symbol={poolDetail.tokenIn?.symbol}
                                customSymbol={poolDetail.tokenIn?.customSymbol}
                                imageUri={burnTokenDisplay.imageUri ?? undefined}
                                classNames={{
                                    img: "size-3.5 md:size-4 2xl:size-4.25",
                                    container: "inline-flex items-center gap-1.5",
                                }}
                            />
                        </div>
                    ) : (
                        <Skeleton className="h-4 w-24" />
                    )}
                </span>
            </div>
            {poolDetail?.pool.status === "canceled" && isPoolOwner && (
                <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-mb-gray-b8 md:text-base lg:text-md 2xl:text-xl">
                        Your reward token return
                    </span>
                    <span className="text-sm font-bold md:text-base lg:text-md 2xl:text-xl">
                        {poolDetail ? (
                            <div className="inline-flex items-center gap-2.5">
                                {formattedReturning}
                                <TokenDisplay
                                    symbol={poolDetail.tokenOut?.symbol}
                                    customSymbol={poolDetail.tokenOut?.customSymbol}
                                    imageUri={rewardTokenDisplay.imageUri ?? undefined}
                                    classNames={{
                                        img: "size-3.5 md:size-4 2xl:size-4.25",
                                        container: "inline-flex items-center gap-1.5",
                                    }}
                                />
                            </div>
                        ) : (
                            <Skeleton className="h-7 w-32" />
                        )}
                    </span>
                </div>
            )}
            {Number(poolDetail?.userAmount?.claimed || "0") > 0 && (
                <div className="inline-flex items-center gap-1.5 py-1.5 md:gap-2.5">
                    <IconTick className="inline size-3 md:size-3.5" />
                    <span className="text-xs text-mb-gray-b8 md:text-sm 2xl:text-base">
                        Reward has been sent to your wallet after swap
                    </span>
                </div>
            )}
            {poolDetail?.pool.status === "closed" && (
                <div className="inline-flex items-start gap-1.5 py-1.5 md:gap-2.5">
                    <IconExclaimation className="inline size-3 md:size-3.5" />
                    <span className="text-xs text-mb-gray-b8 md:text-sm 2xl:text-base">
                        This pool was emergency closed by admin.
                    </span>
                </div>
            )}

            {poolDetail?.pool.status === "on_going" && (
                <PoolChainGuard chainId={poolDetail?.pool.chainId} variant="swap">
                    <Button
                        variant="swap"
                        onClick={handleOpenSwapDialog}
                        disabled={isCancelLoading}
                        className="my-2 w-full py-2 font-orbitron text-base md:my-3.25 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl"
                        hasHover
                    >
                        Swap
                    </Button>
                    <SwapDialog
                        open={openSwapDialog}
                        onOpenChange={handleCloseSwapDialog}
                        poolDetail={poolDetail}
                        onSuccess={handleSuccessSwap}
                    />
                    {isPoolOwner && (
                        <Button
                            variant="swap"
                            onClick={handleCancelPool}
                            isLoading={isCancelLoading}
                            className="my-2 w-full py-2 font-orbitron text-base md:my-3.25 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl"
                            hasHover
                        >
                            {isCancelLoading ? "Cancelling..." : "Cancel Pool"}
                        </Button>
                    )}
                </PoolChainGuard>
            )}
        </GlowContainer>
    );
};

export default AmountAndActivity;
