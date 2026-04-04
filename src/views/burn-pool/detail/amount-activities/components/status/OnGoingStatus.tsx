import type { PoolDetailResponse } from "@/types/pool";
import { Button } from "@/components/common/glow/button";
import { ActionBtn, StatRow } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";
import DepositBurnDialog from "../deposit-burn";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import { useMemo } from "react";
import { shortenNumber } from "@/utils/helpers/numbers";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import TokenDisplay from "@/components/common/token-display";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const OnGoingStatus = ({ poolDetail }: Props) => {
    const {
        formattedBurned,
        depositBurnOpen,
        setDepositBurnOpen,
        handleDepositBurn,
    } = useAmountActivity(poolDetail);

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

    const estimatedRewardNum = useMemo(() => {
        if (!poolDetail) return "-";
        const decimals = poolDetail.pool.rewardTokenDecimals;
        const totalDeposited =
            Number(poolDetail.depositedAmount) /
            Math.pow(10, poolDetail.pool.tokenInDecimals);
        const rewardPool =
            Number(poolDetail.pool.currentRewardAmount) /
            Math.pow(10, decimals);
        const yourCurrentDeposited =
            Number(poolDetail?.userAmount?.deposited) /
            Math.pow(10, poolDetail.pool.tokenInDecimals);
        if (totalDeposited === 0 || rewardPool === 0 || yourCurrentDeposited === 0)
            return "0";
        const reward = (yourCurrentDeposited / totalDeposited) * rewardPool;
        return shortenNumber({ number: reward }) ?? "0";
    }, [poolDetail]);

    return (
        <PoolChainGuard chainId={poolDetail?.pool.chainId}>
            <StatRow
                label="Estimated Claimable Reward"
                value={
                    <div className="inline-flex items-center gap-1.5 md:gap-2.5">
                        {estimatedRewardNum}
                        <TokenDisplay
                            symbol={poolDetail?.tokenOut?.symbol}
                            customSymbol={poolDetail?.tokenOut?.customSymbol}
                            imageUri={rewardTokenDisplay.imageUri ?? undefined}
                            classNames={{
                                img: "size-4 md:size-5 2xl:size-5.75",
                                container: "inline-flex items-center gap-1.5 md:gap-2.5",
                            }}
                        />
                    </div>
                }
                className="text-burn-border/85"
                valueClassName="text-xl font-bold"
            />
            <StatRow
                label="Your Burned Amount"
                value={
                    <div className="inline-flex items-center gap-1 md:gap-1.5">
                        {formattedBurned}
                        <TokenDisplay
                            symbol={poolDetail?.tokenIn?.symbol}
                            customSymbol={poolDetail?.tokenIn?.customSymbol}
                            imageUri={burnTokenDisplay.imageUri ?? undefined}
                            classNames={{
                                img: "size-3.5 md:size-4 2xl:size-4.25",
                                container: "inline-flex items-center gap-1 md:gap-1.5",
                            }}
                        />
                    </div>
                }
            />
            {/* {hasClaimed && (
                <div className="mx-1 inline-flex items-start gap-1">
                    <IconTick className="inline size-3.5 translate-y-0.5" />
                    <span className="text-sm text-greyed">
                        Reward has been sent to your wallet after pool end
                    </span>
                </div>
            )} */}
            <Button
                variant="burn"
                className="my-2 w-full py-2 font-orbitron text-base md:my-3.25 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl"
                disabled
            >
                Claim
            </Button>
            <ActionBtn
                letter="D"
                text="Deposit"
                onClick={() => setDepositBurnOpen(true)}
            />
            <DepositBurnDialog
                open={depositBurnOpen}
                onOpenChange={setDepositBurnOpen}
                poolDetail={poolDetail}
                onConfirm={handleDepositBurn}
            />
        </PoolChainGuard>
    );
};

export default OnGoingStatus;
