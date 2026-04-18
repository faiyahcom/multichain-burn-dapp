import GlowContainer from "@/components/common/glow/container";
import { Button } from "@/components/common/glow/button";
import { IconStakeCategory, IconParticipant, IconStack } from "@/assets/react";
import { useNavigate } from "@tanstack/react-router";
import StakeStatsImage from "/images/dashboard/stake-stats.png";
import { HeroStatRow } from "./burn-swap-hero";
import type { StakingSection } from "@/services/dashboardService";
import { shortenNumber } from "@/utils/helpers/numbers";

// ── Stake Hero ─────────────────────────────────────────────────────────────────

const StakeHero = ({ stakingSection }: { stakingSection?: StakingSection }) => {
    const navigate = useNavigate();
    const stakedVolume = stakingSection?.stakedAmount != null
        ? shortenNumber({ number: stakingSection.stakedAmount })
        : "—";
    const totalTxns = stakingSection?.totalTxns?.toLocaleString() ?? "—";
    const totalParticipants = stakingSection?.totalParticipant?.toLocaleString() ?? "—";

    return (
        <GlowContainer
            className="relative flex flex-col overflow-visible sm:flex-row"
            variant="stake"
        >
            {/* Left panel — image + CTA */}
            <GlowContainer
                variant="stake"
                className="-mx-0.5 -mt-0.5 -mb-0.5 -ml-0.5 flex flex-col justify-between gap-2 px-5 py-6.25 sm:max-w-19/40"
            >
                <img src={StakeStatsImage} alt="Staking Stats" />
                <Button
                    variant="stake"
                    hasHover
                    size="big"
                    className="sm:h-57px sm:w-275px h-12 w-full font-orbitron text-lg font-medium text-nowrap 2xl:text-xl"
                    onClick={() => navigate({ to: "/staking" })}
                >
                    Join Staking
                </Button>
            </GlowContainer>

            {/* Right panel — stats */}
            <div className="mx-5 flex min-w-0 flex-1 flex-col justify-center space-y-2.5 py-4 font-inter sm:mr-5 sm:ml-7 sm:py-0">
                <div className="flex items-center gap-2">
                    <IconStakeCategory className="size-7.25" />
                    <p className="font-orbitron text-lg font-medium 2xl:text-xl">
                        TOTAL STAKING
                    </p>
                </div>
                <p className="font-orbitron text-2xl font-medium text-mb-btn-stake uppercase sm:text-[32px]">
                    {stakedVolume}
                </p>
                <p className="text-sm font-medium text-mb-gray-b8/60 2xl:text-base">
                    Total Staked Amount
                </p>
                <HeroStatRow
                    icon={<IconStack className="text-mb-btn-stake" />}
                    label="Total Transactions"
                    value={totalTxns}
                    valueClass="text-mb-btn-stake"
                    iconWrapperClassname="bg-[#34D3D3]/10"
                />
                <HeroStatRow
                    icon={<IconParticipant className="text-mb-btn-stake" />}
                    label="Total Participants"
                    value={totalParticipants}
                    valueClass="text-mb-btn-stake"
                    iconWrapperClassname="bg-[#34D3D3]/10"
                />
            </div>
        </GlowContainer>
    );
};

export default StakeHero;
