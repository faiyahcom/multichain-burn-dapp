import { useState, useMemo } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import { safeDecimal } from "@/utils/helpers/numbers";
import StakeDialog from "../../stake-dialog";
import { useStakeEvmFn } from "../../hooks/useStakeEvmFn";
// import { useUnstakeAllEvmFn } from "../../hooks/useUnstakeAllEvmFn";
// import { useClaimAllEvmFn } from "../../hooks/useClaimAllEvmFn";
import { useQueryClient } from "@tanstack/react-query";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useAppKitAccount } from "@reown/appkit/react";
import StakeStats from "./StakeStats";

type Props = {
    poolDetail?: PoolDetailResponse;
    stakeDisabled?: boolean;
};

const OnGoingStatus = ({ poolDetail, stakeDisabled = false }: Props) => {
    const [stakeDialogOpen, setStakeDialogOpen] = useState(false);

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

    const { stakeEvm } = useStakeEvmFn();
    // const { unstakeAllEvm } = useUnstakeAllEvmFn();
    // const { claimAllEvm } = useClaimAllEvmFn();
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
        await stakeEvm({
            poolAddress: poolDetail.pool.address,
            stakingToken: poolDetail.pool.tokenIn,
            amountStr,
            decimals: poolDetail.pool.tokenInDecimals,
        });
        setStakeDialogOpen(false);
        invalidatePool();
    };

    return (
        <>
            <PoolChainGuard chainId={poolDetail?.pool?.chainId} variant="stake">
                <StakeStats
                    poolDetail={poolDetail}
                    onStakeClick={() => setStakeDialogOpen(true)}
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
