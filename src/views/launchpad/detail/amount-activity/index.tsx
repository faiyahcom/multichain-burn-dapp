import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import GlowContainer from "@/components/common/glow/container";
import { Button } from "@/components/common/glow/button";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import type { PoolDetailResponse, LaunchpadPoolStatus } from "@/types/pool";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { chainIdToNetworkConfig } from "@/config/networks";
import { formatAmount } from "@/utils/helpers/numbers";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { StatRow } from "@/views/burn-pool/detail/amount-activities/components";
import TokenDisplay from "@/components/common/token-display";
import { useAppKitAccount } from "@reown/appkit/react";
import { useDepositLaunchpadEvmFn } from "../hooks/useDepositLaunchpadEvmFn";
import { useClaimLaunchpadEvmFn } from "../hooks/useClaimLaunchpadEvmFn";
import { useDepositLaunchpadSolFn } from "../hooks/useDepositLaunchpadSolFn";
import { useClaimLaunchpadSolFn } from "../hooks/useClaimLaunchpadSolFn";
import TBDTooltip from "@/views/pool/glow/components/launchpad/tbd-tooltip";
import DepositDialog from "./deposit-dialog";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const AmountActivity = ({ poolDetail }: Props) => {
    const pool = poolDetail?.pool;
    const network = pool?.chainId
        ? chainIdToNetworkConfig(pool.chainId)
        : undefined;

    const saleTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: pool?.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });

    const paymentTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: pool?.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });

    const status = pool?.status as LaunchpadPoolStatus | undefined;
    const claimPolicy = pool?.claimPolicy;
    const distributionMode = pool?.distributionMode;
    const launchpadUser = poolDetail?.launchpad?.user;

    const userDepositedFormatted = launchpadUser?.depositedAmount
        ? formatAmount(launchpadUser.depositedAmount, pool?.tokenInDecimals ?? 0)
        : "0";

    const userAllocationFormatted = launchpadUser?.allocation
        ? formatAmount(launchpadUser.allocation, pool?.rewardTokenDecimals ?? 0)
        : "0";

    const userFeeFormatted = launchpadUser?.fee
        ? formatAmount(launchpadUser.fee, pool?.rewardTokenDecimals ?? 0)
        : "0";

    const userClaimableFormatted = launchpadUser?.claimableAmount
        ? formatAmount(launchpadUser.claimableAmount, pool?.rewardTokenDecimals ?? 0)
        : "0";

    const userClaimedFormatted = launchpadUser?.claimed
        ? formatAmount(launchpadUser.claimed, pool?.rewardTokenDecimals ?? 0)
        : "0";

    const isEndedOrCompleted = status === "ended" || status === "completed";

    const paymentToken = (
        <TokenDisplay
            symbol={paymentTokenDisplay.symbol}
            customSymbol={undefined}
            imageUri={paymentTokenDisplay.imageUri ?? undefined}
            classNames={{
                img: "size-3.5 md:size-4",
                container: "inline-flex items-center gap-1",
            }}
        />
    );

    const saleToken = (
        <TokenDisplay
            symbol={saleTokenDisplay.symbol}
            customSymbol={undefined}
            imageUri={saleTokenDisplay.imageUri ?? undefined}
            classNames={{
                img: "size-3.5 md:size-4",
                container: "inline-flex items-center gap-1",
            }}
        />
    );

    // Claim button shows for "instant" policy or "after_end + claim" policy
    const showClaimButton =
        claimPolicy !== "instant" &&
        claimPolicy === "after_end" &&
        distributionMode === "claim";

    const claimEnabled =
        showClaimButton &&
        launchpadUser?.canClaim === true &&
        (status === "ended" || status === "completed");

    // Deposit button always rendered, enabled only when on_going
    const depositEnabled = status === "on_going";

    // Distribution mode message text
    const distributionMessage = (() => {
        if (claimPolicy === "instant") {
            return "Rewards are distributed instantly upon depositing.";
        }
        if (claimPolicy === "after_end") {
            if (distributionMode === "automatic") {
                return "Your allocation will be automatically distributed when the pool ends.";
            }
            if (distributionMode === "claim") {
                return "Your rewards will be available to claim when the pool ends.";
            }
        }
        return null;
    })();

    const isCompleted = status === "completed";

    const [depositDialogOpen, setDepositDialogOpen] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);

    const { caipAddress } = useAppKitAccount();
    const isSolana = caipAddress?.split(":")[0] === "solana";

    const { depositLaunchpadEvm } = useDepositLaunchpadEvmFn();
    const { claimLaunchpadEvm } = useClaimLaunchpadEvmFn();
    const { depositLaunchpadSol } = useDepositLaunchpadSolFn();
    const { claimLaunchpadSol } = useClaimLaunchpadSolFn();
    const queryClient = useQueryClient();

    const invalidatePool = () => {
        if (pool?.address) {
            queryClient.invalidateQueries({
                queryKey: poolQueryKeys.detail(pool.address),
            });
        }
    };

    const handleDepositConfirm = async (amount: string) => {
        if (!pool || !poolDetail) return;
        if (isSolana) {
            await depositLaunchpadSol({
                poolAddress: pool.address,
                poolDetail,
                amountStr: amount,
            });
        } else {
            await depositLaunchpadEvm({
                poolAddress: pool.address,
                paymentToken: pool.tokenIn,
                amountStr: amount,
                decimals: pool.tokenInDecimals,
            });
        }
        setDepositDialogOpen(false);
        invalidatePool();
    };

    const handleClaim = async () => {
        if (!pool || !poolDetail) return;
        setIsClaiming(true);
        try {
            if (isSolana) {
                await claimLaunchpadSol({ poolAddress: pool.address, poolDetail });
            } else {
                await claimLaunchpadEvm({ poolAddress: pool.address });
            }
            invalidatePool();
        } finally {
            setIsClaiming(false);
        }
    };

    return (
        <>
            <GlowContainer
                variant="launchpad"
                className="w-full space-y-3 px-3 py-4 font-inter md:px-5 md:py-6"
            >
                <p className="font-orbitron text-base font-semibold md:text-xl lg:text-2xl 2xl:text-28px">
                    Amount & Activity
                </p>

                {/* Stats rows */}
                <div>
                    <StatRow
                        label="Your Deposited Amount"
                        value={
                            <span className="inline-flex items-center gap-1.5 md:gap-2.5">
                                {userDepositedFormatted} {paymentToken}
                            </span>
                        }
                        className="text-mb-btn-launchpad"
                        labelClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl"
                        valueClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl font-bold"
                    />
                    {isEndedOrCompleted ? (
                        <>
                            <StatRow
                                label="Claimable"
                                value={
                                    <span className="inline-flex items-center gap-1">
                                        {userClaimableFormatted} {saleToken}
                                    </span>
                                }
                            />
                            <StatRow
                                label="Claimed"
                                value={
                                    <span className="inline-flex items-center gap-1">
                                        {userClaimedFormatted} {saleToken}
                                    </span>
                                }
                            />
                        </>
                    ) : (
                        <StatRow
                            label="Allocation"
                            value={
                                pool?.rewardVisibility === false ? (
                                    <TBDTooltip
                                        classNames={{
                                            container: "gap-2 flex-row-reverse"
                                        }}
                                        tooltipProps={{
                                            classNames: {
                                                icon: "size-3.5 text-xs",
                                            },
                                        }}
                                    />
                                ) : (
                                    <span className="inline-flex items-center gap-1">
                                        {userAllocationFormatted} {saleToken}
                                    </span>
                                )
                            }
                        />
                    )}
                    <StatRow
                        label="Fee"
                        value={
                            !isEndedOrCompleted && pool?.rewardVisibility === false ? (
                                <TBDTooltip
                                    classNames={{
                                        container: "gap-2 flex-row-reverse"
                                    }}
                                    tooltipProps={{
                                        classNames: {
                                            icon: "size-3.5 text-xs",
                                        },
                                    }}
                                />
                            ) : (
                                <span className="inline-flex items-center gap-1">
                                    {userFeeFormatted} {saleToken}
                                </span>
                            )
                        }
                    />
                </div>

                {/* Distribution mode message */}
                {distributionMessage && (
                    <p className="text-xs text-mb-gray-b8 md:text-sm lg:text-base">
                        {distributionMessage}
                    </p>
                )}

                {/* Completed success message */}
                {isCompleted && (
                    <p className="flex items-center text-mb-gray-b8 gap-1.5 text-xs md:text-sm lg:text-base">
                        <span className="text-success">✓</span>
                        <span>All allocations have been distributed successfully.</span>
                    </p>
                )}

                {/* Action buttons */}
                <PoolChainGuard chainId={pool?.chainId} variant="stake">
                    <div className="mt-1 space-y-2">
                        <Button
                            variant="launchpad"
                            hasHover
                            disabled={!claimEnabled}
                            isLoading={isClaiming}
                            onClick={handleClaim}
                            className="my-1 w-full py-2 font-orbitron text-base md:my-2 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl"
                        >
                            Claim
                        </Button>
                        <Button
                            variant="launchpad"
                            hasHover
                            disabled={!depositEnabled}
                            onClick={() => setDepositDialogOpen(true)}
                            className="my-1 w-full py-2 font-orbitron text-base md:my-2 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl"
                        >
                            Deposit
                        </Button>
                    </div>
                </PoolChainGuard>
            </GlowContainer>

            <DepositDialog
                open={depositDialogOpen}
                onOpenChange={setDepositDialogOpen}
                poolDetail={poolDetail}
                onConfirm={handleDepositConfirm}
            />
        </>
    );
};

export default AmountActivity;
