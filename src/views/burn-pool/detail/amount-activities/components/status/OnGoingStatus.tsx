import type { PoolDetailResponse } from "@/types/pool";
import { Button } from "@/components/ui/button";
import { ActionBtn, StatRow } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";
import DepositBurnDialog from "../deposit-burn";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import { useMemo } from "react";
import { shortenNumber } from "@/utils/helpers/numbers";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";

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

    const estmatedReward = useMemo(() => {
        if (!poolDetail) return "-";
        const rewardSymbol =
            rewardTokenDisplay?.symbol ?? poolDetail.pool.rewardTokenSymbol;
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
            return `0 ${rewardSymbol}`;
        const reward = (yourCurrentDeposited / totalDeposited) * rewardPool;
        return `${shortenNumber({ number: reward })} ${rewardSymbol}`;
    }, [poolDetail, rewardTokenDisplay]);

    return (
        <PoolChainGuard chainId={poolDetail?.pool.chainId}>
            <StatRow
                label="Estimated Claimable Reward"
                value={`${estmatedReward}`}
                className="font-medium text-active"
                valueClassName="text-2xl font-bold"
            />
            <StatRow
                label="Your Burned Amount"
                value={`${formattedBurned} ${burnTokenDisplay?.symbol ?? ""}`}
            />
            {/* {hasClaimed && (
                <div className="mx-1 inline-flex items-start gap-1">
                    <IconTick className="inline size-3.5 translate-y-0.5" />
                    <span className="text-sm text-greyed">
                        Reward has been sent to your wallet after pool end
                    </span>
                </div>
            )} */}
            <Button className="w-full rounded-sm" disabled>
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
