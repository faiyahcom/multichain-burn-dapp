import type { PoolDetailResponse } from "@/types/pool";
import { Button } from "@/components/common/glow/button";
import { StatRow } from "@/views/burn-pool/detail/amount-activities/components";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const UpcomingStatus = ({ poolDetail: _poolDetail }: Props) => {
    return (
        <>
            <StatRow
                label="Your Total Staked"
                value="0"
                className="text-mb-btn-stake"
                labelClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl"
                valueClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl font-bold"
            />
            <StatRow label="Available to Unstake" value="0" className="ml-4" />
            <StatRow label="Your Total Unstaked" value="0" className="ml-4" />
            <StatRow
                label="Your Reward Accrued"
                value="0"
                className="text-mb-btn-stake"
                labelClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl"
                valueClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl font-bold"
            />
            <StatRow label="Claimable" value="0" className="ml-4" />
            <StatRow label="Your Reward Claimed" value="0" className="ml-4" />
            <StatRow label="Total Fee" value="0" className="ml-4" />
            <p className="text-center text-sm md:text-base lg:text-lg 2xl:text-xl">
                Interest stops accruing upon unstaking.
            </p>
            <Button
                variant="stake"
                className="my-1.5 w-full py-2 font-orbitron text-base md:my-3 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl"
                disabled
            >
                Stake
            </Button>
            {/* <Button
                variant="stake"
                className="my-1.5 w-full py-2 font-orbitron text-base md:my-3 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl"
                disabled
            >
                Claim Reward
            </Button>
            <Button
                variant="stake"
                className="my-1.5 w-full py-2 font-orbitron text-base md:my-3 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl"
                disabled
            >
                Unstake &amp; Claim
            </Button> */}
        </>
    );
};

export default UpcomingStatus;
