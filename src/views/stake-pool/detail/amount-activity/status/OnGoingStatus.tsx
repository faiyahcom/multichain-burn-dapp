import { useState, useMemo } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn } from "../components";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import Decimal from "decimal.js";
import { formatAmount, safeDecimal } from "@/utils/helpers/numbers";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import TokenDisplay from "@/components/common/token-display";
import StakeDialog from "../../stake-dialog";
import { useStakeEvmFn } from "../../hooks/useStakeEvmFn";
import { useStakeSolFn } from "../../hooks/useStakeSolFn";
import { useQueryClient } from "@tanstack/react-query";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useAppKitAccount } from "@reown/appkit/react";
import { StatRow } from "@/views/burn-pool/detail/amount-activities/components";
import { IconExclaimation } from "@/assets/react";

type Props = {
    poolDetail?: PoolDetailResponse;
    stakeDisabled?: boolean;
};

const StakeStats = ({
    poolDetail,
    onStakeClick,
    // onClaimClick,
    // onUnstakeClaimClick,
    // claimLoading,
    // unstakeClaimLoading,
    stakeDisabled,
    hasReachedLimit,
}: {
    poolDetail?: PoolDetailResponse;
    onStakeClick: () => void;
    onClaimClick: () => void;
    onUnstakeClaimClick: () => void;
    claimLoading: boolean;
    unstakeClaimLoading: boolean;
    stakeDisabled?: boolean;
    hasReachedLimit?: boolean;
}) => {
    const network = poolDetail?.pool?.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;

    const stakingTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool?.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });

    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool?.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });

    const ua = poolDetail?.staking?.user;
    const tokenInDecimals = poolDetail?.pool?.tokenInDecimals ?? 18;
    const rewardDecimals = poolDetail?.pool?.rewardTokenDecimals ?? 18;

    const fmtStaking = (val?: string) =>
        val ? formatAmount(val, tokenInDecimals) : "0";
    const fmtReward = (val?: string) =>
        val ? formatAmount(val, rewardDecimals) : "0";

    const stakingToken = (
        <TokenDisplay
            symbol={stakingTokenDisplay.symbol}
            customSymbol={undefined}
            imageUri={stakingTokenDisplay.imageUri ?? undefined}
            classNames={{
                img: "size-3.5 md:size-4",
                container: "inline-flex items-center gap-1",
            }}
        />
    );

    const rewardToken = (
        <TokenDisplay
            symbol={rewardTokenDisplay.symbol}
            customSymbol={undefined}
            imageUri={rewardTokenDisplay.imageUri ?? undefined}
            classNames={{
                img: "size-3.5 md:size-4",
                container: "inline-flex items-center gap-1",
            }}
        />
    );

    return (
        <>
            <StatRow
                label="Your Total Staked"
                value={
                    <span className="inline-flex items-center gap-1.5 md:gap-2.5">
                        {fmtStaking(ua?.totalStaked)}
                        <TokenDisplay
                            symbol={stakingTokenDisplay.symbol}
                            customSymbol={undefined}
                            imageUri={stakingTokenDisplay.imageUri ?? undefined}
                            classNames={{
                                img: "size-4 md:size-5 2xl:size-5.75",
                                container: "inline-flex items-center gap-1.5 md:gap-2.5",
                            }}
                        />
                    </span>
                }
                className="text-mb-btn-stake"
                labelClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl"
                valueClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl font-bold"
            />
            <StatRow
                label="Available to Unstake"
                value={
                    <span className="inline-flex items-center gap-1">
                        {fmtStaking(ua?.availableUnstake)} {stakingToken}
                    </span>
                }
                className="ml-4"
            />
            <StatRow
                label="Your Total Unstaked"
                value={
                    <span className="inline-flex items-center gap-1">
                        {fmtStaking(ua?.totalUnstaked)} {stakingToken}
                    </span>
                }
                className="ml-4"
            />
            <StatRow
                label="Your Reward Accrued"
                value={
                    <span className="inline-flex items-center gap-1.5 md:gap-2.5">
                        {fmtReward(ua?.rewardAccrued)}
                        <TokenDisplay
                            symbol={rewardTokenDisplay.symbol}
                            customSymbol={undefined}
                            imageUri={rewardTokenDisplay.imageUri ?? undefined}
                            classNames={{
                                img: "size-4 md:size-5 2xl:size-5.75",
                                container: "inline-flex items-center gap-1.5 md:gap-2.5",
                            }}
                        />
                    </span>
                }
                className="text-mb-btn-stake"
                labelClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl"
                valueClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl font-bold"
            />
            <StatRow
                label="Reward Available to Claim"
                value={
                    <span className="inline-flex items-center gap-1">
                        {fmtReward(ua?.availableClaim)} {rewardToken}
                    </span>
                }
                className="ml-4"
            />
            <StatRow
                label="Your Reward Claimed"
                value={
                    <span className="inline-flex items-center gap-1">
                        {fmtReward(ua?.totalClaimed)} {rewardToken}
                    </span>
                }
                className="ml-4"
            />
            <StatRow
                label="Total Fee"
                value={
                    <span className="inline-flex items-center gap-1">
                        {fmtReward(ua?.totalSettlementFee)} {rewardToken}
                    </span>
                }
                className="ml-4"
            />

            <p className="text-right text-sm md:text-base lg:text-lg 2xl:text-xl">
                Interest stops accruing upon unstaking.
            </p>
            {hasReachedLimit && (
                <div className="inline-flex items-start gap-1">
                    <IconExclaimation className="inline size-5" />
                    <span className="text-sm text-mb-gray-b8">
                        This pool has reached its staking limit and is no longer accepting
                        new stakes
                    </span>
                </div>
            )}
            <ActionBtn
                text="Stake"
                onClick={onStakeClick}
                disabled={stakeDisabled || hasReachedLimit}
            />
            {/* <ActionBtn
                text="Claim Reward"
                onClick={onClaimClick}
                disabled={!canClaim || !hasStakes}
                isLoading={claimLoading}
            />
            <ActionBtn
                text="Unstake & Claim"
                onClick={onUnstakeClaimClick}
                disabled={!hasStakes}
                isLoading={unstakeClaimLoading}
            /> */}
        </>
    );
};

const OnGoingStatus = ({ poolDetail, stakeDisabled = false }: Props) => {
    const [stakeDialogOpen, setStakeDialogOpen] = useState(false);
    const [claimLoading, setClaimLoading] = useState(false);
    const [unstakeClaimLoading, setUnstakeClaimLoading] = useState(false);

    const hasReachedLimit = useMemo(() => {
        const stakePool = poolDetail?.pool as any;
        if (!stakePool?.stakingLimit || stakePool.stakingLimit === "0")
            return false;
        try {
            return safeDecimal(poolDetail?.staking?.totalStaked).gte(
                safeDecimal(stakePool.stakingLimit),
            );
        } catch {
            return false;
        }
    }, [poolDetail?.pool, poolDetail?.staking?.totalStaked]);

    const { caipAddress } = useAppKitAccount();
    const isSolana = caipAddress?.split(":")[0] === "solana";

    const { stakeEvm } = useStakeEvmFn();
    const { stakeSol } = useStakeSolFn();
    const queryClient = useQueryClient();

    const poolAddress = poolDetail?.pool?.address;

    const invalidatePool = () => {
        if (poolAddress) {
            queryClient.invalidateQueries({
                queryKey: poolQueryKeys.detail(poolAddress),
            });
        }
    };

    const handleStakeConfirm = async (amountStr: string) => {
        if (!poolDetail) return;
        if (isSolana) {
            await stakeSol({
                poolAddress: poolDetail.pool.address,
                depositMint: poolDetail.pool.tokenIn,
                assetTypeIn: poolDetail.pool.assetTypeIn,
                amountStr,
                decimals: poolDetail.pool.tokenInDecimals,
            });
        } else {
            await stakeEvm({
                poolAddress: poolDetail.pool.address,
                stakingToken: poolDetail.pool.tokenIn,
                amountStr,
                decimals: poolDetail.pool.tokenInDecimals,
            });
        }
        setStakeDialogOpen(false);
        invalidatePool();
    };

    const handleClaim = async () => {
        // if (!poolAddress || !stakeId) return;
        // setClaimLoading(true);
        // try {
        //     await claimAllEvm({ poolAddress, stakeIds: [stakeId] });
        //     invalidatePool();
        // } finally {
        //     setClaimLoading(false);
        // }
    };

    const handleUnstakeClaim = async () => {
        // if (!poolAddress || !stakeId) return;
        // setUnstakeClaimLoading(true);
        // try {
        //     await unstakeAllEvm({ poolAddress, stakeIds: [stakeId] });
        //     invalidatePool();
        // } finally {
        //     setUnstakeClaimLoading(false);
        // }
    };

    return (
        <>
            <PoolChainGuard chainId={poolDetail?.pool?.chainId} variant="stake">
                <StakeStats
                    poolDetail={poolDetail}
                    onStakeClick={() => setStakeDialogOpen(true)}
                    onClaimClick={handleClaim}
                    onUnstakeClaimClick={handleUnstakeClaim}
                    claimLoading={claimLoading}
                    unstakeClaimLoading={unstakeClaimLoading}
                    stakeDisabled={stakeDisabled}
                    hasReachedLimit={hasReachedLimit}
                />
            </PoolChainGuard>
            <StakeDialog
                open={stakeDialogOpen}
                onOpenChange={setStakeDialogOpen}
                poolDetail={poolDetail}
                onConfirm={handleStakeConfirm}
            />
        </>
    );
};

export default OnGoingStatus;
