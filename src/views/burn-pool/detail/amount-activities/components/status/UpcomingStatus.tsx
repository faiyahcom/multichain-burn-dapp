import type { PoolDetailResponse } from "@/types/pool";
import { Button } from "@/components/common/glow/button";
import { StatRow } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import TokenDisplay from "@/components/common/token-display";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const UpcomingStatus = ({ poolDetail }: Props) => {
    const {
        formattedBurned,
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

    return (
        <>
            <StatRow
                label="Your Burned Amount"
                value={
                    <div className="inline-flex items-center gap-1.5">
                        {formattedBurned}
                        <TokenDisplay
                            symbol={poolDetail?.tokenIn?.symbol}
                            customSymbol={poolDetail?.tokenIn?.customSymbol}
                            imageUri={burnTokenDisplay.imageUri ?? undefined}
                            classNames={{
                                img: "size-3.5 md:size-4 2xl:size-4.25",
                                container: "inline-flex items-center gap-1.5",
                            }}
                        />
                    </div>
                }
                className="text-burn-border/85"
                valueClassName="text-xl font-bold"
            />
            <StatRow label="Estimated Claimable Reward" value="0" />
            <Button
                variant="burn"
                className="my-2 w-full py-2 font-orbitron text-base md:my-3.25 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl"
                disabled
            >
                Claim
            </Button>
            <Button
                variant="burn"
                className="my-2 w-full py-2 font-orbitron text-base md:my-3.25 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl"
                disabled
            >
                Deposit
            </Button>
        </>
    );
};

export default UpcomingStatus;
